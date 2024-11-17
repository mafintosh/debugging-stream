const DebuggingStream = require('./')
const speedometer = require('speedometer')
const { Duplex } = require('streamx')

const writeSpeed = speedometer()

const observe = new Duplex({
  write (data, cb) {
    console.log(writeSpeed(data.byteLength), data)
    cb(null)
  }
})

const s = new DebuggingStream(observe, { latency: 2000, writeSpeed: 3 })

for (let i = 0; i < 30; i++) {
  s.write(Buffer.from([i]))
}
