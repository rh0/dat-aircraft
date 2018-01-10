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

  await webdb.indexArchive('dat://d89ec0a7b53f0be87069f707da8abb77f23d6c1abb3915e0afee637d9555af20')
  console.log('indexed...')

  var allFlights = await webdb.flights.toArray()
  console.log(allFlights)
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
document.body.appendChild(flightTable)
