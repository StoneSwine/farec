from typing import cast
from django.shortcuts import render
from django.db.models.expressions import RawSQL, Subquery
from django.db.backends.signals import connection_created
from django.dispatch import receiver
from django.http import JsonResponse, HttpResponse
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import FloatField, F, ExpressionWrapper
from django.db.models import Count, Avg

from index.models import item, place

import math
import json


@receiver(connection_created)
def extend_sqlite(connection=None, **kwargs):
    if connection.vendor == "sqlite":
        # sqlite doesn't natively support math functions, so add them
        connection.connection.create_function('acos', 1, math.acos)
        connection.connection.create_function('cos', 1, math.cos)
        connection.connection.create_function('radians', 1, math.radians)
        connection.connection.create_function('sin', 1, math.sin)
        connection.connection.create_function('least', 2, max)
        connection.connection.create_function('greatest', 2, min)

# https://stackoverflow.com/questions/19703975/django-sort-by-distance
def get_locations_nearby_coords(latitude, longitude, max_distance):
    """
    Return objects sorted by distance to specified coordinates
    which distance is less than max_distance given in kilometers
    """

    # Great circle distance formula --> should be safe for sql injections
    distance_raw_sql = RawSQL(
        " 3959 * acos( cos( radians(%s) ) * cos( radians( latitude ) ) * cos( radians(longitude ) - radians(%s) ) + sin( radians(%s) ) * sin(radians(latitude)) )",
        (latitude, longitude, latitude)
    )

    # alternative method:
    # UserParent.objects.filter(user_id__in=Subquery(users.values('id')))

    res = place.objects.all().exclude(latitude__isnull=True).exclude(longitude__isnull=True).annotate(
        distance=distance_raw_sql).order_by('distance').filter(distance__lte=max_distance).values_list('id', flat=True)

    return res


"""
Render the page initially
"""


def index(request):
    return render(request, 'index.html', {"context": ""})


# Get the searchfilters and return the correct stuff
def search(request):
    reqvals = ["action", "input"]
    res = None 
    orderby = 'score'
    if request.method == "POST" and request.is_ajax() and all(x in request.POST for x in reqvals):

        req_action = request.POST.get("action")
        req_input = request.POST.get("input")
        if not req_input.strip():
            return JsonResponse({"success": False}, status=400)

        try:
            orderby = '-score' if int(req_action) == 0 else 'score'
            # Get the current areas nearby the selected location and the radius
            postalcode = int(req_input)

            res = item.objects.all().select_related().exclude(soldprice__isnull=True).values("broker__company",
                                                                                             ).filter(
                place__postalcode__exact=postalcode).annotate(
                soldno=Count('broker__company')).annotate(avglistprice=Avg("listprice")).annotate(score=ExpressionWrapper(
                    (Count(F('broker__company'))) * (
                        (Avg(F("soldprice"), output_field=FloatField())) - (Avg(F("listprice"), output_field=FloatField()))),
                    output_field=FloatField())).order_by(orderby)[:15]

        except ValueError:
            res = item.objects.all().select_related().exclude(soldprice__isnull=True).values("broker__company",
                                                                                            ).filter(
                place__name__contains=req_input).annotate(
                soldno=Count('broker__company')).annotate(avglistprice=Avg("listprice")).annotate(score=ExpressionWrapper(
                    (Count(F('broker__company'))) * (
                        (Avg(F("soldprice"), output_field=FloatField())) - (Avg(F("listprice"), output_field=FloatField()))),
                    output_field=FloatField())).order_by(orderby)[:15]
                
        data = json.dumps(list(res), cls=DjangoJSONEncoder)
        return HttpResponse(data, content_type='application/json')
    return JsonResponse({"success": False}, status=400)


"""
Get brokers from houses sold in lat / long
"""


def geosearch(request):

    reqvals = ["action", "lat", "long", "radius"]
    if request.method == "POST" and request.is_ajax() and all(x in request.POST for x in reqvals):
        try:
            req_action = request.POST.get("action")
            req_lat = request.POST.get("lat")
            req_long = request.POST.get("long")
            req_radius = request.POST.get("radius")
            req_radius = int(req_radius)
            if req_radius < 0 or req_radius > 120:
                return JsonResponse({"success": False}, status=400)

            orderby = '-score' if int(req_action) == 0 else 'score'
            # Get the current areas nearby the selected location and the radius

            areasinrange = get_locations_nearby_coords(
                float(req_lat), float(req_long), req_radius)
        except ValueError:
            return JsonResponse({"success": False}, status=400)

        # Get the brokers which have sold houses in that area
        res = item.objects.all().select_related().exclude(soldprice__isnull=True).values("broker__company",
                                                                                         ).filter(
            place_id__in=areasinrange).annotate(
            soldno=Count('broker__company')).annotate(avglistprice=Avg("listprice")).annotate(score=ExpressionWrapper(
                (Count(F('broker__company'))) * (
                    (Avg(F("soldprice"), output_field=FloatField())) - (Avg(F("listprice"), output_field=FloatField()))),
                output_field=FloatField())).order_by(orderby)[:15]

        data = json.dumps(list(res), cls=DjangoJSONEncoder)

        return HttpResponse(data, content_type='application/json')

    return JsonResponse({"success": False}, status=400)
