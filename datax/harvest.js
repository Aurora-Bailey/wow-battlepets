const realm = require('./api/realm.js')
const auction = require('./api/auction.js')
const average = require('./api/average.js')
const fs = require('fs')

class Harvest {
  constructor () {
    this.start().catch(console.error).then(console.log)
  }

  async start () {
    await realm.buildRealmDatabase()
    await auction.setupLoop()
    await average.setupLoop()
    let lastCommitMessage = fs.readFileSync('../.git/COMMIT_EDITMSG')
    return `Running! COMMIT_EDITMSG: "${lastCommitMessage}"`
  }
}

const harvest = new Harvest()
