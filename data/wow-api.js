const axios = require('axios')
const credentials = require('./credentials.json')

let version = 0.1

class WoWAPI {
  constructor () {
    // token
    this.token = false
    this.token_expires = (Date.now()/1000) + 100000
  }

  async auctions (server) {
    let token = await this.authenticate()
    let response_token = await axios.get(`https://us.api.blizzard.com/wow/auction/data/${server}?access_token=${token}`)
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
}

module.exports = new WoWAPI()
