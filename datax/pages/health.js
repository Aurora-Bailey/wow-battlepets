const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Health {
  constructor () {

  }

  async request (query) {
    let db = await kaisBattlepets.getDB()
    let health = await db.collection('auctionHouseHealth').find({}, {projection: {_id: 0, ahid: 1, liveMarketCap: 1, liveVolume: 1, sellPriceAvg: 1, sellRate: 1, lastUpdate: 1, soldOfOneThousand: 0, expiredOfOneThousand: 0, canceledOfOneThousand:0}}).toArray()

    return health
  }
}

module.exports = new Health()
