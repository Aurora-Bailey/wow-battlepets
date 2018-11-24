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

app.get('/buy', async function (req, res, next) {
  try { res.json(await buy.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/collection', async function (req, res, next) {
  try { res.json(await collection.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/health', async function (req, res, next) {
  try { res.json(await health.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/pet', async function (req, res, next) {
  try { res.json(await pet.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/petindex', async function (req, res, next) {
  try { res.json(await petindex.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/player/:realm/:name', async function (req, res, next) {
  try { res.json(await player.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.get('/realmindex', async function (req, res, next) {
  try { res.json(await realmindex.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/sell', async function (req, res, next) {
  try { res.json(await sell.request(req.query)) }
  catch (e) { next(e) }
})

app.listen(3303)
