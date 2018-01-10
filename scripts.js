const WebDB = require('@beaker/webdb')
const assert = require('assert')
var webdb = new WebDB('flights')

console.log('BOOP BEEP')

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

async function run() {
  await webdb.open()
  console.log('Open DB')

  await webdb.indexArchive('dat://6c14108eab535dfd4b950ced85ddbe1d9eda10122b9895b86b7a6cc8c8027c8f')
  console.log('indexed...')

  var allFlights = await webdb.flights.toArray()
  console.log(allFlights)
}

run()
