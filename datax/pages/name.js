const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Player {
  constructor () {

  }

  async request (query) {
    query.name = this.toUpperCaseFirst(query.name.toLowerCase())
    let db = await kaisBattlepets.getDB()
    let projection = {projection: {_id: 0, lastSeen: 1, buyout: 1, median: 1, petLevel: 1, petSpeciesId: 1, petQualityId: 1, status: 1, timeLeft: 1}}
    let live = await db.collection('auctionsLive').find({owner: query.name}, projection).toArray()
    let archive = await db.collection('auctionsArchive').find({owner: query.name, lastSeen: {$gte: Date.now() - (1000*60*60*24*7)}}, projection).toArray()
    return live.concat(archive)
  }

  toUpperCaseFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
}

module.exports = new Player()
