const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const chalk = require('chalk')
const md5 = require('md5')

class Lib {
  constructor () {
    this.cacheRealmAuctionHouse = {}
    this.cacheSpeciesAverageRegion = {}
    this.cacheAuctionHouseHealth = {}
    this.cacheAuctionHouse = {}
    this.cacheAuctionHouseList = null
  }

  /*
  /// Realm
  */
  async realmAuctionHouse (realmId) {
    if (this.cacheRealmAuctionHouse[realmId]) console.log(chalk.yellow('(m)') + chalk.magenta('realmAuctionHouse: ') + realmId)
    else console.log(chalk.magenta('realmAuctionHouse: ') + realmId)
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
  /// Average
  */
  async speciesAverageRegion (speciesId, level, region) {
    let id = speciesId + region + level
    if (typeof this.cacheSpeciesAverageRegion[id] === 'undefined') this.cacheSpeciesAverageRegion[id] = {results: null, date: 0, expire: 0, valid: false}

    // invalidate old data
    if (this.cacheSpeciesAverageRegion[id].expire < Date.now()) this.cacheSpeciesAverageRegion[id].valid = false
    if (this.cacheSpeciesAverageRegion[id].expire < Date.now() && this.cacheSpeciesAverageRegion[id].expire !== 0) console.log(chalk.cyanBright('Expire speciesAverageRegion: ') + speciesId + ' ' + level + ' ' + region)

    // console out
    // if (this.cacheSpeciesAverageRegion[id].valid) console.log(chalk.yellow('(m)') + chalk.magenta('speciesAverageRegion: ') + speciesId + ' ' + level + ' ' + region)
    // else console.log(chalk.magenta('speciesAverageRegion: ') + speciesId + ' ' + level + ' ' + region)

    // return from cash
    if (this.cacheSpeciesAverageRegion[id].valid) return this.cacheSpeciesAverageRegion[id].results

    // return form database
    let db = await kaisBattlepets.getDB()
    let results = await db.collection('average').findOne({psid: speciesId, petLevel: level, region: region, ahid: null})
    this.cacheSpeciesAverageRegion[id] = {results, date: Date.now(), expire: Date.now() + (1000*60*60*24) + (Math.random() * 1000*60*60*6), valid: true}
    return results
  }

  /*
  /// Health
  */
  async auctionHouseHealth(ahid) {
    if (this.cacheAuctionHouseHealth[ahid]) return this.cacheAuctionHouseHealth[ahid]

    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseHealth').findOne({ahid: ahid})
    if (ahi === null) throw 'Auction house not found!'
    this.cacheAuctionHouseHealth[ahid] = ahi
    return ahi
  }

  /*
  /// Auction
  */
  async auctionHouse(ahid) {
    // if (this.cacheAuctionHouse[ahid]) console.log(chalk.yellow('(m)') + chalk.magenta('auctionHouse: ') + ahid)
    // else console.log(chalk.magenta('auctionHouse: ') + ahid)

    if (this.cacheAuctionHouse[ahid]) return this.cacheAuctionHouse[ahid]

    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').findOne({ahid: ahid}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}})
    if (ahi === null) throw 'Auction house not found!'
    this.cacheAuctionHouse[ahid] = ahi
    return ahi
  }

  async auctionHouseList() {
    if (this.cacheAuctionHouseList) console.log(chalk.yellow('(m)') + chalk.magenta('auctionHouseList:'))
    else console.log(chalk.magenta('auctionHouseList:'))

    if (this.cacheAuctionHouseList) return this.cacheAuctionHouseList

    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').find({regionTag: "US"}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}}).toArray()
    this.cacheAuctionHouseList = ahi
    return ahi
  }
}

module.exports = new Lib()
