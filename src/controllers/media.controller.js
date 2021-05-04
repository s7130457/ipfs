import config from '../lib/bxb_config'
import fs from 'fs'
import httpStatus from 'http-status'
import ipfsService from '../lib/ipfsClient'

const debug = require('debug')('bxb:mediaCtrl')
const STORAGE = config.get('storage')

async function add(req, res, next) {
  try {
    const info = await ipfsService.add(req.file)
    fs.unlinkSync(req.file.path)
    return res.status(httpStatus.OK).json(info)
  } catch (e) {
    debug(e)
    console.log(e);
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'Disk I/O error' })
  }

}

// TODO: check any action ref to it
function del(req, res, next) {
  const obj = req.obj

  try {
    ipfsService.del(obj)
    return res.status(httpStatus.OK).json({ data: 'ok' })
  } catch (e) {
    next(e)
  }
}

function load(req, res, next, id) {
  try {
    const obj = ipfsService.get(id)
    if (!obj) {
      return res.status(httpStatus.NOT_FOUND).json({ message: 'media id not exist' })
    }
    req.obj = obj
    next()
    return null
  } catch (e) {
    next(e)
  }
}

function list(req, res, next) {
  try {
    const media = ipfsService.list()
    return res.status(httpStatus.OK).json(media)
  } catch (e) {
    next(e)
  }

}


export default { add, del, load, list, }
