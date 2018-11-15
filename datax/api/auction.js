const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const lib = require('./lib.js')
const chalk = require('chalk')
const md5 = require('md5')
const wow = require('./wow.js')
const realm = require('./realm.js')
const LockedInterval = require('./lockedinterval.js')

class Auction {
  constructor () {
    this.crawlTimespan = 50 // minutes, stagger the request across time
    this.crawlInterval = 60 // minutes, frequency of data pulls

    this.crawlTimespanMS = this.crawlTimespan * 60000 // in miliseconds
    this.crawlIntervalMS = this.crawlInterval * 60000 // in miliseconds
  }

  async setupLoop () {
    console.log(chalk.magenta('sl: null'))
    let ahl = await lib.auctionHouseList()
    let crawlStagger = this.crawlTimespanMS / ahl.length
    ahl.forEach((ah, i) => {
      new LockedInterval(() => {
        this._updateAuctionHouse(ah.ahid).catch(e => {
          console.log(chalk.green('// Update auction house failed! Trying a second time.'))
          console.error(e)
          this._updateAuctionHouse(ah.ahid).catch(console.error)
        })
      }, this.crawlIntervalMS, i * crawlStagger)
    })
    return true
  }

  async _updateAuctionHouse (ahid) {
    console.log(chalk.magenta('uah: ahid=' + ahid))
    let db = await kaisBattlepets.getDB()
    let auctionsLive = await wow.getAuctions(ahid)
    auctionsLive = auctionsLive.filter(auc => {
      return typeof auc.petSpeciesId !== 'undefined'
    })
    let auctionsOld = await db.collection('auctionsLive').find({ahid}).toArray()
    let auctionsMissing = []

    // Add additional stats to new auctions
    auctionsLive.forEach(auction => {
      auction.aid = 'AUC' + md5(auction.auc + auction.owner).toUpperCase()
      auction.ahid = ahid
      auction.lastSeen = Date.now()
    })

    // Identify old and new
    let auctionsLiveMap = auctionsLive.map(auc => auc.aid)
    let auctionsOldMap = auctionsOld.map(auc => auc.aid)
    let auctionsLiveSpeciesIdLookup = {}
    auctionsLive.forEach(auction => {
      if (typeof auctionsLiveSpeciesIdLookup[auction.petSpeciesId] === 'undefined') auctionsLiveSpeciesIdLookup[auction.petSpeciesId] = []
      auctionsLiveSpeciesIdLookup[auction.petSpeciesId].push(auction)
    })

    auctionsLive.forEach(auction => {
      auction.new = !auctionsOldMap.includes(auction.aid)
      auction.live = true
      auction.status = 'live'
    })
    auctionsOld.forEach(auction => {
      auction.new = false
      auction.live = auctionsLiveMap.includes(auction.aid)
      if (!auction.live) {
        auctionsMissing.push(auction)
        // auction has been sold canceled or expired.
        if (auction.lastSeen < Date.now() - (1000*60*60*1.5)) {
          auction.status = 'timeskip'
        } else if (auction.timeLeft === 'SHORT' || auction.timeLeft === 'MEDIUM') {
          auction.status = 'expired'
        } else if (this._ownerReposted(auctionsLiveSpeciesIdLookup[auction.petSpeciesId], auction.owner, auction.petSpeciesId)) {
          auction.status = 'canceled'
        } else {
          auction.status = 'sold'
        }
      }
    })

    // Add to database
    await db.collection('auctionsLive').createIndex('aid', {unique: true, name: 'aid'})
    await db.collection('auctionsLive').createIndex('ahid', {name: 'ahid'})
    await db.collection('auctionsLive').createIndex('new', {name: 'new'})
    await db.collection('auctionsLive').createIndex('petSpeciesId', {name: 'petSpeciesId'})
    await db.collection('auctionsLive').createIndex('lastSeen', {name: 'lastSeen'})
    await db.collection('auctionsLive').deleteMany({ahid})
    await db.collection('auctionsLive').insertMany(auctionsLive)

    await db.collection('auctionsArchive').createIndex('aid', {unique: true, name: 'aid'})
    await db.collection('auctionsArchive').createIndex('ahid', {name: 'ahid'})
    await db.collection('auctionsArchive').createIndex('status', {name: 'status'})
    await db.collection('auctionsArchive').createIndex('petSpeciesId', {name: 'petSpeciesId'})
    await db.collection('auctionsArchive').createIndex('lastSeen', {name: 'lastSeen'})
    if (auctionsMissing.length > 0) await db.collection('auctionsArchive').insertMany(auctionsMissing)
    return true
  }

  _ownerReposted (auctions, owner, petSpeciesId) {
    if (!auctions) return false
    let repost = false
    auctions.forEach(auction => {
      if (auction.owner === owner && auction.petSpeciesId === petSpeciesId && auction.new === true) repost = true
    })
    return repost
  }
}

module.exports = new Auction()
