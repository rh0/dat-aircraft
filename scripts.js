const WebDB = require('@beaker/webdb')
const assert = require('assert')
//const yo = require('yo-yo')
const d3 = require('d3')
const topojson = require('topojson')
//const webdb = new WebDB('flights')

var geojson,
    waterjson,
    waterwayjson

var mapState = {
  scale: 153600,
  translateX: 600,
  translateY: 400,
  centerLon: -97.733,
  centerLat: 30.266
}

var projection = d3.geoEquirectangular()
var geoGenerator = d3.geoPath()
var u = d3.select('#map g.map')

function updateMap() {
  projection
    .center([mapState.centerLon, mapState.centerLat])
    .scale(mapState.scale)
    .translate([mapState.translateX, mapState.translateY])

  geoGenerator.projection(projection)

  u.selectAll('path.waterway')
    .data(waterwayjson.features)
    .enter().append('path')
    .attr('d', geoGenerator)
    .attr('class', 'waterway')

  u.selectAll('path.roads')
    .data(geojson.features)
    .enter().append('path')
    .attr('d', geoGenerator)
    .attr('class', 'roads')

  u.selectAll('path.water')
    .data(waterjson.features)
    .enter().append('path')
    .attr('d', geoGenerator)
    .attr('class', 'water')

  /*u.enter()
    .append('path')
    .merge(u)
    .attr('d', geoGenerator)*/
}

var lastX,
    lastY

function mouseMapMove(e) {
  transformX = e.clientX - lastX
  transformY = e.clientY - lastY
  lastX = e.clientX
  lastY = e.clientY

  mapState.translateX = mapState.translateX + transformX
  mapState.translateY = mapState.translateY + transformY
  updateMap();
}


document.addEventListener('mousedown', function(e) {
  lastX = e.clientX
  lastY = e.clientY
  document.addEventListener('mousemove', mouseMapMove, true)
}, true)

document.addEventListener('mouseup', function(e) {
  document.removeEventListener('mousemove', mouseMapMove, true)
})



const archive = new DatArchive('dat://a7f4c0fa33c33d5589e5f638d369c75e028a7a0136d31630a1d914242d9b2457/')

//console.log(archive)

async function grabJSON() {
  var atxRoadsJSON = await archive.readFile('/roughroads.json')
  var atxWaterJSON = await archive.readFile('/waterarea.json')
  var atxWaterWayJSON = await archive.readFile('/waterways.json')
  geojson = JSON.parse(atxRoadsJSON)
  waterjson = JSON.parse(atxWaterJSON)
  waterwayjson = JSON.parse(atxWaterWayJSON)
  updateMap()
}

grabJSON()

/*webdb.define('flights', {
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
var flightTable = table(allFlights)

function table(flights) {
  return yo`<table>
    <tr>
      <th>icao</th>
      <th>callsign</ht>
      <th>Heading</th>
      <th>Lat</th>
      <th>Lon</th>
      <th>Altitude</th>
    </tr>
    ${flights.map(function(flight) {
      return yo`<tr>
          <td>${flight.icao}</td>
          <td>${flight.callsign}</td>
          <td>${flight.heading}</td>
          <td>${flight.lat}</td>
          <td>${flight.lng}</td>
          <td>${flight.altitude}</td>
        </tr>`
    })}
    </table>`
}

async function provision() {
  await webdb.open()
  console.log('Open DB')

  await webdb.indexArchive('dat://42c615f4fa11a5ccaf890fef14e31b7c3089861a66ffdce1b5e3b29fe67c9709/')
  console.log('indexed...')

  var allFlights = await webdb.flights.toArray()
  //console.log(allFlights)
}

async function update() {
  allFlights = await webdb.flights.toArray()
  var newTable = table(allFlights)
  yo.update(flightTable, newTable)
}

provision()
webdb.on('indexes-updated', (url, version) => {
  update()
})
document.body.appendChild(flightTable)*/
