const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('../api/wow.js')
const lib = require('../api/lib.js')

class Collection {
  constructor () {

  }

  async request (query) {
    query.rid = parseInt(query.rid)
    // get pets from blizzard
    let pets = await wow.getCharacterPets(query.rid, query.name)

    // resolve realm id
    let db = await kaisBattlepets.getDB()
    let realm = await db.collection('realmIndex').findOne({id: query.rid})
    if (realm === null) throw 'Realm not found!'

    // pullin averages
    for (var index in pets) {
      let pet = pets[index]
      let level = parseInt(pet.stats.level)
      if (level !== 25) level = 1
      pet.speciesId = pet.stats.speciesId
      pet.average = await lib.speciesAverageRegion(pet.speciesId, level, realm.regionTag)
      if (pet.average === null) pet.average = {sold: {median: 0, num: 0}}
    }

    console.log(pets[0])

    return pets.map(pet => {
      return {
        psid: pet.stats.speciesId,
        level: pet.stats.level,
        price: pet.average.sold.median,
        sold: pet.average.sold.num,
        guid: pet.battlePetGuid,
        quality: pet.stats.petQualityId
      }
    })
  }
}

module.exports = new Collection()
