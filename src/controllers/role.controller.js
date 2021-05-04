import httpStatus from 'http-status'
import Model from '../models/role.model'
import UserDB from '../models/user.model'
import AclService from '../middlewares/acl/bxb_acl'
import APIError from '../middlewares/errors/APIError'

function add(req, res, next) {
  const role = Model.get(req.body.title, 'title')
  if (role) {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: 'role already exist' })
  }

  try {
    req.body.permission = AclService.formatToAcl(req.body.permission)
    const obj = Model.add(req.body)
    AclService.setPermission({
      name: req.body.title,
      permission: req.body.permission
    })
    return res.status(httpStatus.OK).json(obj)
  } catch (e) {
    next(e)
  }
}

function del(req, res, next) {
  const obj = req.obj
  if (obj.title === 'admin' || obj.title === 'user') {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: 'can not delete admin or user' })
  }

  let users = UserDB.list()
  users = users.find(user => user.role === obj.title)
  if (users) {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: 'this role is used by user' })
  }

  try {
    Model.del(obj)
    AclService.del(obj.title)
    return res.status(httpStatus.OK).json({ data: 'ok' })
  } catch (e) {
    next(e)
  }
}

function get(req, res, next) {
  let obj = req.obj
  obj.permission = AclService.formatToRole(obj.permission)
  return res.status(httpStatus.OK).json(obj)
}

function list(req, res, next) {
  try {
    let results = Model.list()
    results = results.map(role => {
      role.permission = AclService.formatToRole(role.permission)
      return role
    })
    return res.status(httpStatus.OK).json(results)
  } catch (e) {
    next(e)
  }
}

function load(req, res, next, id) {
  if (!Number.isInteger(+id)) {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: 'role id error' })
  }
  try {
    const obj = Model.get(id)
    if (!obj) {
      throw new APIError({ status: httpStatus.NOT_FOUND, message: 'role id not exist' })
    }
    req.obj = obj
    next()
    return null
  } catch (e) {
    next(e)
  }
}

function set(req, res, next) {
  const obj = req.obj
  if (obj.title === 'admin') {
    throw new APIError({ status: httpStatus.BAD_REQUEST, message: 'can not modify admin permission' })
  }

  try {
    obj.title = req.body.title || obj.title
    obj.permission = (req.body.permission) ? AclService.formatToAcl(req.body.permission) : obj.permission

    const result = Model.set(obj)
    AclService.setPermission({
      name: obj.title,
      permission: obj.permission
    })
    return res.status(httpStatus.OK).json(result)
  } catch (e) {
    next(e)
  }
}

export default { add, del, get, list, load, set, }
