const realm = require('./api/realm.js')
const auction = require('./api/auction.js')

class Harvest {
  constructor () {
    this.start().catch(console.error).then(console.log)
  }

  async start () {
    await realm.buildRealmDatabase(2)
    await auction.setupLoop()
    return 'Running!'
  }
}

const harvest = new Harvest()
