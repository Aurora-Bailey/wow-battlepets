class DriftlessInterval {
  constructor (callback, timeout) {
    this.start = Date.now()
    this.timeout = timeout
    this.callback = callback
    this.ticks = Date.now() / this.timeout

    this.run()
  }

  run () {
    this.ticks += 1
    setTimeout(() => {
      this.run()
    }, Math.floor((this.ticks * this.timeout) - Date.now()))
    this.callback()
  }
}

module.exports = DriftlessInterval
