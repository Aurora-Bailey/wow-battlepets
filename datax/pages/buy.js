const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Buy {
  constructor () {

  }

  async request (query) {
    if (!query.name || !query.realm || isNaN(query.realm) || query.name.length > 100 || query.realm > 100000) throw 'Player not found!'
    query.realm = parseInt(query.realm)
    query.name = this.toUpperCaseFirst(query.name.toLowerCase())

    let db = await kaisBattlepets.getDB()
    let ah = await db.collection('auctionHouseIndex').findOne({connected: query.realm}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}})
    if (ah === null) throw 'Auction house not found!'

    let live = await db.collection('auctionsLive').find({ahid: ah.ahid, owner: query.name, lastSeen: {$gte: Date.now() - (1000*60*60*24*7)}}).toArray()
    let archive = await db.collection('auctionsArchive').find({ahid: ah.ahid, owner: query.name, lastSeen: {$gte: Date.now() - (1000*60*60*24*7)}}).toArray()
    return live.concat(archive)
  }

  toUpperCaseFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
}

module.exports = new Buy()
