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

async function provision() {
  await webdb.delete()
  await webdb.open()

  await webdb.indexArchive('dat://5263608e35f922e50999b5dd55a33055c324a913f707494d8e796586c09c7f24')

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
        lng: flightUpdate.lng,
        callsign: flightUpdate.callsign
      }
    }
    else {
      allFlights[flightUpdate.icao] = {
        lat: flightUpdate.lat,
        lng: flightUpdate.lng,
        callsign: flightUpdate.callsign
      }
    }
  }
  map.updateFlightPath(allFlights);
}

async function update() {
  fetchedFlights = await webdb.flights.toArray()
  updateFlights(fetchedFlights)
}

provision()

webdb.on('open', () => {
  console.log('Database opened.')
})

webdb.on('open-failed', (err) => {
  console.log('Database failed to open', err)
})

webdb.on('indexes-updated', (url, version) => {
  update()
})

webdb.on('source-missing', (url) => {
  console.log('WebDB could not find', url, ' ...continues searching')
})

webdb.on('source-found', (url) => {
  console.log('WebDB found:', url)
})

/*webdb.on('source-indexed', (url, version) => {
  console.log('Source Indexed: Tables were updated for', url, 'at version', version)
})*/

webdb.on('indexes-reset', () => {
  console.log('WebDB detected a change in schemas and reset all indexes')
})

webdb.on('source-error', (url, err) => {
  console.log('An error has occured for ', url, ': ',err)
})
