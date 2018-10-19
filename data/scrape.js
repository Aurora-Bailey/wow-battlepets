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
            console.log(chalk.redBright('error:') + ah.id + chalk.cyan(' os:' + this.outstandingQueries))
            db.collection('error_logs').insertOne({auction_house: ah, error: error.code})
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
    let auctions = await wowapi.auctions(auctionHouse.region, auctionHouse.slug)
    let battlepetAuctions = auctions.filter(auc => typeof auc.petSpeciesId !== 'undefined')

    // add extra data
    battlepetAuctions.forEach(auction => {
      auction.region = auctionHouse.region
      auction.auction_house = auctionHouse.slug
      auction.id = auction.auc + '-' + auctionHouse.id
      auction.last_seen = Date.now()
    })

    // save in database
    let db = await wow_battlepets.getDB()
    let queue = battlepetAuctions.length
    battlepetAuctions.forEach(auction => {
      db.collection('auctions').updateOne({id: auction.id}, {$set: auction}, {upsert: true}).catch(console.error).then(() => {
        queue--
        if (queue === 0) {
          this.outstandingQueries--
          let queryTime = Date.now() - startTime
          console.log(chalk.greenBright('done:') + auctionHouse.id + chalk.cyan(' os:' + this.outstandingQueries) + chalk.magenta(' ms:' + queryTime))
        }
      })
    })

    return true
  }
}

let scrape = new Scrape()
scrape.start().catch(console.error)
