const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class RealmIndex {
  constructor () {

  }

  // {language: 'en_US'}
  async request (query) {
    let db = await kaisBattlepets.getDB()
    let realms = await db.collection('realmIndex').find({}, {projection: {_id: 0, regionTag: 1, id: 1, name: 1, slug: 1, connected: 1, ahid: 1}}).toArray()
    realms.map(realm => {
      if (query.language && realm.name[query.language]) realm.name = realm.name[query.language]
      else realm.name = realm.name['en_US']
    })
    return realms
  }
}

module.exports = new RealmIndex()
