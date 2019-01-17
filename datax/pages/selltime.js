const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('../api/wow.js')
const lib = require('../api/lib.js')

class SellTime {
  constructor () {

  }

  async request (query) {
    let db = await kaisBattlepets.getDB()
    let realmIndex = await db.collection('realmIndex').find({}, {projection: {_id: 0, ahid: 1, timezone: 1}}).toArray()

    let archiveSold = await db.collection('auctionsArchive').find({status: "sold"}, {projection: {_id: 0, ahid: 1, lastSeen: 1}}).toArray()

    let ahidToTimezone = realmIndex.reduce((a, v) => {
      a[v.ahid] = v.timezone
      return a
    }, {})

    let data = {}

    archiveSold.forEach(item => {
      let hour = Math.floor(item.lastSeen / (1000*60*60))
      let timezone = ahidToTimezone[item.ahid]

      if (typeof data[timezone] === 'undefined') data[timezone] = {}
      if (typeof data[timezone][hour] === 'undefined') data[timezone][hour] = 0

      data[item.ahid][hour]++
    })

    return data
  }

}

module.exports = new SellTime()
