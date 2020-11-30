function createTableFromResults(response) {

    let length = Object.keys(response).length;
    if (length > 0) {
        var hook = document.querySelector(".custom-table-container tbody"),
            currenttable = document.querySelector(".custom-table-container");

        currenttable.style.display = "";
        while (hook.firstChild) {
            hook.removeChild(hook.firstChild);
        }

        var count = 1;
        for (var i = 0; i < Object.keys(response).length; i++) {
            var tr = hook.insertRow();
            var td = tr.insertCell();
            var cell = document.createElement("td");
            var cellText = document.createTextNode(count);
            cell.appendChild(cellText);
            td.appendChild(cell);
            count++;
            for (var j = 0; j < 3; j++) {
                var td = tr.insertCell();
                switch (j) {

                    //column 1
                    case 0:
                        ;
                        var cell = document.createElement("td");
                        var cellText = document.createTextNode(response[i].broker__company);

                        cell.appendChild(cellText);
                        td.appendChild(cell);
                        break;

                        //column 2
                    case 1:
                        var cell = document.createElement("td");
                        var cellText = document.createTextNode(response[i].soldno);

                        cell.appendChild(cellText);
                        td.appendChild(cell);
                        break;

                        //column 3
                    case 2:
                        var cell = document.createElement("td");
                        var cellText = document.createTextNode(Math.round(response[i].avglistprice)
                            .toLocaleString());
                        cell.appendChild(cellText);
                        td.appendChild(cell);
                        break;
                }
            }
        }
    }
}

var rangeSlider = function() {
    var slider = $('.range-slider'),
        range = $('.range-slider__range'),
        value = $('.range-slider__value');

    slider.each(function() {

        value.each(function() {
            var value = $(this).prev().attr('value');
            $(this).html(value + " KM");
        });

        range.on('input', function() {
            $(this).next(value).html(this.value + " KM");
        });
    });
};

rangeSlider();

function removeCircle() {
    if (circle !== undefined) {
        map.removeLayer(circle);
        circle = undefined;
        return 0;
    } else {
        return 1;
    }
}


function addCircle() {
    circle = L.circle([lat, long], {
        color: 'rgb(241,108,100)',
        fillColor: 'rgba(241,122,126,0.63)',
        radius: radius * 1000 //Radius in this case is in meters, so we need to make it KM...
    }).addTo(map);
}




function handleRequest(postdata, url) {
    $.ajax({
        type: 'POST',
        headers: {
            "X-CSRFToken": token
        },
        url: url,
        data: postdata,
        success: function(response) {
            createTableFromResults(response);
            return 0;
        },
        error: function(response) {
            console.log(response);
            return -1;
        }
    });
}

var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttrib = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    osm = L.tileLayer(osmUrl, {
        maxZoom: 18,
        attribution: osmAttrib
    });

var map = L.map('map', {
    drawControl: true
}).setView([60.4015913, 8.0889622], 6).addLayer(osm);


map.on("click", e => {

    // Get lat and long
    lat = e.latlng.lat;
    long = e.latlng.lng;

    //Get the radius from the slider
    radius = document.getElementById('radiusslider').value;
    let action = document.getElementsByClassName("switch-input")[0].checked ? 1 : 0

    console.log(action)

    //Remove the previous circle and create a new one
    removeCircle();
    addCircle();

    if (!handleRequest({
            lat: lat,
            long: long,
            radius: radius,
            action: action,
        }, geosearchurl)) {
        search = 0;
    }
});


$(document).ready(function() {
    $("#searchform").submit(function(e) {
        // prevent from normal form behaviour
        e.preventDefault();
        let action = document.getElementsByClassName("switch-input")[0].checked ? 1 : 0;
        var serializedData = new FormData(e.target).get("searchterm");
        console.log(serializedData);

        if (!handleRequest({
                input: serializedData,
                action: action,
            }, searchurl)) {
            search = 1;
            removeCircle();
        }

    });
});

$(document).ready(function() {
    $("#radiusslider").on('mouseup', function(event) {
        if (lat && long && circle) {
            radius = document.getElementById('radiusslider').value;
            let action = document.getElementsByClassName("switch-input")[0].checked ? 1 : 0

            //Remove the previous circle and create a new one
            removeCircle();
            addCircle();

            if (!handleRequest({
                    lat: lat,
                    long: long,
                    radius: radius,
                    action: action,
                }, geosearchurl)) {
                search = 0;
            }
        }
    });
});


$(document).ready(function() {
    $(".switch-input").click(function(e) {
        console.log("Switch changed");
        var postdata, url;
        let action = document.getElementsByClassName("switch-input")[0].checked ? 1 : 0;
        var serializedData = document.getElementsByName("searchterm")[0].value;
        console.log(serializedData);
        if (lat && long && !search) {
            console.log("latlong defined");
            postdata = {
                lat: lat,
                long: long,
                radius: radius,
                action: action,
            }
            url = geosearchurl;

        } else if (serializedData && search) {
            console.log("searchterm defined");
            postdata = {
                input: serializedData,
                action: action
            }
            url = searchurl;

        } else {
            return 1;

        }

        console.log(postdata);


        handleRequest(postdata, url);

    });
});