const WebDB = require('@beaker/webdb')
const assert = require('assert')
const webdb = new WebDB('flights')
const map = require('./lib/map')


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

  await webdb.indexArchive('dat://7a62116df8bd953cb9075a11930b1e67b32bf12da5ff8d5f2592017cdca37198')
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
