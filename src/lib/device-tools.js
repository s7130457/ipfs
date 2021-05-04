import { EventEmitter } from 'events'
import util from 'util'
import gpg from 'gpg'
import os from 'os'
import fs from 'fs'
import { execSync } from 'child_process'
import tools from '@bxb/device-tools'
import config from './bxb_config'

const debug = require('debug')('bxb:lib:device-tools')

const ETH = 'eth0'

function Tool(opt = {}) {
}

function Updater(opt = {}) {
  this.model = opt?.model
  this.file = opt?.file

  const tmpDir = '/tmp/update'
  const file = this.file

  _init.call(this)

  async function _init() {
    try {
      fs.removeSync(tmpDir)
    } catch (e) {

    }

    try {
      fs.mkdirSync(tmpDir)
    } catch (e) {

    }

    if (file === undefined) {
      throw new Error('"file" is required')
    }

    debug('update: extract file')
    _updateDone.call(this, 10)

    try {
      await extractFile(file.path, this.model)
    } catch (e) {
      debug(`update: error: ${e.message}`)
      _updateFail.call(this, 'WRONG_FROMAT')
      return
    }

    _updateDone.call(this, 20)

    try {
      processUpdateFile.call(this, _updateDone)
    } catch (e) {
      debug(e);

      _updateFail.call(this, 'UPDATE_ERROR')
      return
    }

    debug('update: remove tmp')

    try {
      fs.copyFileSync('/tmp/update/ver', '/etc/ver')
      fs.removeSync('/tmp/update')
      _updateDone.call(this, 100)
    } catch (e) {
      _updateFail.call(this, e.message)
      return
    }

    if (os.platform() === 'linux') {
      await sleep(2000)
      try {
        execSync('pm2 restart service')
      } catch (e) {

      }
      try {
        execSync('pm2 restart desktop')
      } catch (e) {

      }
      await sleep(2000)
      execSync('pm2 restart backend')
    }

    function _updateDone(percent) {
      debug(`_updateDone: ${percent}`)
      this.emit('percent', percent)
    }

    function _updateFail(reason) {
      this.emit('fail', { message: reason })
    }
  }

  function extractFile(f, model) {
    const fileDec = '/tmp/update/update.dec'

    return new Promise((resolve, reject) => {
      debug('update: decode')

      gpg.callStreaming(f, fileDec, ['--passphrase', 'bxb9703838'], () => {
        try {
          fs.unlinkSync(f)
        } catch (e) {

        }

        const stats = fs.statSync(fileDec)

        if (stats.size === 0) {
          reject(new Error('decode error'))
          return
        }
        debug('update: unpack')
        try {
          execSync(`tar xf ${fileDec} -C /tmp/update`)
        } catch (e) {
          reject(new Error('unpack error'))
          return
        }

        try {
          const fileModel = fs.readFileSync('/tmp/update/model', 'utf-8').trim()
          debug(`update: check model ${fileModel}`)
          if (fileModel !== model) {
            reject(new Error('wrong model'))
            return
          }
        } catch (e) {
          reject(new Error())
          return
        }

        try {
          debug('update: check ver')
          fs.readFileSync('/tmp/update/ver', 'utf-8')
        } catch (e) {
          reject(new Error('no ver file'))
          return
        }

        resolve()
      })
    })
  }

  function processUpdateFile(_updateDone) {
    const targetBin = '/usr/local/bin'
    const targetFrontend = os.platform() === 'linux' ? '/var/www/html' : '/usr/local/var/www/html'

    if (fs.existsSync('/tmp/update/pre_update.sh')) {
      debug('update: exec pre script')
      _updateDone.call(this, 40)
      execSync('/tmp/update/pre_update.sh')
    }

    if (fs.existsSync('/tmp/update/backend')) {
      debug('update: extract backend')
      _updateDone.call(this, 50)
      execSync(`mv /tmp/update/backend ${targetBin}`)
    }

    if (fs.existsSync('/tmp/update/frontend.bin')) {
      debug('update: extract frontend')
      _updateDone.call(this, 60)
      execSync(`rm -rf ${targetFrontend}/static`)
      execSync(`tar -xf /tmp/update/frontend.bin -C ${targetFrontend}`)
    }

    if (fs.existsSync('/tmp/update/service')) {
      debug('update: extract service')
      _updateDone.call(this, 70)
      execSync(`mv /tmp/update/service ${targetBin}`)
    }

    if (fs.existsSync('/tmp/update/desktop.asar')) {
      debug('update: extract desktop')
      _updateDone.call(this, 80)
      execSync(`mv /tmp/update/desktop.asar ${targetBin}`)
    }

    if (fs.existsSync('/tmp/update/post_update.sh')) {
      debug('update: exec post script')
      _updateDone.call(this, 90)
      execSync('/tmp/update/post_update.sh')
    }
  }
}

Tool.prototype.update = function (opts) {
  return new Updater(opts)
}

Tool.prototype.networkGet = function (path) {
  let Network
  if (path === 'dhcpcd') {
    Network = new Dhcpcd()
  }

  if (path === 'legacy') {
    Network = new Legacy()
  }

  const result = Network.get()
  return result
}

Tool.prototype.networkSet = function (network) {
  let Network
  if (network.path === 'dhcpcd') {
    Network = new Dhcpcd(network)
  }

  if (network.path === 'legacy') {
    Network = new Legacy(network)
  }

  Network.set()
}

function Dhcpcd(opts = {}) {
  this.PATH_INF = '/etc/dhcpcd.conf'
  this.address = opts?.address
  this.gateway = opts?.gateway
  this.netmask = opts?.netmask
  this.defaultIp = opts?.defaultIp
  this.address = opts?.address
}

Dhcpcd.prototype.set = function () {
  const netmask2cidr = (netmask) => (netmask.split('.').map(Number).map(part => (part >>> 0).toString(2)).join('')).split('1').length - 1
  const defaultHead = [
    'hostname',
    'clientid',
    'persistent',
    'option rapid_commit',
    'option classless_static_routes',
    'nohook lookup-hostname',
    'noarp',
    'noup',
    'ipv4only',
    'timeout 30'
  ]

  const defaultTail = [
    ''
  ]

  let routers = this.defaultIp.split('.')
  routers.splice(-1, 1, 254)
  routers = routers.join('.')

  const dhcpOpt = [
    'profile static_eth0',
    'nolink',
    `static ip_address=${this.defaultIp}/24`,
    `static routers=${routers}`,
    '',
    'interface eth0',
    'fallback static_eth0',
    ''
  ]

  let output = []
  let dhcp = network.dhcp
  let confNew = ''
  let confCurrent = fs.readFileSync(this.PATH_INF, 'utf-8')

  if (dhcp === true) {
    output = [...defaultHead, ...dhcpOpt, ...defaultTail]
  } else {
    output = [
      'denyinterfaces tunl0 gre0 sit0 ip6tnl0',
      'nolink',
      '',
      'interface eth0',
      `static ip_address=${network.address}/${netmask2cidr(network.netmask)}`,
      `static routers=${network.gateway}`,
      'static domain_name_servers=8.8.8.8',
      '',
      ...defaultTail
    ]
  }

  confNew = output.join('\n')

  if (confNew !== confCurrent) {
    fs.writeFileSync(this.PATH_INF, confNew)

    this.emit('ok')
    setTimeout(() => {
      try {
        execSync('ip addr flush eth0 && sleep 2 && systemctl restart dhcpcd && sleep 2 && avahi-autoipd -k eth0:0 && sleep 1 && avahi-autoipd -D --force-bind eth0:0')
      } catch (e) {
        debug(`ifconfig: ${e}`)
      }
    }, 1000)

    setTimeout(() => {
      // NOTE: 重開比較快，不然底層 scan 用的 udp 還要 rebind
      exec('pm2 restart backend')
    }, 3000)
  }
}

Dhcpcd.prototype.get = function () {
  let ret = {
    dhcp: false,
    address: '192.168.0.1',
    netmask: '255.255.255.0',
    gateway: '192.168.0.254',
    dns: '8.8.8.8',
    mac: '1234567890ab'
  }

  try {
    let infData = fs.readFileSync(this.PATH_INF, 'utf-8')
    ret.mac = tools.getHostMac()
    if (infData.includes('fallback') === false) {
      ret.dhcp = false
      ret.address = infData.match(/ip_address=([\w\d.]+)/)[1]
      ret.gateway = infData.match(/routers=([\w\d.]+)/)[1]
      ret.netmask = cidr2netmask(infData.match(/ip_address=[\w\d.]+\/([\d]+)/)[1])
    } else {
      _retDhcp()
    }
    return ret
  } catch (e) {
    throw new Error(e.message)
  }

  function _retDhcp() {
    let infs = os.networkInterfaces()
    for (let inf of infs[ETH]) {
      if (inf.family === 'IPv4') {
        ret.address = inf.address
        ret.netmask = inf.netmask
        ret.gateway = execSync("ip r | grep eth0 | grep default | cut -d ' ' -f 3 | head -n1").toString().replace(/\n/, '')
      }
    }
    ret.dhcp = true
  }
}

function Legacy(opts = {}) {
  this.PATH_INF = '/etc/network/interfaces'
  this.address = opts?.address
  this.gateway = opts?.gateway
  this.netmask = opts?.netmask
  this.defaultIp = opts?.defaultIp
  this.address = opts?.address
}

Legacy.prototype.get = function () {
  let ret = {
    dhcp: false,
    address: '192.168.0.1',
    netmask: '255.255.255.0',
    gateway: '192.168.0.254',
    mac: tools.getHostMac()
  }

  if (os.platform() === 'darwin') {
    return ret
  }

  const infData = fs.readFileSync(this.PATH_INF, 'utf-8')

  ret.show = config.get('network:show')

  if (ret.show === undefined) {
    config.set('network:show', false)
    ret.show = false
  }

  if (infData.includes('static') === true) {
    ret.dhcp = false
    ret.address = infData.match(/address\s([\w\d\.]+)/)[1]
    ret.netmask = infData.match(/netmask\s([\w\d\.]+)/)[1]
    ret.gateway = infData.match(/gateway\s([\w\d\.]+)/)[1]
  } else {
    let infs = os.networkInterfaces()
    for (let inf of infs['eth0']) {
      if (inf.family === 'IPv4') {
        ret.address = inf.address
        ret.netmask = inf.netmask
        ret.gateway = execSync("ip r | grep eth0 | grep default | cut -d ' ' -f 3 | head -n1").toString().replace(/\n/, '')
      }
    }
    ret.dhcp = true
  }
  return ret
}

Legacy.prototype.set = function () {
  let output = ['auto lo', 'iface lo inet loopback', 'auto eth0']
  let dhcp = this.dhcp
  let confNew = ''
  let confCurrent = fs.readFileSync(this.PATH_INF, 'utf-8')

  if (dhcp === true) {
    output.push(`iface eth0 inet dhcp`)
  } else {
    output.push(`iface eth0 inet static`)
    output.push(`address ${this.address}`)
    output.push(`netmask ${this.netmask}`)
    output.push(`gateway ${this.gateway}`)
    output.push(`dns-nameservers 8.8.8.8`)
  }

  confNew = output.join('\n')

  if (confNew !== confCurrent) {
    fs.writeFileSync(this.PATH_INF, confNew)
    exec('sudo ip addr flush eth0 && sudo systemctl restart networking')
  }

  this.emit('ok')

  // if (req.body.show !== undefined) {
  //   config.set('network:show', req.body.show)
  //   desktop.send({cmd: 'ip', show: req.body.show, text: tools.getHostIp()})
  // }

}

util.inherits(Updater, EventEmitter)

module.exports = new Tool()
