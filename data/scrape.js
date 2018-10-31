const wowapi = require('./wow-api.js')
const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')
const DriftlessInterval = require('./driftlessinterval')
const chalk = require('chalk')

class Scrape {
  constructor () {
    this.scrapeTimespan = 20 // minutes, stagger the request across time
    this.timeBeweenScrapes = 30 // minutes, frequency of data pulls

    this.scrapeTimespanMS = this.scrapeTimespan * 60000 // in miliseconds
    this.timeBeweenScrapesMS = this.timeBeweenScrapes * 60000 // in miliseconds

    this.outstandingQueries = 0
  }

  async start () {
    let db = await wow_battlepets.getDB()
    let auctionHouses = await db.collection('auction_houses').find().toArray()
    let scrapeStagger = this.scrapeTimespanMS / auctionHouses.length
    auctionHouses.forEach((ah, i) => {
      setTimeout(() => {
        new DriftlessInterval(() => {
          this.saveAuctions(ah).catch(error => {
            this.outstandingQueries--
            // console.log(chalk.redBright('error:') + ah.id + chalk.cyan(' os:' + this.outstandingQueries))
            db.collection('error_logs').insertOne({auction_house: ah, error: error.response, time: Date.now()})
            console.log(error)
          })
        }, this.timeBeweenScrapesMS)
      }, i * scrapeStagger)
    })
  }


  async saveAuctions (auctionHouse) {
    // pull data from wow api
    let startTime = Date.now()
    this.outstandingQueries++
    console.log(chalk.yellowBright('pull:') + auctionHouse.id + chalk.cyan(' os:' + this.outstandingQueries))

    // ** pull data from wow
    try {
      var auctions = await wowapi.auctions(auctionHouse.region, auctionHouse.slug)
    } catch (e) {
      // reset ah if error is found, we dont want corrupt data
      db.collection('auctions_live').deleteOne({auction_house: auctionHouse.id})
      throw e
    }
    // ** data pulled from wow
    let battlepetAuctions = auctions.filter(auc => typeof auc.petSpeciesId !== 'undefined')

    // add extra data
    battlepetAuctions.forEach(auction => {
      auction.region = auctionHouse.region
      auction.auction_house = auctionHouse.slug
      auction.id = auction.auc + '-' + auctionHouse.id
      auction.last_seen = Date.now()
    })

    // load old data
    let db = await wow_battlepets.getDB()
    let oldAuctions = await db.collection('auctions_live').find({auction_house: auctionHouse.id}).toArray()

    // old auctions found
    if (oldAuctions.length > 0 && oldAuctions[0].auctions.length > 0 && oldAuctions[0].auctions[0].last_seen > Date.now() - (1000*60*60)) { // seen in the last hour

      // Build lookup table
      let newLookupID = {}
      let newLookupSpecies = {}
      let oldLookupID = {}
      let oldLookupSpecies = {}
      battlepetAuctions.forEach(pet => {
        newLookupID[pet.id] = pet
        if (typeof newLookupSpecies[pet.petSpeciesId] === 'undefined') newLookupSpecies[pet.petSpeciesId] = []
        newLookupSpecies[pet.petSpeciesId].push(pet)
      })
      oldAuctions[0].auctions.forEach(pet => {
        oldLookupID[pet.id] = pet
        if (typeof oldLookupSpecies[pet.petSpeciesId] === 'undefined') oldLookupSpecies[pet.petSpeciesId] = []
        oldLookupSpecies[pet.petSpeciesId].push(pet)
      })

      // Lable new missing expired and sold
      battlepetAuctions.forEach(pet => {
        if (typeof oldLookupID[pet.id] === 'undefined') pet.new = true
      })
      oldAuctions[0].auctions.forEach(pet => {
        if (typeof newLookupID[pet.id] === 'undefined') pet.missing = true
        if (pet.missing === true) {
          if (pet.timeLeft === 'SHORT' || pet.timeLeft === 'MEDIUM') {
            pet.expired = true
          } else {
            if (typeof newLookupSpecies[pet.petSpeciesId] !== 'undefined') {
              newLookupSpecies[pet.petSpeciesId].forEach(petLookup => {
                if (petLookup.new === true && petLookup.owner === pet.owner) pet.canceled = true
              })
            }
            if (pet.canceled !== true) pet.sold = true
          }
        }
      })

      // save to database
      oldAuctions[0].auctions.forEach(pet => {
        if (pet.expired === true) db.collection('auctions_expired').insertOne(pet)
        if (pet.canceled === true) db.collection('auctions_canceled').insertOne(pet)
        if (pet.sold === true) db.collection('auctions_sold').insertOne(pet)
      })

    } else {
      console.log(chalk.yellowRed('skip:') + 'skipping bad data.')
    }

    // over write old data with new
    db.collection('auctions_live').updateOne({auction_house: auctionHouse.id}, {$set: {auctions: battlepetAuctions}}, {upsert: true}).then(() => {
      this.outstandingQueries--
      let queryTime = Date.now() - startTime
      console.log(chalk.greenBright('done:') + auctionHouse.id + chalk.cyan(' os:' + this.outstandingQueries) + chalk.magenta(' ms:' + queryTime))
    }).catch(() => {
      this.outstandingQueries--
      let queryTime = Date.now() - startTime
      console.log(chalk.greenBright('done:') + auctionHouse.id + chalk.cyan(' os:' + this.outstandingQueries) + chalk.magenta(' ms:' + queryTime) + ' -error')
    })
  }
}

let scrape = new Scrape()
scrape.start().catch(console.error)
