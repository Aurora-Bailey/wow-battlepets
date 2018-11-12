const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')
const wowapi = require('./wow-api.js')

class PetAverage {
  constructor () {
    this.averageRegion = null
    this.averageRealm = null
  }

  async getAverageRegionFromDatabase () {
    if (this.averageRegion) return this.averageRegion
    let db = await wow_battlepets.getDB()
    let results = await db.collection('average_region').find({}).toArray()
    this.averageRegion = {}
    results.forEach(e => {
      this.averageRegion[e.region] = e
    })
    return this.averageRegion
  }

  async getAverageRealmFromDatabase () {
    if (this.averageRealm) return this.averageRealm
    let db = await wow_battlepets.getDB()
    let results = await db.collection('average_realm').find({}).toArray()
    this.averageRealm = {}
    results.forEach(e => {
      this.averageRealm[e.realm] = e
    })
    return this.averageRealm
  }

  async getPetAverageRegion (petId, region) {
    let averageRegion = await this.getAverageRegionFromDatabase()
    return averageRegion[region]['data'][petId]
  }

  async getPetAverageRealm (petId, region, realm) {
    let realmText = realm + '-' + region
    let averageRealm = await this.getAverageRealmFromDatabase()
    return averageRealm[realmText]['data'][petId]
  }
}

module.exports = new PetAverage()

// { '1':
//    { expired_mean: 2640772.777777778,
//      expired_median: 1947499,
//      expired_low: 278990,
//      expired_high: 8379999,
//      expired_num: 9,
//      canceled_mean: 8060000,
//      canceled_median: 8060000,
//      canceled_low: 8060000,
//      canceled_high: 8060000,
//      canceled_num: 1 },
//   '25':
//    { expired_mean: 157497474.5,
//      expired_median: 240000000,
//      expired_low: 74994949,
//      expired_high: 240000000,
//      expired_num: 2 } }
