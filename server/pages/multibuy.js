/*
Depriciated see livepages
*/
const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('../api/wow.js')
const lib = require('../api/lib.js')

class Collection {
  constructor () {

  }
  // ?rareonly=false ?level=25
  async request (query) {
    query.rareonly = query.rareonly === "false" ? false : true
    query.level = query.level || 1
    query.level = query.level == 25 ? 25:1
    query.maxbuyout = parseInt(query.maxbuyout) || 0
    query.minprofit = parseInt(query.minprofit) || 0
    query.minmarkup = parseInt(query.minmarkup) || 0
    query.minsellrate = parseInt(query.minsellrate) || 0
    query.maxmultiples = parseInt(query.maxmultiples) || 0
    query.rid = parseInt(query.rid)
    let buyAt = query.buyat.split('-')
    let db = await kaisBattlepets.getDB()

    // get pets from blizzard
    let petsOwned = await wow.getCharacterPets(query.rid, query.name)
    petsOwned = petsOwned.map(pet => {
      return {
        psid: parseInt(pet.stats.speciesId),
        level: parseInt(pet.stats.level),
        quality: parseInt(pet.stats.petQualityId)
      }
    })

    // Build list of all pets
    let petList = {}
    let petInfo = await db.collection('petInfo').find({}, {projection: {_id: 0, speciesId: 1}}).toArray()
    petInfo.forEach(pet => {
      pet.speciesId = parseInt(pet.speciesId)
      petList[pet.speciesId] = 0
    })

    // Fill list with pets already owned
    petsOwned.forEach(pet => {
      if (typeof petList[pet.psid] !== 'undefined') petList[pet.psid]++
    })

    // Find pets to buy
    let returnList = []
    for (var psid in petList) {
      if (!petList.hasOwnProperty(psid)) continue
      let numOwned = petList[psid]
      if (numOwned >= query.maxmultiples) continue
      let buyable = await db.collection('auctionsLive').find({
        petSpeciesId: parseInt(psid),
        ahid: {$in: buyAt},
        soldNum: {$gte: query.minsellrate},
        petLevel: query.level,
        petQualityId: query.rareonly ? 3 : {$exists: true},
        buyout: {$lte: query.maxbuyout, $ne: 0},
        profit: {$gte: query.minprofit},
        percent: {$gte: query.minmarkup}
      }, {
        sort: {buyout: 1},
        limit: query.maxmultiples - numOwned,
        projection: {_id: 0, ahid: 1, auc: 1, buyout: 1, median: 1, percent: 1, profit: 1, soldNum: 1, petQualityId: 1, petLevel: 1, petBreedId: 1, petSpeciesId: 1}
      }).toArray()
      buyable.forEach(b => { returnList.push(b) })
    }
    returnList.map(item => item.buy = true)
    return returnList
  }
}

module.exports = new Collection()
