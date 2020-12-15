function clearTable(tab, hook) {
    tab.style.display = "";
    while (hook.firstChild) {
        hook.removeChild(hook.firstChild);
    }
}

function createTableFromResults(response) {

    let length = Object.keys(response).length;
    if (length > 0) {
        var hook = document.querySelector(".custom-table-container tbody"),
            currenttable = document.querySelector(".custom-table-container");

        clearTable(currenttable, hook);

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
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            headers: {
                "X-CSRFToken": token
            },
            url: url,
            data: postdata,
            success: function(response) {
                if (response.length) {
                    createTableFromResults(response);
                    resolve(0);
                } else {
                    reject(1);
                }
            },
            error: function(response) {
                reject(2);
            }
        });
    })
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

    //Remove the previous circle and create a new one
    removeCircle();
    addCircle();

    handleRequest({
            lat: lat,
            long: long,
            radius: radius,
            action: action,
        }, geosearchurl)
        .then(function() { // Resolve
            search = 0;
            document.getElementById('resulttable').scrollIntoView();
        }).catch(function(msg) { // Reject!
            if (msg === 1) {
                clearTable(document.querySelector(".custom-table-container"), document.querySelector(".custom-table-container tbody"));
                $("#map").addClass("pulse-danger");
                setTimeout(function() {
                    $("#map").removeClass('pulse-danger');
                }, 3000);
            }
        });

});


$(document).ready(function() {
    $("#searchform").submit(function(e) {
        // prevent from normal form behaviour
        e.preventDefault();
        let action = document.getElementsByClassName("switch-input")[0].checked ? 1 : 0;
        var serializedData = new FormData(e.target).get("searchterm");

        // if (!handleRequest({
        //         input: serializedData,
        //         action: action,
        //     }, searchurl)) {
        //     search = 1;

        //     document.getElementById('resulttable').scrollIntoView();
        // }
        handleRequest({
                input: serializedData,
                action: action,
            }, searchurl)
            .then(function() { // Resolve
                search = 1;
                removeCircle();
                document.getElementById('resulttable').scrollIntoView();
            }).catch(function(msg) { // Reject!
                if (msg === 1) {
                    clearTable(document.querySelector(".custom-table-container"), document.querySelector(".custom-table-container tbody"));
                    $("#searchform").addClass("pulse-danger");
                    setTimeout(function() {
                        $("#searchform").removeClass('pulse-danger');
                    }, 3000);
                }
            });

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

            handleRequest({
                    lat: lat,
                    long: long,
                    radius: radius,
                    action: action,
                }, geosearchurl)
                .then(function() { // Resolve
                    search = 0;
                }).catch(function(msg) { // Reject!
                    if (msg === 1) {
                        clearTable(document.querySelector(".custom-table-container"), document.querySelector(".custom-table-container tbody"));
                        $("#map").addClass("pulse-danger");
                        setTimeout(function() {
                            $("#map").removeClass('pulse-danger');
                        }, 3000);
                    }
                });

        }
    });
});


$(document).ready(function() {
    $(".switch-input").click(function(e) {
        var postdata, url;
        let action = document.getElementsByClassName("switch-input")[0].checked ? 1 : 0;
        var serializedData = document.getElementsByName("searchterm")[0].value;
        if (lat && long && !search) {
            postdata = {
                lat: lat,
                long: long,
                radius: radius,
                action: action,
            }
            url = geosearchurl;

        } else if (serializedData && search) {
            postdata = {
                input: serializedData,
                action: action
            }
            url = searchurl;

        } else {
            return 1;

        }
        handleRequest(postdata, url).then(function() { // Resolve
        }).catch(function(msg) { // Reject!

        });
    });
});