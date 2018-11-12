const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow_battlepets = new MongoDB('wow_battlepets')
const wow = require('./wow.js')
const chalk = require('chalk')

class Realm {
  constructor () {

  }

  async getRealms () {
    let db = await kaisBattlepets.getDB()
    let response = awaitdb.collection('realmIndex').find({}).toArray()
    return response
  }

  timeout (ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, ms)
    })
  }

  async getRealmAuctionHouse (realmId) {
    let db = await kaisBattlepets.getDB()
    let x = await db.collection('auctionHouseIndex').find({connected: realmId}, {projection: {_id: 0, id: 1, slug: 1}}).toArray()
    if (x.length > 0) return x[0]
    else throw {error: 'Realm id not found!'}
  }

  async updateRealms (stage = 1) {
    let db = await kaisBattlepets.getDB()

    await db.collection('realmIndex').createIndex('id', {unique: true, name: 'realmId'})
    await db.collection('realmIndex').createIndex('regionTag', {name: 'regionTag'})

    if (stage === 1) {
      stage = 2

      try {
        console.log(chalk.greenBright('// Get realm index from blizzard - stage 1'))
        let getRealmIndexUS = await wow.getRealmIndex('US')
        await this.timeout(1000)
        let getRealmIndexEU = await wow.getRealmIndex('EU')
        await this.timeout(1000)
        let getRealmIndexKR = await wow.getRealmIndex('KR')
        await this.timeout(1000)
        let getRealmIndexTW = await wow.getRealmIndex('TW')
        await this.timeout(1000)
        getRealmIndexUS = getRealmIndexUS.map(x => { return {regionTag: 'US', id: x.id, key: x.key, dataStage: 1} })
        getRealmIndexEU = getRealmIndexEU.map(x => { return {regionTag: 'EU', id: x.id, key: x.key, dataStage: 1} })
        getRealmIndexKR = getRealmIndexKR.map(x => { return {regionTag: 'KR', id: x.id, key: x.key, dataStage: 1} })
        getRealmIndexTW = getRealmIndexTW.map(x => { return {regionTag: 'TW', id: x.id, key: x.key, dataStage: 1} })
        let realmIndex = getRealmIndexUS.concat(getRealmIndexEU, getRealmIndexKR, getRealmIndexTW)

        console.log(chalk.greenBright('// Add realms to database'))
        for (var index in realmIndex) {
          await db.collection('realmIndex').insertOne(realmIndex[index], {}).catch(() => {})
        }
      } catch (e) {
        console.log('Failed to get realm index.')
        console.log(chalk.yellowBright(JSON.stringify(e.response.data)))
        stage = 1
      }
    }

    if (stage === 2) {
      stage = 3

      console.log(chalk.greenBright('// Get the full data object - stage 2'))
      let realmsWithoutFullData = await db.collection('realmIndex').find({dataStage: 1}, {projection: {_id: 0, id: 1, key: 1}}).toArray()
      for (var index in realmsWithoutFullData) {
        if (realmsWithoutFullData.hasOwnProperty(index)) {
          let rwfd = realmsWithoutFullData[index]
          try {
            await this.timeout(1000)
            var response = await wow.getMediaString(rwfd.key.href)
            response.dataStage = 2
            await db.collection('realmIndex').updateOne({id: rwfd.id}, {$set: response})
          } catch (e) {
            console.log('Error on #', rwfd.id)
            console.log(chalk.yellowBright(JSON.stringify(e.response.data)))
            stage = 2
          }
        }
      }
    }

    if (stage === 3) {
      stage = 4

      console.log(chalk.greenBright('// Get connected realms - stage 3'))
      let realmsWithoutConnectedRealmData = await db.collection('realmIndex').find({dataStage: 2}, {projection: {_id: 0, id: 1, connected_realm: 1}}).toArray()
      for (var index in realmsWithoutConnectedRealmData) {
        if (realmsWithoutConnectedRealmData.hasOwnProperty(index)) {
          let rwcrd = realmsWithoutConnectedRealmData[index]
          try {
            await this.timeout(1000)
            var response = await wow.getMediaString(rwcrd.connected_realm.href)
            await db.collection('realmIndex').updateOne({id: rwcrd.id}, {$set: {dataStage: 3, connected_realm_data: response}})
          } catch (e) {
            console.log('Error on #', rwcrd.id)
            console.log(chalk.yellowBright(JSON.stringify(e.response.data)))
            stage = 3
          }
        }
      }
    }

    if (stage === 4) {
      stage = 5

      console.log(chalk.greenBright('// Convert connected realms into an array of ids - stage 4'))
      let realmsWithoutConnected = await db.collection('realmIndex').find({dataStage: 3}, {projection: {_id: 0, id: 1, connected_realm_data: 1}}).toArray()
      for (var index in realmsWithoutConnected) {
        if (realmsWithoutConnected.hasOwnProperty(index)) {
          let rwc = realmsWithoutConnected[index]
          try {
            var connected = rwc.connected_realm_data.realms.map(e => e.id)
            await db.collection('realmIndex').updateOne({id: rwc.id}, {$set: {dataStage: 4, connected: connected}})
          } catch (e) {
            console.log('Error on #', rwc.id)
            stage = 4
          }
        }
      }
    }

    if (stage === 5) {
      console.log(chalk.greenBright('// done'))
      return true
    } else {
      console.log(chalk.greenBright('// 1 minute timeout before trying again'))
      await this.timeout(1000*60)
      return await this.updateRealms(stage)
    }
  }

}

module.exports = new Realm()

let x = new Realm()
x.updateRealms().then(console.log).catch(console.error)
