const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Player {
  constructor () {

  }

  async request (query) {
    query.name = this.toUpperCaseFirst(query.name.toLowerCase())
    let db = await kaisBattlepets.getDB()
    let live = await db.collection('auctionsLive').find({ahid: query.ahid, owner: query.name}).toArray()
    let archive = await db.collection('auctionsArchive').find({ahid: query.ahid, owner: query.name, lastSeen: {$gte: Date.now() - (1000*60*60*24*7)}}).toArray()
    return live.concat(archive)
  }

  toUpperCaseFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
}

module.exports = new Player()
