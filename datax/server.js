const buy = require('./pages/buy.js')
const multibuy = require('./pages/multibuy.js')
const collection = require('./pages/collection.js')
const health = require('./pages/health.js')
const pet = require('./pages/pet.js')
const petindex = require('./pages/petindex.js')
const player = require('./pages/player.js')
const name = require('./pages/name.js')
const realmindex = require('./pages/realmindex.js')
const sell = require('./pages/sell.js')

const chalk = require('chalk')
const express = require('express')
const app = express()

app.use(function(req, res, next) {
  console.log(chalk.yellowBright('Incoming request: ') + req.url)
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.get('/buy/:ahid', async function (req, res, next) {
  try { res.json(await buy.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.get('/multibuy/:rid/:name/:buyat', async function (req, res, next) {
  try { res.json(await multibuy.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.get('/collection/:rid/:name', async function (req, res, next) {
  try { res.json(await collection.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.get('/health', async function (req, res, next) {
  try { res.json(await health.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/pet/:psid', async function (req, res, next) {
  try { res.json(await pet.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.get('/petindex', async function (req, res, next) {
  try { res.json(await petindex.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/player/:ahid/:name', async function (req, res, next) {
  try { res.json(await player.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.get('/name/:name', async function (req, res, next) {
  try { res.json(await name.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.get('/realmindex', async function (req, res, next) {
  try { res.json(await realmindex.request(req.query)) }
  catch (e) { next(e) }
})

app.get('/sell/:rid/:name/:sellat', async function (req, res, next) {
  try { res.json(await sell.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.listen(3303)
