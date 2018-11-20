const realm = require('./api/realm.js')
const auction = require('./api/auction.js')
const average = require('./api/average.js')

class Harvest {
  constructor () {
    this.start().catch(console.error).then(console.log)
  }

  async start () {
    await realm.buildRealmDatabase()
    await auction.setupLoop()
    await average.setupLoop()
    return 'Running!'
  }
}

const harvest = new Harvest()