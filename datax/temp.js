const MongoDB = require('./api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Test {
  constructor () {

  }

  async start () {
    let db = await kaisBattlepets.getDB()
    let documents = await db.collection('auctionsLive').find({}, {projection: {_id: 1}}).toArray()
    for (var i = 0; i < documents.length; i++) {
      let singleDocument = documents[i]
      let timestamp = this._timeFromObjectId(singleDocument._id.toString())
      await db.collection('auctionsLive').updateOne({_id: singleDocument._id}, {$set: {firstSeen: timestamp, rebuiltFirstSeen: true}})
      console.log(`${i}/${documents.length}`)
    }

    return 'done'
  }

  _timeFromObjectId (objectId) {
    let d = new Date(parseInt(objectId.substring(0, 8), 16) * 1000)
  	return d.getTime()
  }
}

let t = new Test()
t.start().then(console.log).catch(console.error)
