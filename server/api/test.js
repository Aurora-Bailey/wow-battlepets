const lib = require('./lib.js')

class Test {
  constructor () {
    this.stoptime = Date.now()
  }

  stopwatch (text) {
    console.log(text, Date.now() - this.stoptime, 'MS')
    this.stoptime = Date.now()
  }

  async run () {

  }

}

let test = new Test()
test.run().catch(console.error).then(console.log)
