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

  // Make double sure its unindexed
  var urls = await webdb.listSources()
  if(urls.length > 0) {
    for(var url in urls) {
      await webdb.unindexArchive(urls[url])
    }
  }

  await webdb.indexArchive('dat://629d0514f3b059b0aaf2f8e8376b7713c2a05e5fc8f125df3560d29305d8ab00')

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

  // Rework how things are removed from the archive in dat-adsb
  // funny stuff happens here with flights going in and out, but
  // it would be good to clean up the array when flights are removed.
  // Flight is gone so remove from the array.
  /*webdb.flights.on('del-record', ({url, origin, indexedAt}) => {
    var icao = url.split('/').pop().split('.').shift()
    allFlights.splice(icao, 1)
  })*/

})()

webdb.on('indexes-updated', (url, version) => {
  update()
})

webdb.on('source-missing', (url) => {
  console.log('WebDB could not find', url)
})

