const WebDB = require('@beaker/webdb')
const assert = require('assert')
const yo = require('yo-yo')
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

function table(flights) {
  return yo`<table>
    <tr>
      <th>icao</th>
      <th>callsign</ht>
      <th>Heading</th>
      <th>Lat</th>
      <th>Lon</th>
    </tr>
    ${flights.map(function(flight) {
      return yo`<tr>
          <td>${flight.icao}</td>
          <td>${flight.callsign}</td>
          <td>${flight.heading}</td>
          <td>${flight.lat}</td>
          <td>${flight.lng}</td>
        </tr>`
    })}
    </table>`
}

async function run() {
  await webdb.open()
  console.log('Open DB')

  await webdb.indexArchive('dat://d89ec0a7b53f0be87069f707da8abb77f23d6c1abb3915e0afee637d9555af20')
  console.log('indexed...')

  var allFlights = await webdb.flights.toArray()
  console.log(allFlights)
  var flightTable = table(allFlights)
  document.body.appendChild(flightTable)
}

run()
