import httpStatus from 'http-status'
import fs from 'fs-extra'
import { exec, execSync } from 'child_process'
import DB from '../db'
import sysStatus from '../lib/bxb_status'
import os from 'os'
// import tools from '@bxb/device-tools'
import tools from '../lib/device-tools'
import APIError from '../middlewares/errors/APIError'

const debug = require('debug')('bxb:ctrl:system')

function backupDB(req, res, next) {
  try {
    debug('backupDB')
    const targetFile = DB.backupDB()
    if (fs.existsSync(targetFile) === true) {
      res.contentType('application/octet-stream')
      res.download(targetFile)
    }
    return
  } catch (error) {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: error.message })
  }
}

async function importDB(req, res, next) {
  // error handler
  if (req.file === undefined) {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: '"file" is required' })
  }

  debug('import DB file')
  DB.importDB(req.file.path)
  res.status(httpStatus.OK).json({ data: 'ok' })

  if (os.platform() === 'linux') {
    await sleep(2000)
    execSync(`pm2 restart backend`)
  }
}

async function resetDB(req, res, next) {
  try {
    DB.resetDB()
    res.status(httpStatus.OK).json({ data: 'ok' })

    if (os.platform() === 'linux') {
      await sleep(2000)
      execSync(`pm2 restart backend`)
    }
    return
  } catch (error) {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: error.message })
  }
}

const sleep = function (t) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve()
    }, t)
  })
}

async function update(req, res, next) {
  const opts = {
    file: req.file,
    model: 'mt3'
  }

  let updater = tools.update(opts)
  
  updater.on('percent', percent => {
    sysStatus.set('updating', true)
    sysStatus.set('updatingPercent', percent)
    req.ws.emit('systemStat', sysStatus.get())
    if (percent === 100) {
      updater = undefined
      sysStatus.set('updating', false)
      sysStatus.set('updatingPercent', 0)
      return res.status(httpStatus.OK).json({ data: 'ok' })
    }
  })

  updater.once('fail', data => {
    sysStatus.set('updating', false)
    sysStatus.set('updatingPercent', 0)
    updater = undefined
    return res.status(httpStatus.BAD_REQUEST).json({ message: data.message })
  })
}

function networkGet(req, res, next) {
  try {
    const path = `dhcpcd`
    const result = tools.networkGet(path)
    return res.status(httpStatus.OK).json(result)
  } catch (e) {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: e.message })
  }
}

function networkSet(req, res, next) {
  const network = {
    dhcp: req.body.dhcp,
    address: req.body.address,
    gateway: req.body.gateway,
    netmask: req.body.netmask,
    defaultIp: `192.168.2.217`,
    path: `dhcpcd`
  }
  tools.networkSet(network)
  tools.once('ok', () => {
    return res.status(httpStatus.OK).json({ data: 'ok' })
  })

}

export default {
  backupDB, importDB, resetDB, update, networkGet, networkSet,
}
