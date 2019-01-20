const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const lib = require('./lib.js')
const axios = require('axios')
const credentials = require('./credentials.json')
const chalk = require('chalk')

class Wow {
  constructor () {
    this.token = false
    this.token_expires = (Date.now()/1000) + 100000

    this.auctionHouseLastModified = {}
  }

  async authenticate () {
    if (this.token !== false && (Date.now()/1000) < this.token_expires) return this.token
    let response = await axios.post(
      'https://us.battle.net/oauth/token',
      `grant_type=client_credentials`,
      {auth: {username: credentials.client_id, password: credentials.client_secret}}
    )
    this.token = response.data.access_token
    this.token_expires = (Date.now()/1000) + response.data.expires_in - 300
    return this.token
  }

  async getRealmIndex (region) {
    let token = await this.authenticate()
    console.log(chalk.cyan(`wow-api: `) + chalk.white(`https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/?namespace=dynamic-${region.toLowerCase()}`))
    let response = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/?namespace=dynamic-${region.toLowerCase()}`, {headers: {'Authorization': "bearer " + token}})
    return response.data.realms
  }

  async getRealm (region, realmId) {
    let token = await this.authenticate()
    console.log(chalk.cyan(`wow-api: `) + chalk.white(`https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/${realmId}?namespace=dynamic-${region.toLowerCase()}`))
    let response = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/${realmId}?namespace=dynamic-${region.toLowerCase()}`, {headers: {'Authorization': "bearer " + token}})
    return response.data.realms
  }

  async getMediaString (string) {
    let token = await this.authenticate()
    console.log(chalk.cyan('wow-api: ') + string)
    let response = await axios.get(string, {headers: {'Authorization': "bearer " + token}})
    return response.data
  }

  async getAuctions (ahid) {
    let auctionHouse = await lib.auctionHouse(ahid)
    let token = await this.authenticate()
    console.log(chalk.cyan(`wow-api: `) + chalk.red('(forced) ') + chalk.white(`https://${auctionHouse.regionTag.toLowerCase()}.api.blizzard.com/wow/auction/data/${encodeURIComponent(auctionHouse.slug)}`))
    let response_token = await axios.get(`https://${auctionHouse.regionTag.toLowerCase()}.api.blizzard.com/wow/auction/data/${encodeURIComponent(auctionHouse.slug)}`, {headers: {'Authorization': "bearer " + token}})
    let response_auction = await axios.get(response_token.data.files[0].url)
    return response_auction.data.auctions
  }

  async getAuctionsIfModified (ahid) {
    let auctionHouse = await lib.auctionHouse(ahid)
    let token = await this.authenticate()
    // console.log(chalk.cyan(`wow-api: `) + chalk.white(`https://${auctionHouse.regionTag.toLowerCase()}.api.blizzard.com/wow/auction/data/${encodeURIComponent(auctionHouse.slug)}`))
    let response_token = await axios.get(`https://${auctionHouse.regionTag.toLowerCase()}.api.blizzard.com/wow/auction/data/${encodeURIComponent(auctionHouse.slug)}`, {headers: {'Authorization': "bearer " + token}})
    let {lastModified, url} = response_token.data.files[0]
    // Return null if content has not been modified
    let previousLastModified = await this._getAuctionHouseLastModified(ahid)
    if (previousLastModified >= lastModified) return null // Auction has not changed since last request
    // New content is available
    console.log(chalk.cyan(`wow-api: `) + chalk.yellow(`${auctionHouse.regionTag} ${auctionHouse.slug} ${ahid}`) + ' ' + chalk.white(url))
    let response_auction = await axios.get(url)
    this._setAuctionHouseLastModified (ahid, lastModified)
    return response_auction.data.auctions

  }
  async _getAuctionHouseLastModified (ahid) {
    if (this.auctionHouseLastModified[ahid]) return this.auctionHouseLastModified[ahid]
    let db = await kaisBattlepets.getDB()
    let result = await db.collection('auctionHouseLastModified').findOne({ahid})
    if (result === null) {
      // datbase is empty, create a postdate random modifed date
      let postDate = Date.now() + (1000*60*60*Math.random()) // 0 to 1 hours
      await this._setAuctionHouseLastModified(ahid, postDate)
      result = {ahid, lastModified: postDate} // fake response
    }
    this.auctionHouseLastModified[ahid] = result.lastModified
    return result.lastModified
  }
  async _setAuctionHouseLastModified (ahid, lastModified) {
    this.auctionHouseLastModified[ahid] = lastModified
    let db = await kaisBattlepets.getDB()
    await db.collection('auctionHouseLastModified').createIndex('ahid', {unique: true, name: 'ahid'})
    await db.collection('auctionHouseLastModified').createIndex('lastModified', {name: 'lastModified'})
    await db.collection('auctionHouseLastModified').updateOne({ahid}, {$set: {ahid, lastModified}}, {upsert: true})
    return lastModified
  }

  async getPetInfo (petId) {
    let token = await this.authenticate()
    console.log(chalk.cyan(`wow-api: `) + chalk.white(`https://us.api.blizzard.com/wow/pet/species/${petId}`))
    let pet = await axios.get(`https://us.api.blizzard.com/wow/pet/species/${petId}`, {headers: {'Authorization': "bearer " + token}})
    return pet.data
  }

  async getCharacterPets (rid, character) {
    let db = await kaisBattlepets.getDB()
    let realmObject = await db.collection('realmIndex').findOne({id: rid})
    if (realmObject === null) throw 'Realm not found!'
    let realm = realmObject.slug
    let region = realmObject.regionTag
    let token = await this.authenticate()
    console.log(chalk.cyan(`wow-api: `) + chalk.white(`https://${region.toLowerCase()}.api.blizzard.com/wow/character/${realm}/${character}?fields=pets`))
    let response = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/wow/character/${realm}/${character}?fields=pets`, {headers: {'Authorization': "bearer " + token}})
    return response.data.pets.collected
  }
}

module.exports = new Wow()
