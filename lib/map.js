const d3 = require('d3')

// Array of geojson map layers.
var mapPaths = []

// Default state, roughly centered on ATX.
var mapState = {
  scale: 153600,
  translateX: 1000,
  translateY: 600,
  centerLon: -97.733,
  centerLat: 30.266
}

var svg = d3.select('body').append('svg')
    .attr('width', '100%')
    .attr('height', '99vh')

var u = svg.append('g')

var zoom = d3.zoom()
      .on("zoom", function() {
        var transform = d3.event.transform;
        u.attr('transform', transform)
      })

var projection = d3.geoEquirectangular()
  .center([mapState.centerLon, mapState.centerLat])
  .scale(mapState.scale)
  .translate([mapState.translateX, mapState.translateY])

var geoGenerator = d3.geoPath()


function updateMap() {
  geoGenerator.projection(projection).pointRadius(2)

  //loop through our map layers
  for(var pathType in mapPaths) {
    u.selectAll('path.' + pathType)
      .data(mapPaths[pathType].features)
      .enter().append('path')
      .merge(u)
        .attr('d', geoGenerator)
        .attr('class', pathType)
  }

  svg.call(zoom)
    .on('zoom.event')
}

exports.updateFlightPath = function(flights) {
  for(var icao in flights) {
    updateFlight = flights[icao]

    if(updateFlight.oldLat !== undefined && updateFlight.oldLat !== updateFlight.lat) {
      u.select('.plane.icao-' + icao).remove();
      u.append('path')
        .datum({type: 'Point', coordinates: [updateFlight.lng, updateFlight.lat]})
        .attr('class', 'plane flight icao-' + icao)
        .attr('d', geoGenerator)

      //console.log('%s old: %f new: %f', idx, updateFlight.oldLat, updateFlight.lat)
      u.append('path')
        .datum({type: 'LineString', coordinates: [[updateFlight.oldLng, updateFlight.oldLat],[updateFlight.lng, updateFlight.lat]]})
        .attr('class', 'flight icao-' + icao)
        .attr('d', geoGenerator)

      u.selectAll('path.icao-' + icao)
        .interrupt()

      u.selectAll('path.icao-' + icao)
        .style('stroke-opacity', 1)

      u.selectAll('path.icao-' + icao)
        .transition(d3.transition()
          .duration(120000)
          .ease(d3.easeLinear))
          .style('stroke-opacity', 0)
          .style('fill-opacity', 0)
    }
  }
}

const archive = new DatArchive(window.location.toString())

async function grabJSON() {
  var atxRoadsJSON = await archive.readFile('/maps/roadsmid.json')
  var atxWaterJSON = await archive.readFile('/maps/waterarea.json')
  var atxWaterWayJSON = await archive.readFile('/maps/waterways.json')
  var atxAirWayJSON = await archive.readFile('/maps/airways.json')

  mapPaths['lakes'] = JSON.parse(atxWaterJSON)
  mapPaths['rivers'] = JSON.parse(atxWaterWayJSON)
  mapPaths['roads'] = JSON.parse(atxRoadsJSON)
  mapPaths['airports'] = JSON.parse(atxAirWayJSON)

  updateMap()
}

grabJSON()
