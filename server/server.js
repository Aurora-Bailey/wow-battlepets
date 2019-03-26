const chalk = require('chalk')
const express = require('express')
const app = express()

app.use(function(req, res, next) {
  console.log(chalk.yellowBright('Incoming request: ') + req.url)
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

const buy = require('./pages/buy.js')
app.get('/buy/:ahid', async function (req, res, next) {
  try { res.json(await buy.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const multibuy = require('./pages/multibuy.js')
app.get('/multibuy/:rid/:name/:buyat', async function (req, res, next) {
  try { res.json(await multibuy.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const collection = require('./pages/collection.js')
app.get('/collection/:rid/:name', async function (req, res, next) {
  try { res.json(await collection.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const health = require('./pages/health.js')
app.get('/health', async function (req, res, next) {
  try { res.json(await health.request(req.query)) }
  catch (e) { next(e) }
})

const pet = require('./pages/pet.js')
app.get('/pet/:psid', async function (req, res, next) {
  try { res.json(await pet.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const petindex = require('./pages/petindex.js')
app.get('/petindex', async function (req, res, next) {
  try { res.json(await petindex.request(req.query)) }
  catch (e) { next(e) }
})

const player = require('./pages/player.js')
app.get('/player/:ahid/:name', async function (req, res, next) {
  try { res.json(await player.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const name = require('./pages/name.js')
app.get('/name/:name', async function (req, res, next) {
  try { res.json(await name.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const realmindex = require('./pages/realmindex.js')
app.get('/realmindex', async function (req, res, next) {
  try { res.json(await realmindex.request(req.query)) }
  catch (e) { next(e) }
})

const sell = require('./pages/sell.js')
app.get('/sell/:rid/:name/:sellat', async function (req, res, next) {
  try { res.json(await sell.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const selltime = require('./pages/selltime.js')
app.get('/selltime', async function (req, res, next) {
  try { res.json(await selltime.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

const sellerliverank = require('./pages/sellerliverank.js')
app.get('/sellerliverank', async function (req, res, next) {
  try { res.json(await sellerliverank.request(Object.assign(req.params, req.query))) }
  catch (e) { next(e) }
})

app.listen(3303)
