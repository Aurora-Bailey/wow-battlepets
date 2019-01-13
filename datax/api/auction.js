const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const lib = require('./lib.js')
const chalk = require('chalk')
const md5 = require('md5')
const wow = require('./wow.js')
const LockedInterval = require('./lockedinterval.js')

class Auction {
  constructor () {
    this.crawlTimespan = 50 // minutes, stagger the request across time
    this.crawlInterval = 60 // minutes, frequency of data pulls

    this.crawlTimespanMS = this.crawlTimespan * 60000 // in miliseconds
    this.crawlIntervalMS = this.crawlInterval * 60000 // in miliseconds
  }

  async setupLoop () {
    console.log(chalk.magenta('setupLoop:'))
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
    console.log(chalk.magenta('_updateAuctionHouse: ') + ahid)
    let db = await kaisBattlepets.getDB()
    let auctionsLive = await wow.getAuctions(ahid)
    auctionsLive = auctionsLive.filter(auc => {
      return typeof auc.petSpeciesId !== 'undefined'
    })
    let auctionsOld = await db.collection('auctionsLive').find({ahid}).toArray()

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

    for (var index in auctionsLive) {
      let auction = auctionsLive[index]
      auction.new = !auctionsOldMap.includes(auction.aid)
      if (auction.new) {
        auction.live = true
        auction.status = 'live'
        if (auction.petLevel < 25) auction.petLevel = 1 // colapse pet level to 25 or 1
        let ah = await lib.auctionHouse(auction.ahid)
        let average = await lib.speciesAverageRegion (auction.petSpeciesId, auction.petLevel, ah.regionTag)
        if (average !== null) {
          auction.median = average.sold.median
          auction.profit = (auction.median * 0.95) - auction.buyout
          auction.percent = this._percent(auction.profit, auction.buyout)
          auction.soldNum = average.sold.num
        } else {
          auction.median = 0
          auction.profit = 0
          auction.percent = 0
          auction.soldNum = 0
        }
      }
    }

    auctionsOld.forEach(auction => {
      auction.new = false
      auction.live = auctionsLiveMap.includes(auction.aid)
      if (!auction.live) {
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

    let auctionsMissing = auctionsOld.filter(a => !a.live)
    let auctionsMissingAid = auctionsMissing.map(a => a.aid)
    let auctionsNew = auctionsLive.filter(a => a.new)

    // Add to database
    await db.collection('auctionsLive').createIndex('ahid', {name: 'ahid'})
    await db.collection('auctionsLive').createIndex('owner', {name: 'owner'})
    await db.collection('auctionsLive').createIndex('new', {name: 'new'})
    await db.collection('auctionsLive').createIndex('petSpeciesId', {name: 'petSpeciesId'})
    await db.collection('auctionsLive').createIndex('lastSeen', {name: 'lastSeen'})
    if (auctionsMissingAid.length > 0) await db.collection('auctionsLive').deleteMany({aid: {$in: auctionsMissingAid}})
    await db.collection('auctionsLive').updateMany({ahid}, {$set: {new: false, lastSeen: Date.now()}})
    if (auctionsNew.length > 0) await db.collection('auctionsLive').insertMany(auctionsNew)
    for (var index in auctionsLive) {
      let al = auctionsLive[index]
      db.collection('auctionsLive').updateOne({aid: al.aid}, {$set: {timeLeft: al.timeLeft}}).catch(console.error)
    }

    await db.collection('auctionsArchive').createIndex('ahid', {name: 'ahid'})
    await db.collection('auctionsArchive').createIndex('owner', {name: 'owner'})
    await db.collection('auctionsArchive').createIndex('status', {name: 'status'})
    await db.collection('auctionsArchive').createIndex('petSpeciesId', {name: 'petSpeciesId'})
    await db.collection('auctionsArchive').createIndex('lastSeen', {name: 'lastSeen'})
    if (auctionsMissing.length > 0) await db.collection('auctionsArchive').insertMany(auctionsMissing)
    console.log(chalk.green('_updateAuctionHouse: ') + ahid)
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
  _percent (a, b) {
    return ( a/b ) * 100
  }
}

module.exports = new Auction()
