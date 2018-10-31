const WoWAPI = require('./wow-api')

WoWAPI.characterPets('US', 'aggramar', 'napri').then(data => {
  console.log(data)
})
