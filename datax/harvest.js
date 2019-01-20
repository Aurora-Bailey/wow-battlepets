const realm = require('./api/realm.js')
const auction = require('./api/auction.js')
const average = require('./api/average.js')
const chalk = require('chalk')
const express = require('express')
const app = express()

class Harvest {
  constructor () {
    this.start().catch(console.error).then(console.log)
  }

  async start () {
    await realm.buildRealmDatabase()
    await auction.setupLoop()
    await average.setupLoop()
    return `Running!`
  }

  pause () {
    auction.setPauseTrue()
    average.setPauseTrue()
    return true
  }
  play () {
    auction.setPauseFalse()
    average.setPauseFalse()
    return true
  }
}
const harvest = new Harvest()

app.use(function(req, res, next) {
  console.log(chalk.yellowBright('Incoming request: ') + req.url)
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.get('/pause', async function (req, res, next) {
  try { res.json({status: harvest.pause()}) }
  catch (e) { next(e) }
})
app.get('/play', async function (req, res, next) {
  try { res.json({status: harvest.play()}) }
  catch (e) { next(e) }
})
app.get('/timing', async function (req, res, next) {
  try { res.json({data: auction.getTrackUpdateTime()}) }
  catch (e) { next(e) }
})
app.get('/pending', async function (req, res, next) {
  try { res.json({data: auction.getPending()}) }
  catch (e) { next(e) }
})

app.get('*', async function (req, res, next) {
  res.status(404).send("page not found")
})


app.listen(3304)
