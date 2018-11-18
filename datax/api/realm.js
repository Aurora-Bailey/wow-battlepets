const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const lib = require('./lib.js')
const wow = require('./wow.js')
const chalk = require('chalk')
const md5 = require('md5')
const slugify = require('slugify')

class Realm {
  constructor () {

  }

  async buildRealmDatabase (stage = 1) {
    console.log(chalk.magenta('buildRealmDatabase: ' + stage))
    let db = await kaisBattlepets.getDB()

    await db.collection('realmIndex').createIndex('id', {unique: true, name: 'realmId'})
    await db.collection('realmIndex').createIndex('regionTag', {name: 'regionTag'})
    await db.collection('realmIndex').createIndex('slug', {name: 'slug'})

    if (stage === 1) {
      stage = 2

      try {
        console.log(chalk.green('// Get realm index from blizzard - stage 1'))
        let getRealmIndexUS = await wow.getRealmIndex('US')
        await this._timeout(1000)
        let getRealmIndexEU = await wow.getRealmIndex('EU')
        await this._timeout(1000)
        let getRealmIndexKR = await wow.getRealmIndex('KR')
        await this._timeout(1000)
        let getRealmIndexTW = await wow.getRealmIndex('TW')
        await this._timeout(1000)
        getRealmIndexUS = getRealmIndexUS.map(x => { return {regionTag: 'US', id: x.id, key: x.key, dataStage: 1} })
        getRealmIndexEU = getRealmIndexEU.map(x => { return {regionTag: 'EU', id: x.id, key: x.key, dataStage: 1} })
        getRealmIndexKR = getRealmIndexKR.map(x => { return {regionTag: 'KR', id: x.id, key: x.key, dataStage: 1} })
        getRealmIndexTW = getRealmIndexTW.map(x => { return {regionTag: 'TW', id: x.id, key: x.key, dataStage: 1} })
        let realmIndex = getRealmIndexUS.concat(getRealmIndexEU, getRealmIndexKR, getRealmIndexTW)

        console.log(chalk.green('// Add realms to database'))
        for (var index in realmIndex) {
          await db.collection('realmIndex').insertOne(realmIndex[index], {}).catch(() => {})
        }
      } catch (e) {
        console.log('Failed to get realm index.')
        console.log(chalk.yellow(JSON.stringify(e.response.data)))
        stage = 1
      }
    }

    if (stage === 2) {
      stage = 3

      console.log(chalk.green('// Get the full data object - stage 2'))
      let realmsWithoutFullData = await db.collection('realmIndex').find({dataStage: 1}, {projection: {_id: 0, id: 1, key: 1}}).toArray()
      for (var index in realmsWithoutFullData) {
        if (realmsWithoutFullData.hasOwnProperty(index)) {
          let rwfd = realmsWithoutFullData[index]
          try {
            await this._timeout(1000)
            var response = await wow.getMediaString(rwfd.key.href)
            response.dataStage = 2
            response.slug = slugify(response.slug)
            await db.collection('realmIndex').updateOne({id: rwfd.id}, {$set: response})
          } catch (e) {
            console.log('Error on #', rwfd.id)
            console.log(chalk.yellow(JSON.stringify(e.response.data)))
            stage = 2
          }
        }
      }
    }

    if (stage === 3) {
      stage = 4

      console.log(chalk.green('// Get connected realms - stage 3'))
      let realmsWithoutConnectedRealmData = await db.collection('realmIndex').find({dataStage: 2}, {projection: {_id: 0, id: 1, connected_realm: 1}}).toArray()
      for (var index in realmsWithoutConnectedRealmData) {
        if (realmsWithoutConnectedRealmData.hasOwnProperty(index)) {
          let rwcrd = realmsWithoutConnectedRealmData[index]
          try {
            await this._timeout(1000)
            var response = await wow.getMediaString(rwcrd.connected_realm.href)
            await db.collection('realmIndex').updateOne({id: rwcrd.id}, {$set: {dataStage: 3, connected_realm_data: response}})
          } catch (e) {
            console.log('Error on #', rwcrd.id)
            console.log(chalk.yellow(JSON.stringify(e.response.data)))
            stage = 3
          }
        }
      }
    }

    if (stage === 4) {
      stage = 5

      console.log(chalk.green('// Convert connected realms into an array of ids - stage 4'))
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
      stage = 6

      console.log(chalk.green('// Assign aucion houses - stage 5'))
      let realmsWithoutAuctionHouse = await db.collection('realmIndex').find({dataStage: 4}, {projection: {_id: 0, id: 1}}).toArray()
      for (var index in realmsWithoutAuctionHouse) {
        if (realmsWithoutAuctionHouse.hasOwnProperty(index)) {
          let rwah = realmsWithoutAuctionHouse[index]
          try {
            await this._timeout(50)
            let auctionHouse = await lib.realmAuctionHouse(rwah.id)
            await db.collection('realmIndex').updateOne({id: rwah.id}, {$set: {dataStage: 5, ahid: auctionHouse.ahid}})
          } catch (e) {
            console.log('Error on #', rwah.id)
            console.log(e)
            stage = 5
          }
        }
      }
    }

    if (stage === 6) {
      console.log(chalk.green('// done'))
      return true
    } else {
      console.log(chalk.green('// 10 second timeout before trying again'))
      await this._timeout(10000)
      return await this.buildRealmDatabase(stage)
    }
  }

  _timeout (ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, ms)
    })
  }

}

module.exports = new Realm()
