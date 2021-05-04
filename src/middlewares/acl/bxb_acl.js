import AccessControl from 'accesscontrol'
import AclDB from './acl.model'
import RoleDB from '../../models/role.model'
import UserDB from '../../models/user.model'

const debug = require('debug')('bxb:acl')

function Acl () {
  this.acl = null

  this.OPERATIONS = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete'
  }

  // NOTE: 因為 role table 寫入資料前就會執行，所以不斷詢問，看 DB 是否有寫入了。不過這不是好方法
  let timer = setInterval(() => {
    const roles = RoleDB.list()
    if (roles.length > 0) {
      this.init()
      clearInterval(timer)
    }
  }, 500)
}

Acl.prototype.init = function () {
  let permission = {}
  const roles = RoleDB.list()
  for (const role of roles) {
    permission[role.title] = role.permission
  }
  this.acl = new AccessControl(permission)

  const users = UserDB.list()
  for (const user of users) {
    this.add(user)
  }
}

Acl.prototype.listGrants = function () {
  return this.acl.getGrants()
}

Acl.prototype.get = function (userId) {
  const grants = this.acl.getGrants()
  return grants[userId]
}

Acl.prototype.add = function (user) {
  const isRoleExist = _isDataExist.call(this, user.role)
  if (isRoleExist) {
    this.acl.grant(`${user.id}`).extend(user.role)
  } else {
    this.acl.grant(`${user.id}`)
  }

  const acl = AclDB.get(user.id)

  if (acl) {
    this.set(acl)
  } else {
    AclDB.add({
      user: user.id,
      api: {},
      possession: {}
    })
  }
}

Acl.prototype.set = function (acl) {
  AclDB.set(acl)

  this.setPermission({
    name: acl.user,
    permission: acl.api
  })
}

// NOTE: name 可以是 user id 或是 role name
Acl.prototype.del = function (name) {
  this.acl.removeRoles(`${name}`)
}

// NOTE: info 包含要寫入 acl 物件的名稱、權限(acl格式)
Acl.prototype.setPermission = function (info) {
  const name = info.name
  const permission = info.permission

  const isDataExist = _isDataExist.call(this, name)
  if (!isDataExist) {
    this.acl.grant(`${name}`)
  }

  for (const route of Object.keys(permission)) {
    for (const action of Object.keys(permission[route])) {
      if (permission[route][action].includes('!*')) {
        this.acl.deny({
          role: `${name}`,
          resource: route,
          action: action
        })
      } else {
        this.acl.grant({
          role: `${name}`,
          resource: route,
          action: action,  // action: read, create, update, delete (:any, :own)
          attributes: permission[route][action]
        })
      }
    }
  }
}

Acl.prototype.checkPermission = function (operate, param) {
  const user = param.user
  const route = param.route
  const data = param.data

  // 當該資料不屬於當前使用者，則使用者必須擁有 Any 權限；否則，其他狀況，當前使用者只需要 Own 權限即可
  // 例如 POST /media/1，該資料不屬於任何人，所以只需要 Own 即可操作
  // 例如 POST /schedule，不會找到任何資料，所以 row = undefined，此時使用者也只需要 Own 權限就可操作
  operate += (data && data.user && data.user !== user.id) ? 'Any' : 'Own'
  const permission = this.acl.can(`${user.id}`)[operate](route)
  return permission.granted
}

// 將前端傳來的 permission 格式，轉成 accessControl 的格式
// {schedule : true} => {schedule: {"read:any": ['*'], "create:own": ['*'], "update:own": ['*'], "delete:own": ['*']}}
Acl.prototype.formatToAcl = function (permission) {
  let ret = {}
  for (const route of Object.keys(permission)) {
    ret[route] = {}
    if (permission[route]) {
      ret[route][`read:any`] = ['*']
      ret[route][`create:own`] = ['*']
      ret[route][`update:own`] = ['*']
      ret[route][`delete:own`] = ['*']
    } else {
      ret[route][`read:any`] = ['*']
      ret[route][`create:own`] = ['!*']
      ret[route][`update:own`] = ['!*']
      ret[route][`delete:own`] = ['!*']
    }
  }
  return ret
}

// 將 accessControl 格式，轉成前端看得懂的格式
// {schedule: {"read:any": ['*'], "create:own": ['*'], "update:own": ['*'], "delete:own": ['*']}} => {schedule : true}
Acl.prototype.formatToRole = function (acl) {
  let ret = {}
  for (const route of Object.keys(acl)) {
    ret[route] = true
    if (JSON.stringify(acl[route]).includes('!*')) {
      ret[route] = false
    }
  }
  return ret
}

function _isDataExist (name) {
  const roles = this.acl.getRoles()
  return roles.includes(`${name}`)
}
module.exports = new Acl()