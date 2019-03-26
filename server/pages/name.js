const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Player {
  constructor () {

  }

  async request (query) {
    query.name = this.toUpperCaseFirst(query.name.toLowerCase())
    query.status = query.status || {$exists: true}
    query.hours = parseInt(query.hours) || 24

    let db = await kaisBattlepets.getDB()
    let options = {projection: {_id: 0, ahid: 1, lastSeen: 1, buyout: 1, median: 1, petLevel: 1, petSpeciesId: 1, petQualityId: 1, status: 1, timeLeft: 1, soldNum: 1}}
    let live = await db.collection('auctionsLive').find({owner: query.name, status: query.status}, options).toArray()
    let archive = await db.collection('auctionsArchive').find({owner: query.name, status: query.status, lastSeen: {$gte: Date.now() - (1000*60*60*query.hours)}}, options).toArray()
    return live.concat(archive)
  }

  toUpperCaseFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
}

module.exports = new Player()
