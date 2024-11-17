# debugging-stream

Stream that helps you debug streams

```
npm install debugging-stream
```

## Usage

``` js
const DebuggingStream = require('debugging-stream')

const s = new DebuggingStream(anotherStream, {
  latency: 100, // add between 100ms read/write latency,
  jitter: 10, // add 0-10 ms of jitter to the latency
  speed: 100, // send 100 bytes per sec
  writeSpeed, // same as speed but only affects writes
  readSpeed // same as speed but only affects reads
})
```

## License

MIT
