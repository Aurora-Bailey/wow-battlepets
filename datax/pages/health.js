const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Health {
  constructor () {

  }

  async request (query) {
    let db = await kaisBattlepets.getDB()
    let health = await db.collection('auctionHouseHealth').find({}, {projection: {
      _id: 0,
      ahid: 1,
      liveMarketCap: 1,
      liveVolume: 1,
      sellPriceAvg: 1,
      sellRate: 1,
      lastUpdate: 1,
      soldOfFiveThousand: 1,
      expiredOfFiveThousand: 1,
      canceledOfFiveThousand: 1,
      halfPriceUnique: 1,
      halfPriceUniqueOverOneHundredThousand: 1,
      halfPriceUniqueOverTenThousand: 1,
      halfPriceUniqueOverOneThousand: 1,
      halfPriceUniqueOverOneHundred: 1,
      halfPriceUniqueOverTen: 1,
      halfPriceUniqueOverZero: 1
    }}).toArray()

    return health
  }
}

module.exports = new Health()
