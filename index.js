const { Duplex } = require('streamx')
const FIFO = require('fast-fifo')

class Queue {
  constructor ({ latency = 0, speed = Infinity, jitter = 0, ondrain } = {}) {
    this.latency = latency
    this.speed = speed
    this.jitter = jitter
    this.pending = new FIFO()
    this.inflight = 0
    this.timeout = null
    this.ondrain = ondrain
  }

  add (data) {
    const latency = Math.round((Math.random() * this.jitter) + this.latency)

    if (data) this.inflight += data.byteLength
    this.pending.push({ arriveBy: Date.now() + latency + Math.ceil(1000 * this.inflight / this.speed), data })

    if (this.timeout === null) this._drain()
  }

  _drain () {
    this.timeout = null

    const now = Date.now()

    while (true) {
      const next = this.pending.peek()
      if (!next || next.arriveBy > now) break

      if (next.data) this.inflight -= next.data.byteLength
      this.ondrain(next.data)
      this.pending.shift()
    }

    const next = this.pending.peek()
    if (!next) return

    this.timeout = setTimeout(this._drain.bind(this), Math.max(next.arriveBy - now, 0))
  }

  destroy () {
    clearTimeout(this.timeout)
    this.timeout = null
  }
}

module.exports = class DebuggingStream extends Duplex {
  constructor (stream, { speed = Infinity, writeSpeed = speed, readSpeed = speed, latency = 0, jitter = 0 } = {}) {
    super()

    this.stream = stream
    this.latency = latency
    this.jitter = jitter
    this.writeSpeed = writeSpeed
    this.readSpeed = readSpeed
    this.udx = true // for hypercore

    this._writes = new Queue({ speed: writeSpeed, latency, jitter, ondrain: this._onwrite.bind(this) })
    this._reads = new Queue({ speed: readSpeed, latency, jitter, ondrain: this._onread.bind(this) })
    this._finalCallback = null

    stream.on('data', (data) => {
      this._reads.add(data)
    })

    stream.on('end', () => {
      this._reads.add(null)
    })

    stream.on('error', (err) => {
      this.destroy(err)
    })
  }

  get rawStream () {
    return this.stream.rawStream || this
  }

  get rtt () {
    return this.latency + Math.round(Math.random() * this.jitter)
  }

  _write (data, cb) {
    this._writes.add(data)
    cb(null)
  }

  _final (cb) {
    this._writes.add(null)
    this._finalCallback = cb
  }

  _continueFinal () {
    const cb = this._finalCallback
    this._finalCallback = null
    if (cb) cb(null)
  }

  _predestroy () {
    this._continueFinal()
    this._writes.destroy()
    this._reads.destroy()
  }

  _onread (data) {
    this.push(data)
  }

  _onwrite (data) {
    if (data === null) this._continueFinal()
    else this.stream.write(data)
  }
}
