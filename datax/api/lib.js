const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const chalk = require('chalk')
const md5 = require('md5')

class Lib {
  constructor () {
  }

  /*
  /// Realm
  */
  async realmAuctionHouse (realmId) {
    console.log(chalk.magenta('realmAuctionHouse: ' + realmId))
    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').find({connected: realmId}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}}).toArray()
    if (ahi.length > 0) return ahi[0] // auction house already exists

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
    return {ahid, slug, regionTag}
  }

  /*
  /// Auction
  */
  async auctionHouse(ahid) {
    console.log(chalk.magenta('ah: ahid=' + ahid))
    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').find({ahid: ahid}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}}).toArray()
    if (ahi.length > 0) return ahi[0] // auction house already exists
    else throw {error: 'Auction house not found!'}
  }

  async auctionHouseList() {
    console.log(chalk.magenta('ahl: null'))
    let db = await kaisBattlepets.getDB()
    let ahi = await db.collection('auctionHouseIndex').find({}, {projection: {_id: 0, ahid: 1, slug: 1, regionTag: 1}}).toArray()
    return ahi
  }

  /*
  /// Average
  */
  async speciesAverage (speciesId) {
    console.log(chalk.magenta('speciesAverage: ' + speciesId))
    let db = await kaisBattlepets.getDB()
    let results = await db.collection('average').findOne({psid: speciesId})
    if (results !== null) return results

    // species not found
    await this._newSpeciesAverageFound(speciesId)
    return await this.speciesAverage(speciesId)
  }
  async _newSpeciesAverageFound (speciesId) {
    console.log(chalk.magenta('newSpeciesFound: ' + speciesId))
    let db = await kaisBattlepets.getDB()
    await db.collection('average').createIndex('psid', {unique: true, name: 'psid'})
    await db.collection('average').createIndex('lastUpdate', {name: 'lastUpdate'})
    await db.collection('average').insertOne({psid: speciesId, lastUpdate: 0})
    return true
  }

}

module.exports = new Lib()
