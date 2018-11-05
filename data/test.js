const WoWAPI = require('./lib/wow-api')
const DriftlessInterval = require('./lib/driftlessinterval')
const chalk = require('chalk')

var oldAuction = []
var oldAuctionLookup = {}


new DriftlessInterval(() => {
  WoWAPI.auctions('US', 'thrall').then(liveAuction => {
    let liveAuctionLookup = {}
    liveAuction.forEach(la => {
      liveAuctionLookup[la.auc] = la
    })
    var foundItems = 0
    var foundPets = 0
    var lostItems = 0
    var lostPets = 0

    liveAuction.forEach(la => {
      if (typeof oldAuctionLookup[la.auc] === 'undefined') {
        foundItems++
        if (typeof la.petSpeciesId !== 'undefined') foundPets++
      }
    })
    oldAuction.forEach(oa => {
      if (typeof liveAuctionLookup[oa.auc] === 'undefined') {
        lostItems++
        if (typeof oa.petSpeciesId !== 'undefined') lostPets++
      }
    })

    let now = new Date().toString()

    console.log(`${now} --- Found Items: ${chalk.yellowBright(foundItems)} Found Pets: ${chalk.greenBright(foundPets)} Lost Items: ${chalk.yellowBright(lostItems)} Lost Pets: ${chalk.greenBright(lostPets)}`)

    oldAuction = liveAuction
    oldAuctionLookup = liveAuctionLookup
  })
}, 1000*60*10)
