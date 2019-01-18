const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('../api/wow.js')
const lib = require('../api/lib.js')

class Collection {
  constructor () {
    // simulate sell of level 1 rare quality pets
  }

  async request (query) {
    query.rid = parseInt(query.rid)
    query.canceled = parseInt(query.canceled) || 100 // number of canceled items to allow before skipping the pet
    query.discount = parseInt(query.discount) || 1 // 0 to 1
    query.level = parseInt(query.level) || 1 // Level of pets to compare
    // only compare rare quality pets
    // get pets from blizzard
    let pets = await wow.getCharacterPets(query.rid, query.name)

    // resolve realm id
    let db = await kaisBattlepets.getDB()
    let realm = await db.collection('realmIndex').findOne({id: query.rid})
    if (realm === null) throw 'Realm not found!'

    // pullin averages
    for (var index in pets) {
      let pet = pets[index]
      let level = parseInt(pet.stats.level)
      if (level !== 25) level = 1
      pet.speciesId = pet.stats.speciesId
      pet.average = await lib.speciesAverageRegion(pet.speciesId, level, realm.regionTag)
      if (pet.average === null) pet.average = {sold: {median: 0, num: 0}}
    }

    // simplify
    let petsSimple = pets.map(pet => {
      return {
        psid: pet.stats.speciesId,
        level: pet.stats.level,
        price: pet.average.sold.median,
        sold: pet.average.sold.num,
        guid: pet.battlePetGuid,
        quality: pet.stats.petQualityId
      }
    })

    // filter unique and query.level
    let petSimpleObject = petsSimple.reduce((a, v) => {
      if (v.level === query.level && v.quality === 3) a[v.psid] = v
      return a
    }, {})
    let petSimpleUnique = Object.keys(petSimpleObject).map(key => petSimpleObject[key])

    // build ahid lookup
    let auctionHouseIndex = await db.collection('auctionHouseIndex').find({}, {projection: {_id: 0, ahid: 1, regionTag: 1}}).toArray()
    let ahidToRegionTag = auctionHouseIndex.reduce((a, v) => {
      a[v.ahid] = v.regionTag
      return a
    }, {})

    // Auction house compare object
    let auctionHouseCompare = []

    for (var i = 0; i < 7; i++) {
      console.log(`Day: ${i}`)
      await (async function () {
        let fromTime = Date.now() - ((i+1) * 1000 * 60 * 60 * 24)
        let toTime = Date.now() - (i * 1000 * 60 * 60 * 24)
        let auctionsArchive = await db.collection('auctionsArchive').find({$or: [{status: 'sold'}, {status: 'canceled'}], lastSeen: {$gte: fromTime, $lt: toTime}, petLevel: query.level, petQualityId: 3},
        {projection: {_id: 0, buyout: 1, petSpeciesId: 1, status: 1, ahid: 1}}).toArray()

        // filter out all but player region
        auctionsArchive = auctionsArchive.filter(item => ahidToRegionTag[item.ahid] === realm.regionTag)

        // count sold above threshold and number of canceled pets organized by ahid and psid
        let soldCanceled = {} // {ahid: {psid: {sold: 0, canceled: 0}, ...}, ...}
        auctionsArchive.forEach(item => {
          if (typeof petSimpleObject[item.petSpeciesId] === 'undefined') return false
          if (item.status === 'sold' && item.buyout > (petSimpleObject[item.petSpeciesId].price * query.discount)) {
            if (typeof soldCanceled[item.ahid] === 'undefined') soldCanceled[item.ahid] = {}
            if (typeof soldCanceled[item.ahid][item.petSpeciesId] === 'undefined') soldCanceled[item.ahid][item.petSpeciesId] = {sold: 0, canceled: 0}
            soldCanceled[item.ahid][item.petSpeciesId]['sold']++
          }else if (item.status === 'canceled') {
            if (typeof soldCanceled[item.ahid] === 'undefined') soldCanceled[item.ahid] = {}
            if (typeof soldCanceled[item.ahid][item.petSpeciesId] === 'undefined') soldCanceled[item.ahid][item.petSpeciesId] = {sold: 0, canceled: 0}
            soldCanceled[item.ahid][item.petSpeciesId]['canceled']++
          }
        })

        // count sum price and count of all valid sold pets
        let sumNum = {} //{ahid: {sum: 0, num: 0}, ...}
        Object.keys(soldCanceled).forEach(key => {
          let soldCanceledAhid = soldCanceled[key]
          if (typeof sumNum[key] === 'undefined') sumNum[key] = {sum: 0, num: 0}
          Object.keys(soldCanceledAhid).forEach(key2 => {
            let soldCanceledAhidPsid = soldCanceledAhid[key2]
            if (soldCanceledAhidPsid['canceled'] > query.canceled) return false
            let itemPsid = parseInt(key2)
            sumNum[key]['num']++
            sumNum[key]['sum'] += petSimpleObject[itemPsid].price
          })
        })

        auctionHouseCompare.push(sumNum)

      })()
    }

    // get sold history

    return {dev: auctionHouseCompare}
  }
}

module.exports = new Collection()
