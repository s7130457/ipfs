import httpStatus from 'http-status'
import APIError from '../middlewares/errors/APIError'
import Model from '../models/user.model'
import AclDB from '../middlewares/acl/acl.model'
import AclService from '../middlewares/acl/bxb_acl'

function add (req, res, next) {
  const user  = Model.get(req.body.username, 'username')
  if (user) {
    throw new APIError({status: httpStatus.BAD_REQUEST, message: 'username already exist'})
  }
  try {
    const obj = Model.add(req.body)
    const user = Model.get(obj.lastInsertRowid)
    AclService.add(user)
    return res.status(httpStatus.OK).json(obj)
  } catch (e) {
    next(e)
  }
}

function del (req, res, next) {
  const obj = req.obj
  try {
    if (obj.username === 'admin' && obj.id === 1) {
      throw new APIError({status: httpStatus.BAD_REQUEST, message: 'can not delete admin'})
    }
    Model.del(obj)
    AclService.del(obj.id)
    return res.status(httpStatus.OK).json({data: 'ok'})
  } catch (e) {
    next(e)
  }
}

function get (req, res, next) {
  const obj = req.obj
  const user = {
    id: obj.id,
    username: obj.username,
    fullname: obj.fullname, 
    email: obj.email
  }
  return res.status(httpStatus.OK).json(user)
}

function list (req, res, next) {
  try {
    const objs = Model.list()
    return res.status(httpStatus.OK).json(objs)
  } catch (e) {
    next(e)
  }
}

function load (req, res, next, id) {
  if (!Number.isInteger(+id)) {
    throw new APIError({status: httpStatus.BAD_REQUEST, message: 'user id error'})
  }
  try {
    const obj =  Model.get(id)
    if (!obj) {
      throw new APIError({status: httpStatus.NOT_FOUND, message: 'user id not exist'})
    }
    req.obj = obj
    next()
    return null
  } catch (e) {
    next(e)
  }
}

function set (req, res, next) {
  const obj = req.obj
  obj.fullname = req.body.fullname
  obj.email = req.body.email
  obj.password = req.body.password
  try {
    Model.set(obj)
    delete obj.password
    delete obj.role
    return res.status(httpStatus.OK).json(obj)
  } catch (e) {
    next(e)
  }
}

function listAcl (req, res, next) {
  const results = AclDB.list()
  return res.status(httpStatus.OK).json(results)
}

function getAcl (req, res, next) {  
  const obj = req.obj
  let acl = AclDB.get(obj.id)
  if (acl) {
    acl.api = AclService.formatToRole(acl.api)
  }
  return res.status(httpStatus.OK).json(acl)
}

function saveAcl (req, res, next) {
  const obj = req.obj
  if (obj.username === 'admin' && obj.id === 1) {
    throw new APIError({status: httpStatus.BAD_REQUEST, message: 'can not set the permission of this role'})
  }

  const acl = {
    user: obj.id,
    api: AclService.formatToAcl(req.body.api),
    possession: req.body.possession
  }

  try {
    AclService.set(acl)
    return res.status(httpStatus.OK).json({data: 'ok'})
  } catch(e) {
    next(e)
  }
}

export default { add, del, get, list, load, set, listAcl, getAcl, saveAcl, }
