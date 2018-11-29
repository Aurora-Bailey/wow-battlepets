const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Health {
  constructor () {

  }

  async request (query) {
    let db = await kaisBattlepets.getDB()
    let health = await db.collection('auctionHouseHealth').find().toArray()

    return health
  }
}

module.exports = new Health()
