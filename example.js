const Debugging = require('./')

const l = new Debugging(process.stdin, { latency: { read: [1500, 2500], connect: 5000 } })

l.on('data', function (data) {
  console.log('-->', data)
})
