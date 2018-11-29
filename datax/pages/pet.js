const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Pet {
  constructor () {

  }

  // http://localhost:3303/pet/1155/?ahid=AHF7D429
  async request (query) {
    query.psid = parseInt(query.psid)
    query.ahid = query.ahid || {$exists: true}

    let db = await kaisBattlepets.getDB()
    let averages = await db.collection('average').find({psid: query.psid, ahid: null}).toArray()

    let live = await db.collection('auctionsLive').find({petSpeciesId: query.psid, ahid: query.ahid}).toArray()

    return {averages, live}
  }
}

module.exports = new Pet()
