/**
 * @file config tool, singleton
 * @author Laby Huang <laby@bxb.tw>
 */

// ref https://yos.io/2015/12/09/node-configuration-pattern/

const fs = require('fs')
const os = require('os')
var nconf = require('nconf')
const path = require('path')

// NOTE: 判斷是否在 pkg 中
const f = (__dirname.indexOf('/snapshot/') !== -1) ? '/root/config.json' : path.join(__dirname, 'config.json')

// NOTE: 用來存常數
const READ_ONLY = {
  storage: ''
}

function Config () {
  // NOTE: 可能遇到設定檔不存在或爛掉，用預設值避免程式無法正常運作
  try {
    JSON.parse(fs.readFileSync(f))
  } catch (e) {
    var configDefault
    try {
      configDefault = require('../config.default.js')
    } catch (e) {
      throw new Error('config.default doesn\'t exist')
    }
    fs.writeFileSync(f, JSON.stringify(configDefault), 'utf8')
  }

  nconf.file(f)
  nconf.save()

  READ_ONLY.storage = (os.platform() === 'darwin') ? './root/storage' : '/root/storage'
}

Config.prototype.get = function (key) {
  if (READ_ONLY[key] !== undefined) {
    return READ_ONLY[key]
  }
  return nconf.get(key)
}

Config.prototype.set = function (key, val) {
  nconf.set(key, val)
  nconf.save()
}

// NOTE: 不同 process 存取同一 config 時要先 reload
Config.prototype.reload = function () {
  nconf = null
  nconf = require('nconf')
  nconf.file(f)
}

module.exports = new Config()
