const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const lib = require('./lib.js')
const chalk = require('chalk')
const md5 = require('md5')
const LockedInterval = require('./lockedinterval.js')

class Average {
  constructor () {
    this.daysToAverage = 30
  }

  async setupLoop () {
    await this._updateAverageUpdate()
    new LockedInterval(() => {
      this._updateAverageUpdate().catch(console.error)
    }, 1000*60*60*6, 0)
    new LockedInterval(() => {
      this._updateOldest().catch(console.error)
    }, 1000*60, 0)
    await this._ensureAuctionHouseHealth()
    new LockedInterval(() => {
      this._updateAuctionHouseHealth().catch(console.error)
    }, 1000*60, 1000*30)
    return true
  }

  async _updateAuctionHouseHealth () {
    let db = await kaisBattlepets.getDB()

    let oldest = await db.collection('auctionHouseHealth').findOne({}, {sort: {lastUpdate: -1}, projection: {_id: 0, ahid: 1, lastUpdate: 1}})
    if (oldest === null) return false

    let liveAuctions = await db.collection('auctionsLive').find({ahid: oldest.ahid}, {projection: {_id: 0, buyout: 1}})
    if (liveAuctions.length === 0) return false

    let oldAuctionsSold = await db.collection('auctionsArchive').find({ahid: oldest.ahid, status: 'sold'}, {limit: 10000, projection: {_id: 0, buyout: 1, lastSeen: 1}})
    if (oldAuctionsSold.length === 0) return false

    let auctionHouseHealth = {
      ahid: oldest.ahid,
      liveMarketCap: liveAuctions.reduce((a,v) => a + v.buyout),
      liveVolume: liveAuctions.length,
      sellPriceAvg: this._mean(oldAuctionsSold.map(a => a.buyout)),
      sellRate: this._spread(oldAuctionsSold.map(a => a.lastSeen)) / oldAuctionsSold.length,
      lastUpdate: Date.now()
    }
    await db.collection('auctionHouseHealth').updateOne({ahid: old.ahid}, {$set: auctionHouseHealth})
    return true
  }

  async _ensureAuctionHouseHealth () {
    let db = await kaisBattlepets.getDB()
    await db.collection('auctionHouseHealth').createIndex('ahid', {unique: true, name: 'ahid'})
    await db.collection('auctionHouseHealth').createIndex('lastUpdate', {name: 'lastUpdate'})
    let auctionHouses = await db.collection('auctionHouseIndex').find({}, {projection: {_id: 0, ahid: 1}}).toArray()
    let auctionHouseHealth = auctionHouses.map(ah => {
      return {
        ahid: ah.ahid,
        liveMarketCap: 0,
        liveVolume: 0,
        sellPriceAvg: 0,
        sellRate: 0,
        lastUpdate: 0
      }
    })
    for (var index in auctionHouseHealth) {
      let ah = auctionHouseHealth[index]
      await db.collection('auctionHouseHealth').updateOne({ahid: ah.ahid}, {$set: ah})
    }
    return true
  }

  async speciesAverage (speciesId, level, region, ahid) {
    console.log(chalk.magenta('speciesAverage: ') + speciesId)
    let db = await kaisBattlepets.getDB()
    let results = await db.collection('average').findOne({psid: speciesId, petLevel: level, region: region, ahid: ahid})
    if (results !== null) return results

    // species not found
    return await this._packageData([], {speciesId, level, region, ahid})
  }

  async _updateAverageUpdate () {
    // this is a soultion to keep track of species and when to update the average
    console.log(chalk.magenta('_updateAverageUpdate:'))
    let db = await kaisBattlepets.getDB()
    let psids = await db.collection('auctionsLive').distinct('petSpeciesId', {})
    psids.forEach(id => {
      db.collection('averageUpdate').insertOne({psid: id, lastUpdate: Date.now()}).catch(() => {})
    })
    await db.collection('averageUpdate').createIndex('psid', {unique: true, name: 'psid'})
    await db.collection('averageUpdate').createIndex('lastUpdate', {name: 'lastUpdate'})
    return true
  }

  async _updateOldest () {
    console.log(chalk.magenta('_updateOldest:'))
    let db = await kaisBattlepets.getDB()
    let oldestAverage = await db.collection('averageUpdate').findOne({}, {sort: {lastUpdate: 1}, projection: {_id: 1, psid: 1}})
    if (oldestAverage === null) return false
    let updateId = await this._updateSpeciesId(oldestAverage.psid)
    await db.collection('averageUpdate').updateOne({psid: oldestAverage.psid}, {$set: {lastUpdate: Date.now()}})
    return updateId
  }

  async _updateSpeciesId (speciesId) {
    console.log(chalk.magenta('_updateSpeciesId: ') + speciesId)
    var daysMS = this.daysToAverage * 24 * 60 * 60 * 1000
    let db = await kaisBattlepets.getDB()
    let results = await db.collection('auctionsArchive').find({petSpeciesId: speciesId, lastSeen: {$gte: Date.now() - daysMS}}, {sort: {lastSeen: -1}, limit: 10000, projection: {
      _id: 0,
      buyout: 1,
      petSpeciesId: 1,
      petLevel: 1,
      ahid: 1,
      lastSeen: 1,
      status: 1
    }}).toArray()
    if (results.length === 0) return false

    var regionAuctions = {}
    var auctionHouseAuctions = {}
    for (var index in results) {
      let auction = results[index]
      let ah = await lib.auctionHouse(auction.ahid)
      if (typeof regionAuctions[ah.regionTag] === 'undefined') regionAuctions[ah.regionTag] = []
      if (typeof auctionHouseAuctions[auction.ahid] === 'undefined') auctionHouseAuctions[auction.ahid] = []
      regionAuctions[ah.regionTag].push(auction)
      auctionHouseAuctions[auction.ahid].push(auction)
    }
    for (var region in regionAuctions) {
      if (regionAuctions.hasOwnProperty(region)) {
        let l1 = regionAuctions[region].filter(a => a.petLevel === 1)
        let l25 = regionAuctions[region].filter(a => a.petLevel === 25)
        await db.collection('average').updateOne(
          {psid: speciesId, petLevel: 1, region: region, ahid: null},
          {$set: this._packageData(l1, {lastUpdate: Date.now(), psid: speciesId, petLevel: 1, region: region, ahid: null})},
          {upsert: true}
        )
        await db.collection('average').updateOne(
          {psid: speciesId, petLevel: 25, region: region, ahid: null},
          {$set: this._packageData(l25, {lastUpdate: Date.now(), psid: speciesId, petLevel: 25, region: region, ahid: null})},
          {upsert: true}
        )
      }
    }
    for (var ah in auctionHouseAuctions) {
      if (auctionHouseAuctions.hasOwnProperty(ah)) {
        let l1 = auctionHouseAuctions[ah].filter(a => a.petLevel === 1)
        let l25 = auctionHouseAuctions[ah].filter(a => a.petLevel === 25)
        await db.collection('average').updateOne(
          {psid: speciesId, petLevel: 1, region: null, ahid: ah},
          {$set: this._packageData(l1, {lastUpdate: Date.now(), psid: speciesId, petLevel: 1, region: null, ahid: ah})},
          {upsert: true}
        )
        await db.collection('average').updateOne(
          {psid: speciesId, petLevel: 25, region: null, ahid: ah},
          {$set: this._packageData(l25, {lastUpdate: Date.now(), psid: speciesId, petLevel: 25, region: null, ahid: ah})},
          {upsert: true}
        )
      }
    }
    await db.collection('average').createIndex('psid', {name: 'psid'})
    await db.collection('average').createIndex('petLevel', {name: 'petLevel'})
    await db.collection('average').createIndex('region', {name: 'region'})
    await db.collection('average').createIndex('ahid', {name: 'ahid'})
    await db.collection('average').createIndex('lastUpdate', {name: 'lastUpdate'})

    return true
  }

  _packageData(auctions, otherData) {
    // console.log(chalk.magenta('_packageData: ' + auctions.length))
    var daysMS = this.daysToAverage * 24 * 60 * 60 * 1000
    let sold = auctions.filter(auction => auction.status === 'sold')
    let canceled = auctions.filter(auction => auction.status === 'canceled')
    let expired = auctions.filter(auction => auction.status === 'expired')

    let soldBuyout = sold.map(auction => auction.buyout)
    let canceledBuyout = canceled.map(auction => auction.buyout)
    let expiredBuyout = expired.map(auction => auction.buyout)

    let soldWeight = sold.map(auction => {
      let weight = daysMS - (Date.now() - auction.lastSeen)
      if (weight <= 0) weight = 0
      return weight
    })
    let canceledWeight = canceled.map(auction => {
      let weight = daysMS - (Date.now() - auction.lastSeen)
      if (weight <= 0) weight = 0
      return weight
    })
    let expiredWeight = expired.map(auction => {
      let weight = daysMS - (Date.now() - auction.lastSeen)
      if (weight <= 0) weight = 0
      return weight
    })

    let data = {
      sold: this._averageCombinationObject(soldBuyout, soldWeight),
      canceled: this._averageCombinationObject(canceledBuyout, canceledWeight),
      expired: this._averageCombinationObject(expiredBuyout, expiredWeight)
    }
    return Object.assign(otherData, data)
  }

  _averageCombinationObject (numArray, weightArray) {
    return {
      mean: this._mean(numArray),
      median: this._median(numArray),
      mode: this._mode(numArray),
      spread: this._spread(numArray),
      weightedMean: this._weightedMean(numArray, weightArray),
      standardDeviation: this._standardDeviation(numArray),
      high: this._high(numArray),
      low: this._low(numArray),
      num: numArray.length
    }
  }

  _mode (numArray) {
    if (numArray.length === 0) return 0
    let max = Math.max(...numArray)
    let min = Math.min(...numArray)
    let chunkSize = (max - min) / numArray.length

    let lineGraph = new Array(numArray.length).fill(null)
    numArray.forEach(n => {
      let cell = Math.ceil((n - min) / chunkSize) - 1
      if (n - min === 0) cell = 0
      if (!lineGraph[cell]) lineGraph[cell] = []
      lineGraph[cell].push(n)
    })

    let mostNumbers = lineGraph.reduce((a, v) => {
      if (v === null) return a
      if (a.length > v.length) return a
      else return v
    })

    return this._mean(mostNumbers)
  }

  _high (numArray) {
    if (numArray.length === 0) return 0
    let max = Math.max(...numArray)
    return max
  }
  _low (numArray) {
    if (numArray.length === 0) return 0
    let min = Math.min(...numArray)
    return min
  }

  _spread (numArray) {
    if (numArray.length === 0) return 0
    let max = Math.max(...numArray)
    let min = Math.min(...numArray)
    return max - min
  }

  _weightedMean (numArray, weightArray) {
    if (numArray.length === 0) return 0
    let percentPerUnit = 1 / weightArray.reduce((a, v) => a + v)
    let mean = 0
    numArray.forEach((e, i) => {
      mean += (weightArray[i] * percentPerUnit) * numArray[i]
    })
    return mean
  }

  _standardDeviation (numArray) {
    if (numArray.length === 0) return 0
    let avg = this._mean(numArray)
    let diffs = numArray.map(v => {
      let diff = v - avg
      let sqr = diff * diff
      return sqr
    })
    let stdSqr = this._mean(diffs)
    return Math.sqrt(stdSqr)
  }

  _mean (numArray) {
    if (numArray.length === 0) return 0
    let sum = numArray.reduce((a, v) => a + v)
    return sum / numArray.length
  }
  _median (numArray) {
    if (numArray.length === 0) return 0
    numArray.sort((a, b) => a - b)
    let medianIndex = Math.floor(numArray.length / 2)
    return numArray[medianIndex]
  }
}

module.exports = new Average()
