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
    if (query.canceled === '0') query.canceled = 0 // zero is falsy
    else query.canceled = parseInt(query.canceled) || 100 // number of canceled items to allow before skipping the pet
    if (query.discount === '0') query.discount = 0
    else query.discount = parseInt(query.discount) || 1 // 0 to 1
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

    // filter unique and query.level/ quality
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
    let overCanceled = 0

    // loop over 7 days
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

          if (typeof soldCanceled[item.ahid] === 'undefined') soldCanceled[item.ahid] = {}
          if (typeof soldCanceled[item.ahid][item.petSpeciesId] === 'undefined') soldCanceled[item.ahid][item.petSpeciesId] = {sold: 0, canceled: 0}
          if (item.status === 'sold' && item.buyout > (petSimpleObject[item.petSpeciesId].price * query.discount)) {
            soldCanceled[item.ahid][item.petSpeciesId]['sold']++
          }else if (item.status === 'canceled') {
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
            if (soldCanceledAhidPsid['canceled'] > query.canceled) {
              overCanceled++
              return false
            } else if (soldCanceledAhidPsid['sold'] === 0) {
              return false
            }
            let itemPsid = parseInt(key2)
            sumNum[key]['num']++
            sumNum[key]['sum'] += petSimpleObject[itemPsid].price
          })
        })

        let sumNumArray = Object.keys(sumNum).map(key => {return {sum: sumNum[key].sum, num: sumNum[key].num, ahid: key}})
        sumNumArray.sort((a, b) => b.num - a.num)
        sumNumArray.forEach((item, index) => { item.numRank = index + 1 })
        sumNumArray.sort((a, b) => b.sum - a.sum)
        sumNumArray.forEach((item, index) => { item.sumRank = index + 1 })

        auctionHouseCompare.push(sumNumArray)

      })()
    }

    // merge days into one average
    let auctionHouseCompareAverage = {}
    auctionHouseCompare.forEach(day => { // sum
      day.forEach(item => {
        if (typeof auctionHouseCompareAverage[item.ahid] === 'undefined') auctionHouseCompareAverage[item.ahid] = {ahid: item.ahid, sumAvg: 0, numAvg: 0, sumRankAvg: 0, numRankAvg: 0}
        auctionHouseCompareAverage[item.ahid].sumAvg += item.sum
        auctionHouseCompareAverage[item.ahid].numAvg += item.num
        auctionHouseCompareAverage[item.ahid].sumRankAvg += item.sumRank
        auctionHouseCompareAverage[item.ahid].numRankAvg += item.numRank
      })
    })
    Object.keys(auctionHouseCompareAverage).forEach(key => { // divide by 7
      auctionHouseCompareAverage[key].sumAvg = parseInt(auctionHouseCompareAverage[key].sumAvg / 7)
      auctionHouseCompareAverage[key].numAvg = parseInt(auctionHouseCompareAverage[key].numAvg / 7)
      auctionHouseCompareAverage[key].sumRankAvg = parseInt(auctionHouseCompareAverage[key].sumRankAvg / 7)
      auctionHouseCompareAverage[key].numRankAvg = parseInt(auctionHouseCompareAverage[key].numRankAvg / 7)
    })
    let auctionHouseCompareAverageArray = Object.keys(auctionHouseCompareAverage).map(key => auctionHouseCompareAverage[key]) // to array
    auctionHouseCompareAverageArray.sort((a, b) => b.numAvg - a.numAvg)
    auctionHouseCompareAverageArray.forEach((item, index) => { item.numAvgRank = index + 1 })
    auctionHouseCompareAverageArray.sort((a, b) => b.sumAvg - a.sumAvg)
    auctionHouseCompareAverageArray.forEach((item, index) => { item.sumAvgRank = index + 1 })

    return {overCanceled, data: auctionHouseCompareAverageArray}
  }
}

module.exports = new Collection()
