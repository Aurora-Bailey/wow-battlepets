const buy = require('./pages/buy.js')
const collection = require('./pages/collection.js')
const health = require('./pages/health.js')
const pet = require('./pages/pet.js')
const petindex = require('./pages/petindex.js')
const player = require('./pages/player.js')
const realmindex = require('./pages/realmindex.js')
const sell = require('./pages/sell.js')

const express = require('express')
const app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.get('/buy', async function (req, res) {
  res.send(JSON.stringify(await buy.request(req.query)))
})

app.get('/collection', async function (req, res) {
  res.send(JSON.stringify(await collection.request(req.query)))
})

app.get('/health', async function (req, res) {
  res.send(JSON.stringify(await health.request(req.query)))
})

app.get('/pet', async function (req, res) {
  res.send(JSON.stringify(await pet.request(req.query)))
})

app.get('/petindex', async function (req, res) {
  res.send(JSON.stringify(await petindex.request(req.query)))
})

app.get('/player', async function (req, res) {
  res.send(JSON.stringify(await player.request(req.query)))
})

app.get('/realmindex', async function (req, res) {
  res.send(JSON.stringify(await realmindex.request(req.query)))
})

app.get('/sell', async function (req, res) {
  res.send(JSON.stringify(await sell.request(req.query)))
})

app.listen(3303)
