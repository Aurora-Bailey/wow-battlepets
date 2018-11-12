const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')
const wowapi = require('./wow-api.js')

class PetAuctions {
  constructor () {
    this.auctions = {}
  }

  async getAuctionsFromDatabase (region, realm) {
    let realmText = realm + '-' + region
    if (typeof this.auctions[realmText] !== 'undefined') return this.auctions[realmText]
    let db = await wow_battlepets.getDB()
    let results = await db.collection('auctions_live').find({auction_house: realmText}).toArray()
    if (results.length > 0) this.auctions[realmText] = results[0]
    else this.auctions[realmText] = []
    return this.auctions[realmText]
  }

  async getPetAuctionsRealm (petId, region, realm) {
    let realmText = realm + '-' + region
    let averageRealm = await this.getAverageRealmFromDatabase()
    return averageRealm[realmText]['data'][petId]
  }
}

module.exports = new PetAuctions()
