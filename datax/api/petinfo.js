const MongoDB = require('./mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')
const wow = require('./wow.js')
const lib = require('./lib.js')
const chalk = require('chalk')

class PetInfo {
  constructor () {
    this.petInfoCache = {}
  }

  async getPetInfo (petId) {
    if (this.petInfoCache[petId]) return this.petInfoCache[petId]
    let pet = this.getPetInfoFromDatabase(petId)
    this.petInfoCache[petId] = pet
    return pet
  }

  async getPetInfoFromBlizzard (petId) {
    let pet = await wow.getPetInfo(petId)
    let db = await kaisBattlepets.getDB()
    await db.collection('petInfo').createIndex('speciesId', {unique: true, name: 'speciesId'})
    await db.collection('petInfo').insertOne(pet)
    return pet
  }
  async getPetInfoFromDatabase (petId) {
    let db = await kaisBattlepets.getDB()
    let pet = await db.collection('petInfo').findOne({speciesId: petId})
    if (pet === null) return await this.getPetInfoFromBlizzard(petId)
    return pet
  }
}

module.exports = new PetInfo()
