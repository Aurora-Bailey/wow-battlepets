const MongoDB = require('../api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class PetIndex {
  constructor () {

  }

  async request (query) {
    let db = await kaisBattlepets.getDB()
    let pets = await db.collection('petInfo').find({}, {projection: {_id: 0, speciesId: 1, name: 1, icon: 1}}).toArray()
    pets.map(pet => {
      pet.image = `http://media.blizzard.com/wow/icons/56/${pet.icon}.jpg`
    })
    return pets
  }
}

module.exports = new PetIndex()
