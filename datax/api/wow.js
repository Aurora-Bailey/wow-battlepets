const axios = require('axios')
const credentials = require('./credentials.json')
const chalk = require('chalk')

class Wow {
  constructor () {
    this.token = false
    this.token_expires = (Date.now()/1000) + 100000
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
    console.log(chalk.cyan(`get: https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/?namespace=dynamic-${region.toLowerCase()}`))
    let response = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/?namespace=dynamic-${region.toLowerCase()}`, {headers: {'Authorization': "bearer " + token}})
    return response.data.realms
  }

  async getRealm (region, realmId) {
    let token = await this.authenticate()
    console.log(chalk.cyan(`get: https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/${realmId}?namespace=dynamic-${region.toLowerCase()}`))
    let response = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/data/wow/realm/${realmId}?namespace=dynamic-${region.toLowerCase()}`, {headers: {'Authorization': "bearer " + token}})
    return response.data.realms
  }

  async getMediaString (string) {
    let token = await this.authenticate()
    console.log(chalk.cyan('get: ' + string))
    let response = await axios.get(string, {headers: {'Authorization': "bearer " + token}})
    return response.data
  }

  /// -------------

  async getAuctions (region, server) {
    let token = await this.authenticate()
    console.log(chalk.cyan(`get: https://${region.toLowerCase()}.api.blizzard.com/wow/auction/data/${encodeURIComponent(server)}?access_token=${token}`))
    let response_token = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/wow/auction/data/${encodeURIComponent(server)}?access_token=${token}`, {headers: {'Authorization': "bearer " + token}})
    let response_auction = await axios.get(response_token.data.files[0].url)
    return response_auction.data.auctions
  }

  async getPetInfo (petId) {
    let token = await this.authenticate()
    console.log(chalk.cyan(`get: https://us.api.blizzard.com/wow/pet/species/${petId}`))
    let pet = await axios.get(`https://us.api.blizzard.com/wow/pet/species/${petId}`, {headers: {'Authorization': "bearer " + token}})
    return pet.data
  }

  async getCharacterPets (region, realm, character) {
    let token = await this.authenticate()
    console.log(chalk.cyan(`get: https://${region.toLowerCase()}.api.blizzard.com/wow/character/${realm}/${character}?fields=pets`))
    let response = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/wow/character/${realm}/${character}?fields=pets`, {headers: {'Authorization': "bearer " + token}})
    return response.data.pets.collected
  }
}

module.exports = new Wow()
