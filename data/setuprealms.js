const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')
const wowapi = require('./wow-api.js')

class Setup {
  constructor () {

  }

  async getRealms () {
    let db = await wow_battlepets.getDB()

    let us = await wowapi.realmStatus('US')
    let eu = await wowapi.realmStatus('EU')
    let kr = await wowapi.realmStatus('KR')
    let tw = await wowapi.realmStatus('TW')
    us.forEach(realm => {realm.region = "US"})
    eu.forEach(realm => {realm.region = "EU"})
    kr.forEach(realm => {realm.region = "KR"})
    tw.forEach(realm => {realm.region = "TW"})

    // Merge realms
    let realms = us.concat(eu, kr, tw)
    realms.forEach(realm => {
      realm.id = realm.slug + "-" + realm.region
      realm.auction_slug = realm.connected_realms.sort()[0]
    })

    // Build list of unique auction housed (default auction house for connected realms)
    let uniqueAuctionSlugs = {}
    realms.forEach(realm => {
      let auctionSlug = realm.auction_slug + ',' + realm.region
      uniqueAuctionSlugs[auctionSlug] = true
    })
    let auctionHouses = Object.keys(uniqueAuctionSlugs).sort().map(regionSlug =>{
      let s = regionSlug.split(',')
      return {id: s[0] + '-' + s[1], slug: s[0], region: s[1]}
    })

    // Update Database
    let queue = auctionHouses.length + realms.length
    let auction_index = await db.collection('auction_houses').createIndex('id', {unique: true, name: 'auction_id'})
    let realm_index = await db.collection('realms').createIndex('id', {unique: true, name: 'realm_id'})
    auctionHouses.forEach(house => {
      db.collection('auction_houses').updateOne({id: house.id}, {$set: house}, {upsert: true}).catch(console.error).then(() => {
        queue--
        if (queue == 0) {
          console.log('done')
          wow_battlepets.close()
        }
      })
    })
    realms.forEach(realm => {
      db.collection('realms').updateOne({id: realm.id}, {$set: realm}, {upsert: true}).catch(console.error).then(() => {
        queue--
        if (queue == 0) {
          console.log('done')
          wow_battlepets.close()
        }
      })
    })
  }
}

let setup = new Setup()
setup.getRealms().catch(console.error)
