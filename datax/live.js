const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 3305 })
const simulate = require('./livepages/simulate.js')

wss.on('connection', (ws) => {
  ws.json = (obj) => { ws.send(JSON.stringify(obj)) }

  ws.on('message', async (message) => {
    let obj = JSON.parse(message)

    if (obj.m === 'simulate') { // simulate.js
      ws.json({m: 'state', d: 'simulating'})
      await simulate.process(obj, ws.json)
      ws.json({m: 'state', d: 'done'})
    }
  })

  ws.json({m: 'state', d: 'ready'})
})
