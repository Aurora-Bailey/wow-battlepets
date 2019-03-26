class LockedInterval {
  constructor (callback, interval, stagger) {
    this.interval = interval
    this.callback = callback
    this.stagger = stagger
    this.ticks = Math.floor(Date.now() / this.interval)

    setTimeout(() => { this.run() }, this.msUntill(this.nextCallTime()))
  }

  run () {
    this.ticks++
    setTimeout(() => { this.run() }, this.msUntill(this.nextCallTime()))
    this.callback()
  }

  msUntill (time) {
    return time - Date.now()
  }

  nextCallTime () {
    let time = (this.ticks * this.interval) + this.stagger
    if (time < Date.now()) {
      this.ticks++
      return this.nextCallTime()
    } else {
      return time
    }
  }
}

module.exports = LockedInterval
