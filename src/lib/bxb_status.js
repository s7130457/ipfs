const debug = require('debug')('bxb:status')
const APP_KEY = '2f17d93ed69f099db4237f6e108a5762'
const cache = { systemStat: { ts: 0, data: {} } }
const fs = require('fs')
const tools = require('@bxb/device-tools')
const pkg = require('../package.json')

var ver = 'unknow'
var serial = 'unknow'

var status = {
  updating: false,
  updatingPercent: 0
}

function Status () {
  cache.systemStat.ts = Date.now()
  cache.systemStat.data = tools.getSystemStat()
  try {
    ver = fs.readFileSync('/etc/ver', 'utf8').trim()

    if (process.env.NODE_ENV === 'development') {
      ver = `${ver} - ${pkg.gitVersion}`
    }

    serial = fs.readFileSync('/etc/sn', 'utf8').trim()
  } catch (e) {

  }
}

Status.prototype.serial = function () {
  return serial
}

Status.prototype.ver = function () {
  return ver
}

Status.prototype.get = function () {
  const now = Date.now()
  const ret = Object.assign({}, status)

  if (now - cache.systemStat.ts > 5000) {
    cache.systemStat.ts = now
    cache.systemStat.data = tools.getSystemStat()
  }

  ret.cpu = cache.systemStat.data.cpu
  ret.disk = cache.systemStat.data.disk
  ret.mem = cache.systemStat.data.mem
  ret.uptime = cache.systemStat.data.uptime
  try {
    ret.bxbConnected = eewclient.connected()
  } catch (e) {
    ret.bxbConnected = false
  }

  return ret
}

Status.prototype.set = function (key, val) {
  status[key] = val
}

module.exports = new Status()
