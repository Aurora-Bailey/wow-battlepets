const wowapi = require('./wow-api.js')
const servers = require('./wow-servers.json')
const fs = require('fs')

//console.log(servers)

var serverPointer = 0
async function saveBattlepetAuctions (callback) {
  if (serverPointer >= servers.length) return false
  let server = servers[serverPointer]
  serverPointer++

  console.log(server)
  let auctions = await wowapi.auctions(server)
  let battlepetAuctions = auctions.filter(auc => typeof auc.petSpeciesId !== 'undefined')
  let wrote = await writeFile(`./store/${server}-battlepets.json`, JSON.stringify(battlepetAuctions))

  setTimeout(()=>{
    saveBattlepetAuctions().catch(console.error).then(() => {})
  }, 100)
  return true
}

saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})
saveBattlepetAuctions().catch(console.error).then(() => {})

function writeFile (file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, err => {
      if (err) reject(err)
      else resolve(true)
    })
  })
}

//https://theunderminejournal.com/api/category.php?house=19&id=battlepets
//https://theunderminejournal.com/api/battlepet.php?house=19&species=2469
//timestamps.lastcheck.json.files[""0""].url
//http://auction-api-us.worldofwarcraft.com/auction-data/8b57fdaad0375ea9aa881a04db230988/auctions.json


//curl -u 9e5200f0145b48eabc5e9d6863bcd201:4khSCLyEvWJkmUT8bh2T0l3d58cPeX2o -d grant_type=client_credentials https://us.battle.net/oauth/token
//USacqQQ2i7UVGyzIXKIp4lYIfWDrqDDLFq"
//http://us.api.blizzard.com/wow/auction/data/aggramar?access_token=USacqQQ2i7UVGyzIXKIp4lYIfWDrqDDLFq
