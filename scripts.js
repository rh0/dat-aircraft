const WebDB = require('@beaker/webdb')
const assert = require('assert')
const d3 = require('d3')
const webdb = new WebDB('flights')

var geojson,
    waterjson,
    waterwayjson,
    airwayjson

var mapState = {
  scale: 153600,
  translateX: 1000,
  translateY: 600,
  centerLon: -97.733,
  centerLat: 30.266
}

var zoom = d3.zoom()
    .on("zoom", zoomed)

var projection = d3.geoEquirectangular()
projection
  .center([mapState.centerLon, mapState.centerLat])
  .scale(mapState.scale)
  .translate([mapState.translateX, mapState.translateY])
var geoGenerator = d3.geoPath()
var svg = d3.select('body').append('svg')
    .attr('width', '100%')
    .attr('height', '99vh')

var u = svg.append('g')

function updateMap() {
  geoGenerator.projection(projection)

  u.selectAll('path.waterway')
    .data(waterwayjson.features)
    .enter().append('path')
    .merge(u)
      .attr('d', geoGenerator)
      .attr('class', 'waterway')

  u.selectAll('path.water')
    .data(waterjson.features)
    .enter().append('path')
    .merge(u)
      .attr('d', geoGenerator)
      .attr('class', 'water')

  u.selectAll('path.roads')
    .data(geojson.features)
    .enter().append('path')
    .merge(u)
      .attr('d', geoGenerator)
      .attr('class', 'roads')

  u.selectAll('path.airway')
    .data(airwayjson.features)
    .enter().append('path')
    .merge(u)
      .attr('d', geoGenerator)
      .attr('class', 'airway')

  svg.call(zoom)
    .on('zoom.event')
}

function updateFlightPath() {
  for(var icao in allFlights) {
    updateFlight = allFlights[icao]

    if(updateFlight.oldLat !== undefined && updateFlight.oldLat !== updateFlight.lat) {
      //console.log('%s old: %f new: %f', idx, updateFlight.oldLat, updateFlight.lat)
      u.append('path')
      .datum({type: 'LineString', coordinates: [[updateFlight.oldLng, updateFlight.oldLat],[updateFlight.lng, updateFlight.lat]]})
      .attr('class', 'flight icao-' + icao)
      .attr('d', geoGenerator)

      u.selectAll('path.icao-' + icao)
        .interrupt()

      u.selectAll('path.icao-' + icao)
        .interrupt()

      u.selectAll('path.icao-' + icao)
        .style('stroke-opacity', 1)

      u.selectAll('path.icao-' + icao)
        .transition(d3.transition()
          .duration(120000)
          .ease(d3.easeLinear))
          .style('stroke-opacity', 0)
    }
  }
}

function zoomed() {
  var transform = d3.event.transform;
  u.attr('transform', transform)
}



const archive = new DatArchive('dat://a7f4c0fa33c33d5589e5f638d369c75e028a7a0136d31630a1d914242d9b2457/')

//console.log(archive)

async function grabJSON() {
  var atxRoadsJSON = await archive.readFile('/roadsmid.json')
  var atxWaterJSON = await archive.readFile('/waterarea.json')
  var atxWaterWayJSON = await archive.readFile('/waterways.json')
  var atxAirWayJSON = await archive.readFile('/airways.json')
  geojson = JSON.parse(atxRoadsJSON)
  waterjson = JSON.parse(atxWaterJSON)
  waterwayjson = JSON.parse(atxWaterWayJSON)
  airwayjson = JSON.parse(atxAirWayJSON)
  updateMap()
}

grabJSON()

webdb.define('flights', {
  // validate required attributes before indexing
  validate(record) {
    assert(record.icao && typeof record.icao === 'number')
    return true
  },

  // files to index
  filePattern: [
    '/*.json'
  ]
})

var allFlights = [];

async function provision() {
  await webdb.open()
  console.log('Open DB')

  await webdb.indexArchive('dat://0d35b16c5423970018feb9633ac1f2680e68528e6ba0c8ca733ef1c6194769e9')
  console.log('indexed...')

  var fetchedFlights = await webdb.flights.toArray()
  updateFlights(fetchedFlights)
}

function updateFlights(fetchedFlights) {
  for(var flight in fetchedFlights) {
    flightUpdate = fetchedFlights[flight]
    if(allFlights[flightUpdate.icao] !== undefined) {
      allFlights[flightUpdate.icao] = {
        oldLat: allFlights[flightUpdate.icao].lat,
        oldLng: allFlights[flightUpdate.icao].lng,
        lat: flightUpdate.lat,
        lng: flightUpdate.lng
      }
    }
    else {
      allFlights[flightUpdate.icao] = {
        lat: flightUpdate.lat,
        lng: flightUpdate.lng
      }
    }
  }
  updateFlightPath();
}

async function update() {
  fetchedFlights = await webdb.flights.toArray()
  updateFlights(fetchedFlights)
}

provision()
webdb.on('indexes-updated', (url, version) => {
  update()
})
