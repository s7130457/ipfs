import httpStatus from 'http-status'
import APIError from '../errors/APIError'
import Model from '../../models/user.model'

const debug = require('debug')('bxb:acl:user')

function load (req, res, next) {
  const obj = req.obj
  
  if (obj.id !== req.session.userId && req.session.role !== 'admin') {
    throw new APIError({ status: httpStatus.FORBIDDEN, message: `Permission denied`})
  }
  next()
}

function checkAdmin (req, res, next) {
  if (req.session.role !== 'admin') {
    throw new APIError({ status: httpStatus.FORBIDDEN, message: `Permission denied`})
  }
  next()
}

export default { checkAdmin, load, }
