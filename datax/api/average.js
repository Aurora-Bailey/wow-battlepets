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
      this.updateOldest().catch(console.log)
    }, 10000, 0)
    return true
  }

  async updateOldest () {
    console.log(chalk.magenta('updateOldest: null'))
    let db = await kaisBattlepets.getDB()
    let oldestAverage = await db.collection('average').findOne({}, {sort: {lastUpdate: 1}, projection: {_id: 1, psid: 1}})

    await db.collection('average').updateOne({psid: oldestAverage.psid}, {$set: {lastUpdate: Date.now()}})
    return true
  }

  async crunchSpeciesAverage (speciesId) {
    console.log(chalk.magenta('crunchSpeciesAverage: ' + speciesId))
    let db = await kaisBattlepets.getDB()
    let results = await db.collection('auctionsArchive').find({petSpeciesId: speciesId}, {sort: {lastSeen: -1}, limit: this.maxAuctionsPulled, projection: {_id: 0, buyout: 1, petSpeciesId: 1, petBreed: 1, petLevel: 1, aid: 1, ahid: 1, lastsSeen: 1, status: 1}}).toArray()

  }
}

module.exports = new Average()

let x = new Average()
x.setupLoop().catch(console.log).then(console.log)
