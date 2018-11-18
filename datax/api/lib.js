const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const chalk = require('chalk')
const md5 = require('md5')

class Lib {
  constructor () {
    this.cacheRealmAuctionHouse = {}
    this.cacheAuctionHouse = {}
    this.cacheAuctionHouseList = null
    this.cacheSpeciesAverage = {}
  }

  /*
  /// Realm
  */
  async realmAuctionHouse (realmId) {
    console.log(chalk.magenta('realmAuctionHouse: ' + realmId))
    if (this.cacheRealmAuctionHouse[realmId]) return this.cacheRealmAuctionHouse[realmId]

    // find acution house
    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').findOne({connected: realmId}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}})
    if (ahi !== null) {
      this.cacheRealmAuctionHouse[realmId] = ahi
      return this.realmAuctionHouse(realmId)
    }

    // Make a new auction house
    await db.collection('auctionHouseIndex').createIndex('ahid', {unique: true, name: 'ahid'})
    await db.collection('auctionHouseIndex').createIndex('slug', {name: 'slug'})
    await db.collection('auctionHouseIndex').createIndex('regionTag', {name: 'regionTag'})
    await db.collection('auctionHouseIndex').createIndex('connected', {name: 'connected'})
    let ri = await db.collection('realmIndex').find({connected: realmId}, {projection: {_id: 0, id: 1, slug: 1, regionTag: 1}}).toArray()
    let slug = ri.map(e => e.slug).sort().shift()
    let connected = ri.map(e => e.id)
    let regionTag = ri[0].regionTag
    let ahid = 'AH' + md5(slug + regionTag).substring(0, 6).toUpperCase()
    await db.collection('auctionHouseIndex').insertOne({ahid, slug, regionTag, connected})
    return await this.realmAuctionHouse(realmId)
  }

  /*
  /// Auction
  */
  async auctionHouse(ahid) {
    console.log(chalk.magenta('auctionHouse: ' + ahid))
    if (this.cacheAuctionHouse[ahid]) return this.cacheAuctionHouse[ahid]

    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').findOne({ahid: ahid}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}})
    if (ahi === null) throw {error: 'Auction house not found!'}
    this.cacheAuctionHouse[ahid] = ahi
    return await this.auctionHouse(ahid)
  }

  async auctionHouseList() {
    console.log(chalk.magenta('auctionHouseList: null'))
    if (this.cacheAuctionHouseList) return this.cacheAuctionHouseList

    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').find({}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}}).toArray()
    this.cacheAuctionHouseList = ahi
    return await this.auctionHouseList()
  }

  /*
  /// Average
  */
  async speciesAverage (speciesId) {
    console.log(chalk.magenta('speciesAverage: ' + speciesId))
    if (this.cacheSpeciesAverage[speciesId]) return this.cacheSpeciesAverage[speciesId]

    let db = await kaisBattlepets.getDB()
    let results = await db.collection('average').findOne({psid: speciesId})
    if (results !== null) {
      this.cacheSpeciesAverage[speciesId] = results
      return await this.speciesAverage(speciesId)
    }

    // species not found
    await this._newSpeciesAverageFound(speciesId)
    return await this.speciesAverage(speciesId)
  }
  async _newSpeciesAverageFound (speciesId) {
    console.log(chalk.magenta('newSpeciesFound: ' + speciesId))
    let db = await kaisBattlepets.getDB()
    await db.collection('average').createIndex('psid', {unique: true, name: 'psid'})
    await db.collection('average').createIndex('lastUpdate', {name: 'lastUpdate'})
    await db.collection('average').insertOne({
      psid: speciesId,
      lastUpdate: 0
    })
    return true
  }

}

module.exports = new Lib()
