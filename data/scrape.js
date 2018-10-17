const wowapi = require('./wow-api.js')
const MongoDB = require('./mongodb.js')
const wow_battlepets = new MongoDB('wow_battlepets')

//console.log(servers)
//
// var serverPointer = 0
// async function saveBattlepetAuctions (callback) {
//   if (serverPointer >= servers.length) return false
//   let server = servers[serverPointer]
//   serverPointer++
//
//   console.log(server)
//   let auctions = await wowapi.auctions('US', server)
//   let battlepetAuctions = auctions.filter(auc => typeof auc.petSpeciesId !== 'undefined')
//   let wrote = await writeFile(`./store/${server}-battlepets.json`, JSON.stringify(battlepetAuctions))
//
//   setTimeout(()=>{
//     saveBattlepetAuctions().catch(console.error).then(() => {})
//   }, 100)
//   return true
// }
//
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
// saveBattlepetAuctions().catch(console.error).then(() => {})
//
// function writeFile (file, data) {
//   return new Promise((resolve, reject) => {
//     fs.writeFile(file, data, err => {
//       if (err) reject(err)
//       else resolve(true)
//     })
//   })
// }

//https://theunderminejournal.com/api/category.php?house=19&id=battlepets
//https://theunderminejournal.com/api/battlepet.php?house=19&species=2469
//timestamps.lastcheck.json.files[""0""].url
//http://auction-api-us.worldofwarcraft.com/auction-data/8b57fdaad0375ea9aa881a04db230988/auctions.json


//curl -u 9e5200f0145b48eabc5e9d6863bcd201:4khSCLyEvWJkmUT8bh2T0l3d58cPeX2o -d grant_type=client_credentials https://us.battle.net/oauth/token
//USacqQQ2i7UVGyzIXKIp4lYIfWDrqDDLFq"
//http://us.api.blizzard.com/wow/auction/data/aggramar?access_token=USacqQQ2i7UVGyzIXKIp4lYIfWDrqDDLFq







class Scrape {
  constructor () {
    this.auctionHousePointer = 0
    this.concurrentDownloads = 10
    this.auctionHouses = []
  }

  async start () {
    await this.setup()
    console.log('============================================================================= ', new Date(Date.now()).toString())
    this.run()
    setInterval(() => {
      console.log('============================================================================= ', new Date(Date.now()).toString())
      this.run()
    }, 1800*1000) // run every 30 minutes
  }

  async setup () {
    let db = await wow_battlepets.getDB()
    let auctions = await db.collection('auctions').createIndex('id', {unique: true, name: 'auction_id'})
    this.auctionHouses = await this.auctionHouseList()
    return true
  }

  async run () {
    this.auctionHousePointer = 0
    for (var i = 0; i < this.concurrentDownloads; i++) {
      this.saveAuctionHouse().catch(console.error)
    }
  }

  async saveAuctionHouse () {
    if (this.auctionHousePointer >= this.auctionHouses.length) return false
    let auctionHouse = this.auctionHouses[this.auctionHousePointer]
    this.auctionHousePointer++

    // pull data from wow api
    console.log(auctionHouse.id)
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
    battlepetAuctions.forEach(auction => {
      db.collection('auctions').updateOne({id: auction.id}, {$set: auction}, {upsert: true}).catch(console.error).then(() => {})
    })

    // recursion
    setTimeout(() => {
      this.saveAuctionHouse().catch(console.error)
    }, 100)
    return true
  }

  async auctionHouseList () {
    let db = await wow_battlepets.getDB()
    let auctionHouses = await db.collection('auction_houses').find().toArray()
    return auctionHouses
  }
}

let scrape = new Scrape()
scrape.start().catch(console.error)
