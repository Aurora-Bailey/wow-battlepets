const MongoDB = require('./api/mongodb.js')
const kaisBattlepets = new MongoDB('kaisBattlepets')

class Test {
  constructor () {

  }

  async start () {
    for (var i = 0; i < 1000; i++) {
      let limit = 10000
      let done = await this.process(limit)
      console.log(done, i)
      await this._wait(5000)
    }

    return 'done'
  }

  async process (limit) {
    let db = await kaisBattlepets.getDB()
    let documents = await db.collection('auctionsArchive').find({firstSeen: {$exists: false}}, {projection: {_id: 1, limit}}).toArray()
    console.log("data loaded.")
    for (var i = 0; i < documents.length; i++) {
      let singleDocument = documents[i]
      let timestamp = this._timeFromObjectId(singleDocument._id.toString())
      await db.collection('auctionsArchive').updateOne({_id: singleDocument._id}, {$set: {firstSeen: timestamp, rebuiltFirstSeen: true}})
      if (i%1000 === 0) console.log(`${i}/${documents.length}`)
      await this._wait(2)
    }

    return 'done'
  }

  _timeFromObjectId (objectId) {
    let d = new Date(parseInt(objectId.substring(0, 8), 16) * 1000)
  	return d.getTime()
  }
  async _wait (ms) {
    setTimeout(() => {
      return true
    }, ms)
  }
}

let t = new Test()
t.start().then(console.log).catch(console.error)
