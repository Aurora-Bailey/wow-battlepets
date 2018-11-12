const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')

class PetAuctions {
  constructor () {
    this.realms = {}
  }

  async getRealmFromDatabase (realm) {
    if (typeof this.realms[realm] !== 'undefined') return this.realms[realm]
    let db = await wow_battlepets.getDB()
    let results = await db.collection('realms').find({name: realm}).toArray()
    if (results.length > 0) this.realms[realm] = results[0]
    else this.realms[realm] = {}
    return this.realms[realm]
  }

  async getPetAuctionsRealm (petId, region, realm) {
    let realmText = realm + '-' + region
    let averageRealm = await this.getAverageRealmFromDatabase()
    return averageRealm[realmText]['data'][petId]
  }
}

module.exports = new PetAuctions()
