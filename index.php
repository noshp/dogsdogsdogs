<html>
<head>
    <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.css" />
    <script src="http://cdn.leafletjs.com/leaflet/v0.7.7/leaflet.js"></script>
    <script src="leaflet.ajax.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script>
    <script src='//api.tiles.mapbox.com/mapbox.js/plugins/leaflet-omnivore/v0.3.1/leaflet-omnivore.min.js'></script>
    <script src='map.js'></script>
</head>

<body>
<?php
/**
 * Created by PhpStorm.
 * User: mackenzienichols
 * Date: 5/14/16
 * Time: 3:01 PM
 */


?>

<div id = "mapid" style = "height:100%; width:100%"></div>

<script>
    var mymap = L.map('mapid').setView([43.7, -79.4], 11);

    var json = uploadJson('petsbyfsa_toronto.geojson');

    console.log(json.features);
    for (i=0; i < json.features.length; i++)
    {
        console.log(json.features[i].properties["2013 licences sold by fsa (1)_DOG"])
        json.features[i].properties["2013 licences sold by fsa (1)_DOG"] = json.features[i].properties["2013 licences sold by fsa (1)_DOG"].replace(",","");
        console.log(json.features[i].properties["2013 licences sold by fsa (1)_DOG"])
    }
    var dogMap = L.geoJson(json, {style: styleDog, onEachFeature: onEachFeature}).addTo(mymap);
    var catMap = L.geoJson(json, {style: styleCat, onEachFeature: onEachFeature});

    L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFja2VuemllbiIsImEiOiJjaW1pbTZmMWwwMGU1dTFrcW0wenNiNGZ0In0.ys8ti05bu3iKf06cK9r82Q', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        minZoom: 7,
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1IjoibWFja2VuemllbiIsImEiOiJjaW1pbTZmMWwwMGU1dTFrcW0wenNiNGZ0In0.ys8ti05bu3iKf06cK9r82Q'
    }).addTo(mymap);



    var legend = L.control({position: 'topright'});

    legend.onAdd = function(mymap)
    {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML += 'Less<br><i style=" background-color:' + getColor(0) + '"></i>' +
                            '<br><br><i style="height:50px ;width:50px;border-color: black; border-width: 1px;border-style: solid; background-color:' + getColor(2000) + '"></i><br>More';
        return div;
    }

    legend.addTo(mymap);

    var csd =
    {
        "Dogs" : dogMap,
        "Cats" : catMap
    }

    L.control.layers(csd).addTo(mymap);

</script>

<style>
    .legend {
        line-height: 18px;
        color: #555;
        background-color: white;
        padding: 15px;
        border-color: black;
        border-width: 1px;
        border-style: solid;
    }
    .legend i {

        float: left;
        margin-right: 8px;
        opacity: 0.7;
        height:50px ;
        width:50px;
        border-color: black;
        border-width: 1px;
        border-style: solid;
    }

</style>



</body>
</html>
