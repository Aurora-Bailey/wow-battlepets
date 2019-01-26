const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('../api/wow.js')
const lib = require('../api/lib.js')

class SellerLiveRank {
  constructor () {

  }

  async request (query) {
    let db = await kaisBattlepets.getDB()
    let realm = await db.collection('auctionsLive').find({}, {projection: {_id: 0, ahid: 1, owner: 1, ownerRealm: 1, buyout: 1, petLevel: 1, petQualityId: 1, median: 1}}).toArray()

    let regionLookup = await db.collection('auctionHouseIndex').find({}, {projection: {_id: 0, ahid: 1, regionTag: 1}}).toArray()
    regionLookup = regionLookup.reduce((a, v) => {
      a[v.ahid] = v.regionTag
      return a
    }, {})

    // {owner: {ahid: {pets, buyout, level, quality}}}
    let groupByOwner = realm.reduce((a, v) => {
      if (typeof a[v.owner] === 'undefined') a[v.owner] = {}
      if (typeof a[v.owner][v.ahid] === 'undefined') a[v.owner][v.ahid] = {pets: 0, median: 0, buyout: 0, level: 0, quality: 0}
      a[v.owner][v.ahid].pets++
      a[v.owner][v.ahid].buyout += v.buyout
      a[v.owner][v.ahid].median += v.median
      a[v.owner][v.ahid].level += v.petLevel
      a[v.owner][v.ahid].quality += v.petQualityId
      return a
    }, {})

    let groupByOwnerArray = Object.keys(groupByOwner).map(key => {
      let playerName = groupByOwner[key]
      let owner = key
      let pets = 0
      let buyout = 0
      let median = 0
      let level = 0
      let quality = 0
      let ahids = Object.keys(playerName)
      let regions = {}

      ahids.forEach(ahid => {
        let r = regionLookup[ahid]
        regions[r] = true
      })

      Object.keys(playerName).forEach(index => {
        let ahid = playerName[index]
        pets += ahid.pets
        buyout += ahid.buyout
        median += ahid.median
        level += ahid.level
        quality += ahid.quality
      })

      return {
        owner,
        pets,
        buyouttotal: buyout,
        buyoutavg: parseInt(buyout / pets),
        mediantotal: median,
        level: parseInt(level / pets),
        quality: Math.floor((quality / pets)*100)/100,
        ahids: ahids.length,
        regions: Object.keys(regions).sort().join(', ')
      }
    })

    // sort
    groupByOwnerArray.sort((a, b) => b.mediantotal - a.mediantotal)

    // inject rank
    groupByOwnerArray = groupByOwnerArray.map((item, index) => {
      item.rank = index + 1
      return item
    })

    return {data: groupByOwnerArray.slice(0, 1000)}
  }
}

module.exports = new SellerLiveRank()
