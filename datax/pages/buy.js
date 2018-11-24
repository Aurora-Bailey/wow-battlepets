const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Buy {
  constructor () {

  }

  async request (query) {
    query.maxbuyout = query.maxbuyout || 10000000000
    query.minprofit = query.minprofit || 1000000
    query.minmarkup = query.minmarkup || 50

    let db = await kaisBattlepets.getDB()
    let live = await db.collection('auctionsLive').find({ahid: query.ahid, buyout: {$lte: query.maxbuyout}, profit: {$gte: query.minprofit}, percent: {$gte: query.minmarkup}}).toArray()
    return live
  }
}

module.exports = new Buy()
