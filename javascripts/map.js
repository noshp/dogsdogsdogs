var dog = "2013 licences sold by fsa (1)_DOG"
var cat = "2013 licences sold by fsa (1)_CAT"
var money = 'cwb_2011_1452011148713_eng (1)_Income / Revenu 2011'
var labor = 'cwb_2011_1452011148713_eng (1)_Labour Force Activity / Activité sur le marché du travail 2011'

function uploadJson(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file,  false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {	                
                console.log('Uploaded:' + file);	               
            }
        }
    }
    rawFile.send();
    return JSON.parse(rawFile.responseText);
}

function getColor(d) {
    return d > 1000 ? '#084594' :
           d > 800 ? '#2171b5' :
           d > 500 ? '#4292c6' :
           d > 250 ? '#6baed6' :
           d > 100 ? '#9ecae1' :
           d > 50 ? '#c6dbef' :
           d > 20 ? '#deebf7' :
                    '#f7fbff' ;
}


function styleDog(feature) {
    return {
        fillColor: getColor(feature.properties[dog]),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.5
    };

}

function styleCat(feature) {
    return {
        fillColor: getColor(feature.properties[cat]),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.5
    };

}




function onEachFeature(feature, layer)
{
	layer.bindPopup(
        '<b align = "center">Forward Sortation Area: </b>' + feature.properties.CFSAUID
        + '<br><b>Number of Dogs: </b>' + feature.properties[dog]
        + '<br><b>Number of Cats: </b>' + feature.properties[cat]
        + '<canvas id="myChart"></canvas>')
  
	layer.on({
				mouseover: function() {layer.setStyle({fillOpacity: 1}) },
				mouseout: function() {layer.setStyle({fillOpacity: 0.5}) },
                click: function(){
                    var ctx = document.getElementById("myChart");


                    var myChart = new Chart(ctx,
                            {
                                type: "bar",
                                data: {
                                    labels: ['Dogs', 'Cats'],
                                    datasets: [{
                                        label: 'Cats and Dogs',
                                        data: [feature.properties[dog], feature.properties[cat]]
                                        }]
                                    }
                            });
                }
			})
}


