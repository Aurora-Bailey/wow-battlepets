const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('../api/wow.js')
const lib = require('../api/lib.js')

class SellerLiveRank {
  constructor () {

  }

  async request (query) {
    let db = await kaisBattlepets.getDB()
    let realm = await db.collection('auctionsLive').find({}, {projection: {_id: 0, ahid: 1, owner: 1, ownerRealm: 1, buyout: 1, petLevel: 1, petQualityId: 1}}).toArray()

    // {owner: {ahid: {pets, buyout, level, quality}}}
    let groupByOwner = realm.reduce((a, v) => {
      if (typeof a[v.owner] === 'undefined') a[v.owner] = {}
      if (typeof a[v.owner][v.ahid] === 'undefined') a[v.owner][v.ahid] = {pets: 0, buyout: 0, level: 0, quality: 0}
      a[v.owner][v.ahid].pets++
      a[v.owner][v.ahid].buyout += v.buyout
      a[v.owner][v.ahid].level += v.petLevel
      a[v.owner][v.ahid].quality += v.petQualityId
      return a
    }, {})

    let groupByOwnerArray = Object.keys(groupByOwner).map(key => {
      let playerName = groupByOwner[key]
      let owner = key
      let pets = 0
      let buyout = 0
      let level = 0
      let quality = 0
      let ahids = Object.keys(playerName)

      Object.keys(playerName).forEach(index => {
        let ahid = playerName[index]
        pets += ahid.pets
        buyout += ahid.buyout
        level += ahid.level
        quality += ahid.quality
      })

      return {
        owner,
        pets,
        buyouttotal: buyout,
        buyoutavg: parseInt(buyout / pets),
        level: parseInt(level / pets),
        quality: quality / pets,
        ahids
      }
    })

    // sort
    groupByOwnerArray.sort((a, b) => b.buyouttotal - a.buyouttotal)

    // inject rank
    groupByOwnerArray = groupByOwnerArray.map((item, index) => {
      item.rank = index + 1
      return item
    })

    return {data: groupByOwnerArray.slice(0, 1000)}
  }
}

module.exports = new SellerLiveRank()
