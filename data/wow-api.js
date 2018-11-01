const axios = require('axios')
const credentials = require('./credentials.json')

let version = 0.1

class WoWAPI {
  constructor () {
    // token
    this.token = false
    this.token_expires = (Date.now()/1000) + 100000
  }

  async auctions (region, server) {
    let token = await this.authenticate()
    let response_token = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/wow/auction/data/${encodeURIComponent(server)}?access_token=${token}`)
    let response_auction = await axios.get(response_token.data.files[0].url)
    return response_auction.data.auctions
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

  async realmStatus (region) {
    let token = await this.authenticate()
    let response_realm = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/wow/realm/status?access_token=${token}`)
    return response_realm.data.realms
  }

  async petInfo (petId) {
    let token = await this.authenticate()
    let pet = await axios.get(`https://us.api.blizzard.com/wow/pet/species/${petId}?access_token=${token}`)
    return pet.data
  }

  async characterPets (region, realm, character) {
    let token = await this.authenticate()
    let response_realm = await axios.get(`https://${region.toLowerCase()}.api.blizzard.com/wow/character/${realm}/${character}?fields=pets&access_token=${token}`)
    return response_realm.data.pets.collected.map(pet => { return { name: pet.name, speciesId: pet.stats.speciesId, level: pet.stats.level}})
  }
}

module.exports = new WoWAPI()
