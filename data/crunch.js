const fs = require('fs')
const servers = require('./wow-servers.json')

let minProfitPerBuy = 1000000
let maxRiskPerBuy = 100000000

let data = {}
servers.forEach(server => {
  data[server] = JSON.parse(fs.readFileSync(`./store/${server}-battlepets.json`))
})

function lowestPriceForPetOnServer (server, petId) {
  let pets = data[server].filter(pet => pet.petSpeciesId === petId)
  pets.sort((a,b) => {
    if (a.buyout > b.buyout) return 1
    else if (a.buyout < b.buyout) return -1
    else return 0
  })
  if (pets[0]) return pets[0].buyout
  else return 0
}
// console.log(lowestPriceForPetOnServer('aggramar', 90))

function uniquePetsOnServer (server) {
  let petIds = {}
  data[server].forEach(pet => {
    petIds[pet.petSpeciesId] = true
  })
  return Object.keys(petIds)
}
// console.log(uniquePetsOnServer('aggramar'))

function buyPetHereSellThere (here, there, petId) {
  let lowestPriceThere = lowestPriceForPetOnServer(there, petId)
  let buyableHere = data[here].filter(pet => pet.petSpeciesId === petId).filter(pet => pet.buyout < lowestPriceThere * 0.95)
  let numBuyable = 0
  let invested = 0
  let profit = 0
  buyableHere.forEach(pet => {
    // buy
    if (pet.buyout == 0) return false
    if ((lowestPriceThere * 0.95) - pet.buyout < minProfitPerBuy) return false
    if (pet.buyout > maxRiskPerBuy) return false
    numBuyable++
    invested += pet.buyout
    profit += (lowestPriceThere * 0.95) - pet.buyout
  })
  let percentGain = (100 / invested) * profit
  if (percentGain === Infinity) percentGain = 0
  return {numBuyable, invested, profit, percentGain}
}

function buyoutHereSellAllThere (here, there) {
  let stats = {numBuyable: 0, invested: 0, profit: 0}
  uniquePetsOnServer(here).forEach(petId => {
    let buy = buyPetHereSellThere(here, there, parseInt(petId))
    stats.numBuyable += buy.numBuyable
    stats.invested += buy.invested
    stats.profit += buy.profit
    //if (buy.profit > 0) console.log(`${petId} ${buy.numBuyable} ${buy.invested} ${buy.profit}, ${buy.percentGain}`)
  })
  stats.invested = numberWithCommas(stats.invested/10000)
  stats.profit = numberWithCommas(stats.profit/10000)
  return stats
}
console.log('tichrondrius -> illidan', buyoutHereSellAllThere('tichondrius', 'illidan'))
console.log('tichrondruid -> aggramar', buyoutHereSellAllThere('tichondrius', 'aggramar'))
console.log('aggramar -> illidan', buyoutHereSellAllThere('aggramar', 'illidan'))
console.log('aggramar -> tichrondruis', buyoutHereSellAllThere('aggramar', 'tichondrius'))
console.log('illidan -> tichondruis', buyoutHereSellAllThere('illidan', 'tichondrius'))
console.log('illidan -> aggramar', buyoutHereSellAllThere('illidan', 'aggramar'))

function level25Pricing (petId) {
  let numFound = 0
  let priceTotal = 0
  Object.keys(data).forEach(server => {
    data[server].filter(pet => pet.petSpeciesId === petId).filter(pet => pet.petLevel === 25).forEach(pet => {
      numFound++
      priceTotal += pet.buyout
    })
  })
  let mean = priceTotal/numFound
  return {numFound, mean: numberWithCommas(mean/10000)}
}
// console.log(level25Pricing(1907))

function numberWithCommas (x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
