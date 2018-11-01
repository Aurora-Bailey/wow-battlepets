const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')
const wowapi = require('./wow-api.js')

class PetInfo {
  constructor () {
    this.petList = {}
    this.getPetsFromDatabase().catch(console.error).then(pets => {
      pets.forEach(pet => {
        this.petList[pet.speciesId] = pet
      })
    })
  }

  async getPetsFromDatabase () {
    let db = await wow_battlepets.getDB()
    return await db.collection('pet_info').find({}).toArray()
  }

  async getPetInfoFromBlizzard (petId) {
    let pet = await wowapi.petInfo(petId)
    let db = await wow_battlepets.getDB()
    db.collection('pet_info').insertOne(pet)
    return pet
  }

  async petIdName (petId) {
    if (typeof this.petList[petId] !== 'undefined') return this.petList[petId].name
    else {
      console.log('pulling from blizzard api')
      this.petList[petId] = {name: 'loading...', icon: 'loading'}
      let pet = await this.getPetInfoFromBlizzard(petId)
      this.petList[petId] = pet
      return pet.name
    }
  }

  async petIdImage (petId) {
    if (typeof this.petList[petId] !== 'undefined') return `http://media.blizzard.com/wow/icons/56/${this.petList[petId].icon}.jpg`
    else {
      console.log('pulling from blizzard api')
      this.petList[petId] = {name: 'loading...', icon: 'loading'}
      let pet = await this.getPetInfoFromBlizzard(petId)
      this.petList[petId] = pet
      return `http://media.blizzard.com/wow/icons/56/${this.petList[petId].icon}.jpg`
    }
  }
}

module.exports = new PetInfo
