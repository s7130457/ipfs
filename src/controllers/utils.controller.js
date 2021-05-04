import httpStatus from 'http-status'
import sysStatus from '../lib/bxb_status'
import { execSync } from 'child_process'
import fs from 'fs'
import Config from '../lib/bxb_config'
import os from 'os'

const debug = require('debug')('bxb:ctrl:util')
const pkg = require('../package.json')


function sysinfo (req, res, next) {
  const model = Config.get('model')
  const unlicense = os.platform() === 'linux' && tools.licenseValid(model) === false
  if (unlicense) 
    return res.json({ license: false })
  

  let ret = {
    version: sysStatus.ver(),
    serial: sysStatus.serial(),
    license: true,
    authenticated: !!(req.session.authenticated),
    user: {
      username: (req.session.authenticated) ? req.session.username : '',
      userId: (req.session.authenticated) ? req.session.userId : '',
    },
    status: sysStatus.get()
  }

  return res.status(httpStatus.OK).json(ret)
}

function version(req, res, next) {
  const path = fs.existsSync(`/usr/local/var/www`) ? `/usr/local/var/www` : `/var/www/html`
  let html = execSync(`cat ${path}/index.html`).toString()
  const regex = /data-ver="(\d{8} \(\w*\))"/
  html = regex.exec(html)
  if (html) {
    html = html[1]
  }
  
  const version = {
    backend: pkg.gitVersion || null,
    frontend: html
  }
  return res.status(httpStatus.OK).json(version)
}

function getLicense(req, res, next) {
  const hostname = execSync(`hostname`).toString().trim()
  const model = hostname.includes('bxb-') ? hostname.split(`-`)[1] : ''
  const deviceId = hostname.includes('bxb-') ? hostname.split(`-`)[2] : hostname
  const cpuSerial = execSync(`cat /proc/cpuinfo | grep 'Serial' | awk {'print $3'}`).toString().trim()
  const unlicense = os.platform() === 'linux' && tools.licenseValid(model) === false
  
  let ret = {
    license: !unlicense,
    deviceId,
    serial: cpuSerial,
    model
  }
  return res.status(httpStatus.OK).json(ret)
}

function setLicense(req, res, next) {
  const license = req.body.license
  execSync(`echo ${license} > /etc/lic`)
  res.status(httpStatus.OK).json({data: 'ok'})

  execSync(`pm2 restart backend`)
}

export default { sysinfo, version, getLicense, setLicense,  }
