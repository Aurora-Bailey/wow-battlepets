const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Buy {
  constructor () {

  }

  async request (query) {
    query.maxbuyout = parseInt(query.maxbuyout) || 10000000000
    query.minprofit = parseInt(query.minprofit) || 1000000
    query.minmarkup = parseInt(query.minmarkup) || 50

    let db = await kaisBattlepets.getDB()
    let live = await db.collection('auctionsLive').find({ahid: query.ahid, buyout: {$lte: query.maxbuyout}, profit: {$gte: query.minprofit}, percent: {$gte: query.minmarkup}},
    {projection: {_id: 0, auc: 1, buyout: 1, median: 1, percent: 1, profit: 1, soldNum: 1, petLevel: 1, petBreedId: 1, petSpeciesId: 1}}).toArray()
    return live
  }
}

module.exports = new Buy()
