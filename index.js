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
  await webdb.open()
  console.log('Open DB')

  await webdb.indexArchive('dat://879a67f30e8ccd117c731c9eb4d7f45a8200bcc58bffa20c77855e3980ecaf72')
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
/*webdb.on('source-indexed', (url, version) => {
  //console.log('Source Indexed.')
})*/
webdb.on('indexes-updated', (url, version) => {
  update()
})

webdb.on('source-missing', (url) => {
  console.log('WebDB could not find', url, ' ...continues searching')
})

webdb.on('source-error', (url, err) => {
  console.log('An error has occured for ', url, ': ',err)
})
