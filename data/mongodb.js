const {MongoClient} = require('mongodb')

class Mongo {
  constructor(dbName) {
    this._url = 'mongodb://localhost:27017'
    this._dbName = dbName
    this._db = false
    this._client = false
  }

  close () {
    if (this._client) this._client.close()
  }

  getDB () {
    return new Promise((resolve, reject) => {
      if (this._db) {
        resolve(this._db)
      } else {
        MongoClient.connect(this._url, { useNewUrlParser: true }).then(client => {
          this._db = client.db(this._dbName)
          this._client = client
          resolve(this._db)
        }).catch(reject)
      }
    })
  }
}

module.exports = Mongo
