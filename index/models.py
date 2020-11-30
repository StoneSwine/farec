# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each ForeignKey has `on_delete` set to the desired behavior.
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


# Django comes with a utility called 'inspectdb' that can create models by introspecting an existing database. You can
# view the output by running this command:
# $ python3 manage.py inspectdb > map/models.py


class broker(models.Model):
    id = models.AutoField(unique=True, primary_key=True)
    company = models.TextField()

    class Meta:
        managed = False
        db_table = 'broker'


class place(models.Model):
    id = models.AutoField(unique=True, primary_key=True)
    postalcode = models.IntegerField()
    name = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    council = models.TextField()

    class Meta:
        managed = False
        db_table = 'place'


class item(models.Model):
    id = models.IntegerField(unique=True, primary_key=True)
    sqm = models.FloatField()
    type = models.TextField()
    soldprice = models.IntegerField(blank=True, null=True)
    listprice = models.IntegerField()
    broker = models.ForeignKey(broker, on_delete=models.CASCADE)
    place = models.ForeignKey(place, on_delete=models.CASCADE)
    soldyear = models.IntegerField(blank=True, null=True)
    soldmonth = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'item'
