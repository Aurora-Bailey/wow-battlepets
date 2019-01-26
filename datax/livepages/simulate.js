const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('../api/wow.js')
const lib = require('../api/lib.js')

class Simulate {
  constructor () {
    // simulate sell of level 1 rare quality pets
  }

  async process (query, send) {

    // {psid: {psid, level, price, sold, quality}}
    send({m: 'state', d: 'pulling users pets from blizzard'})
    let petsUnique = await this.userPets(query)

    // [ahid,...]
    send({m: 'state', d: 'pulling list of auction houses'})
    let auctionHouseList = await this.auctionHousesInRegion(query)

    for (var index in auctionHouseList) {
      let ahid = auctionHouseList[index]
      try {
        await (async () => {
          // Pullin auction data
          send({m: 'state', d: 'pulling data for ' + ahid})
          let archive = await this.pullAuctionArchive(query, ahid)
          send({m: 'state', d: 'processing ' + ahid})

          // Get first lastSeen timestamp
          let startTime = archive.reduce((a, v) => {
            if (v.lastSeen < a) a = v.lastSeen
            return a
          }, Date.now())

          // Loop to correct start time
          while(parseInt((startTime % (1000*60*60*24)) / (1000*60*60)) !== query.startTimeGMT) {
            startTime += 60000
          }

          send({m: 'state', d: 'processing ' + ahid + ' stage 1'})

          // Inject our auctions
          let auctionCycles = 0
          let sellStartTime = startTime
          while(sellStartTime + (1000*60*60*query.auctionLength) < Date.now()) {
            let endTime = sellStartTime + (1000*60*60*query.auctionLength)
            Object.keys(petsUnique).forEach(index => {
              let pet = petsUnique[index]
              archive.push({
                buyout: pet.price,
                petSpeciesId: pet.psid,
                petLevel: pet.level,
                petQualityId: pet.quality,
                lastSeen: endTime,
                firstSeen: sellStartTime,
                status: "simsell",
                cycle: auctionCycles,
                profit: 1,
                percent: 1,
                soldNum: 1,
                median: 1
              })
            })
            auctionCycles++
            sellStartTime = endTime
          }

          // {psid-level-quality: [buyout, petSpeciesId, petLevel, petQualityId, lastSeen, firstSeen, status]}
          let splitByPsid = archive.reduce((a, v) => {
            let key = '' + v.petSpeciesId + '-' + v.petLevel + '-' + v.petQualityId
            if (typeof a[key] === 'undefined') a[key] = []
            a[key].push(v)
            return a
          }, {})

          send({m: 'state', d: 'processing ' + ahid + ' stage 2'})

          // loop through item by item
          let ourItemsSold = []
          Object.keys(splitByPsid).forEach(key => {
            let group = splitByPsid[key]
            group.forEach(soldAuction => {
              if (soldAuction.status === 'sold') {
                group.forEach(checkAuction => {
                  if (checkAuction.status !== 'simsell') return false // skip not our auction
                  if (checkAuction.firstSeen > soldAuction.firstSeen
                    && checkAuction.lastSeen > soldAuction.lastSeen
                    && checkAuction.firstSeen < soldAuction.lastSeen) {
                    let minPrice = checkAuction.buyout * (query.sellMaxDiscount/100)
                    if (soldAuction.buyout > minPrice) {
                      let price = Math.min(soldAuction.buyout, checkAuction.buyout)
                      soldAuction.status = 'booted'
                      checkAuction.status = 'simsold'
                      checkAuction.simbuyout = price
                      ourItemsSold.push(checkAuction)
                    }
                  }
                })
              }
            })
          })

          send({m: 'state', d: 'processing ' + ahid + ' stage 3'})

          // by cycle
          let byCycle = new Array(auctionCycles)
          for (var i = 0; i < byCycle.length; i++) {
            byCycle[i] = {goldMade: 0, itemsSold: 0, goldLeft:0, itemsBought: 0, boughtPotential: 0}
          }
          ourItemsSold.forEach(item => {
            byCycle[item.cycle].goldMade += item.simbuyout
            byCycle[item.cycle].itemsSold++ //.push(item)
          })

          // buy pets
          let buyLoopCount = 0
          let buyStartTime = startTime
          while(buyStartTime + (1000*60*60*query.auctionLength) < Date.now()) {
            let endTime = buyStartTime + (1000*60*60*query.auctionLength)
            let availableAuctions = archive.filter(item => item.firstSeen < endTime && item.lastSeen > endTime)
            let preferedAuctions = availableAuctions.filter(item => {
              let buy = true
              if (item.profit <= query.buyMinProfit * 10000) buy = false
              if (item.percent <= query.buyMinMarkup) buy = false
              if (item.buyout >= query.buyMaxBuyout * 10000) buy = false
              if (item.soldNum <= query.buyMinSellRate) buy = false
              if (item.petLevel != query.buyPetLevel) buy = false
              let quality = query.buyRareOnly ? 3:1
              if (item.petQualityId < quality) buy = false
              return buy
            })

            // sort by hightest percent profit
            preferedAuctions.sort((a,b) => b.percent - a.percent)


            // buy items
            let goldThisCycle = byCycle[buyLoopCount].goldMade
            let goldPotential = 0
            let itemsBought = []
            preferedAuctions.forEach(item => {
              if (item.buyout < goldThisCycle) {
                itemsBought.push(item)
                goldThisCycle -= item.buyout
                goldPotential += item.median
              }
            })
            byCycle[buyLoopCount].goldLeft = goldThisCycle
            byCycle[buyLoopCount].boughtPotential = goldPotential
            byCycle[buyLoopCount].itemsBought = itemsBought.length

            buyLoopCount++
            buyStartTime = endTime
          }

          let sellGold = parseInt(this._mean(byCycle.map(item => item.goldMade)))
          let sellBuyGold = parseInt(this._mean(byCycle.map(item => item.boughtPotential)))
          let sellBuyGoldLeft = parseInt(this._mean(byCycle.map(item => item.goldLeft)))

          send({
            m: 'ahstats',
            ahid,
            sellGold,
            sellBuyGold,
            sellBuyGoldLeft,
            gain: parseInt(((sellBuyGold + sellBuyGoldLeft) / sellGold) * 100),
            d: byCycle
          })

          //

        })()
      } catch (e) {
        send({m: 'state', d: 'error'})
      }
    }

    return true
  }

  async pullAuctionArchive (query, ahid) {
    // get database
    let db = await kaisBattlepets.getDB()

    let projection = {
      _id: 0,
      buyout: 1,
      petSpeciesId: 1,
      petLevel: 1,
      petQualityId: 1,
      lastSeen: 1,
      firstSeen: 1,
      status: 1,
      profit: 1,
      percent: 1,
      soldNum: 1,
      median: 1
    }
    let archive = await db.collection('auctionsArchive')
    .find({ahid}, {projection})
    .toArray()
    return archive.filter(item => item.buyout !== 0)
  }

  async auctionHousesInRegion (query) {
    // get database
    let db = await kaisBattlepets.getDB()

    // resolve realm region
    let realm = await db.collection('realmIndex').findOne({id: query.realm})
    let region = realm.regionTag

    // build ahid region lookup
    let auctionHouseIndex = await db.collection('auctionHouseIndex')
    .find({regionTag: region}, {projection: {_id: 0, ahid: 1}})
    .toArray()

    return auctionHouseIndex.map(item => item.ahid)
  }

  async userPets (query) {
    // get database
    let db = await kaisBattlepets.getDB()

    // get pets from blizzard
    let pets = await wow.getCharacterPets(query.realm, query.character)

    // resolve realm region
    let realm = await db.collection('realmIndex').findOne({id: query.realm})
    let region = realm.regionTag

    // pullin averages
    for (var index in pets) {
      let pet = pets[index]
      let level = parseInt(pet.stats.level)
      if (level !== 25) level = 1
      pet.speciesId = pet.stats.speciesId
      pet.average = await lib.speciesAverageRegion(pet.speciesId, level, region)
      if (pet.average === null) pet.average = {sold: {median: 0, num: 0}}
    }

    // simplify
    pets = pets.map(pet => {
      return {
        psid: pet.stats.speciesId,
        level: pet.stats.level,
        price: pet.average.sold.median,
        sold: pet.average.sold.num,
        quality: pet.stats.petQualityId
      }
    })

    // filter unique and parse as an object
    let petsUnique = pets.reduce((a, v) => {
      a[v.psid] = v
      return a
    }, {})
    return petsUnique
  }

  _mean (numArray) {
    if (numArray.length === 0) return 0
    let sum = numArray.reduce((a, v) => a + v)
    return sum / numArray.length
  }
}

module.exports = new Simulate()
