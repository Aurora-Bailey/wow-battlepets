const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const lib = require('./lib.js')
const chalk = require('chalk')
const md5 = require('md5')
const LockedInterval = require('./lockedinterval.js')

class Average {
  constructor () {
    this.maxAuctionsPulled = 10000
  }

  async setupLoop () {
    new LockedInterval(() => {
      this._updateOldest().catch(console.log)
    }, 10000, 0)
    return true
  }

  async _updateOldest () {
    console.log(chalk.magenta('_updateOldest: null'))
    let db = await kaisBattlepets.getDB()
    let oldestAverage = await db.collection('average').findOne({}, {sort: {lastUpdate: 1}, projection: {_id: 1, psid: 1}})
    return await this._updateSpeciesId(oldestAverage.psid)
  }

  async _updateSpeciesId (speciesId) {
    console.log(chalk.magenta('_updateSpeciesId: ' + speciesId))
    let db = await kaisBattlepets.getDB()

    await db.collection('average').updateOne({psid: speciesId}, {$set: {lastUpdate: Date.now()}})
  }

  async _crunchSpeciesAverage (speciesId, days) {
    console.log(chalk.magenta('_crunchSpeciesAverage: ' + speciesId))
    let daysMS = days * 24 * 60 * 60 * 1000
    let db = await kaisBattlepets.getDB()
    let results = await db.collection('auctionsArchive').find({petSpeciesId: speciesId, lastSeen: {$gte: Date.now() - daysMS}}, {sort: {lastSeen: -1}, limit: this.maxAuctionsPulled, projection: {
      _id: 0,
      buyout: 1,
      petSpeciesId: 1,
      petBreed: 1,
      petLevel: 1,
      aid: 1,
      ahid: 1,
      lastsSeen: 1,
      status: 1
    }}).toArray()

    let data = {
      sold: {
        mean: 0,
        median: 0,
        mode: 0,
        spread: 0,
        standardDeviation: 0,
        high: 0,
        low: 0,
        num: 0
      },
      canceled: {
        mean: 0,
        median: 0,
        mode: 0,
        spread: 0,
        standardDeviation: 0,
        high: 0,
        low: 0,
        num: 0
      },
      expired: {
        mean: 0,
        median: 0,
        mode: 0,
        spread: 0,
        standardDeviation: 0,
        high: 0,
        low: 0,
        num: 0
      }
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

  _sperad (numArray) {
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
