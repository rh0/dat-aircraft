const WebDB = require('@beaker/webdb')
const assert = require('assert')
const map = require('./lib/map')

const webdb = new WebDB('flights')

webdb.define('flights', {
  // validate required attributes before indexing
  validate(record) {
    assert(record.icao && typeof record.icao === 'number')
    return true
  },

  // files to index
  filePattern: [
    '/flight_data/*.json'
  ]
})

var allFlights = [];

function updateFlight(flight) {
  if(allFlights[flight.icao] !== undefined) {
    allFlights[flight.icao] = {
      oldLat: allFlights[flight.icao].lat,
      oldLng: allFlights[flight.icao].lng,
      lat: flight.lat,
      lng: flight.lng,
      callsign: flight.callsign
    }
  }
  else {
    allFlights[flight.icao] = {
      lat: flight.lat,
      lng: flight.lng,
      callsign: flight.callsign
    }
  }
}

function updateAllFlights(fetchedFlights) {
  for(var flight in fetchedFlights) {
    flightUpdate = fetchedFlights[flight]
    updateFlight(flightUpdate);
  }
  map.updateFlightPath(allFlights);
}

async function update() {
  fetchedFlights = await webdb.flights.toArray()
  updateAllFlights(fetchedFlights)
}

(async function provision() {
  await webdb.delete()
  await webdb.open()

  await webdb.indexArchive('dat://5263608e35f922e50999b5dd55a33055c324a913f707494d8e796586c09c7f24')

  var fetchedFlights = await webdb.flights.toArray()
  updateAllFlights(fetchedFlights)

  // It may be better to implement flight updates this way rather than
  // looping.  Need to work on the map update though to allow paths to
  // without needing the previous coords.
  /*webdb.flights.on('put-record', ({url, origin, indexedAt, record}) => {
    console.log('record: ', record)
    updateFlight(record)
    map.updateFlightPath(allFlights);
  })*/

 // Flight is gone so remove from the array.
  webdb.flights.on('del-record', ({url, origin, indexedAt}) => {
    var icao = url.split('/').pop().split('.').shift()
    allFlights.splice(icao, 1)
  })

})()

webdb.on('indexes-updated', (url, version) => {
  update()
})

webdb.on('source-missing', (url) => {
  console.log('WebDB could not find', url)
})

