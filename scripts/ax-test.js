const EventEmitter = require('events').EventEmitter
const util = require('util')
const net = require('net')
const fs = require('fs')

const fileStream = fs.createWriteStream('ax.wav')

const recordingCmd = {
  start: { cmd: 'send', index: 0, device: 'hw:2,0', uri: '239.255.123.123:5004', record: 'pcm', channels: 1, samplerate: 48000, format: 'pcm16le', buffersize: 3840, running: true },
  stop: { cmd: 'send', index: 0, running: false },
  status: { cmd: 'status' }
}
const Ax = function () {
  this.path = '/tmp/axdev'
  this.cmdStatus = 'idle'
  this.connected = false
  this.sck = new net.Socket()
  this.recon = null
  _connect.call(this)

  this.sck.on('connect', () => {
    this.connected = true
    console.log('connect ax')
  })

  this.sck.on('data', data => {
    // data = data.toString()
    // throw '我故意丟的'
    console.log('data')
    console.log(data)

    this.sck.pipe(fileStream)
  })

  this.sck.on('close', () => {
    this.connected = false
    console.log('ax socket close')
  })

  this.sck.on('error', e => {
    console.log(e)
  })
}

const _connect = function () {
  this.sck.connect(this.path)
}

util.inherits(Ax, EventEmitter)
module.exports = new Ax()
