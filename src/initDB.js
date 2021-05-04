import sqlite from './db'
import RoleDB from './models/role.model'
import UserDB from './models/user.model'

const debug = require('debug')('bxb:initDB')
const PASSWORD = sqlite.password

;(() => {
  const adminUser = UserDB.get('admin', 'username')
  if (adminUser) return

  insertRole()
  insertUser()
})()

function insertRole () {
  const permissions = require('./initData/role.default').permission
  debug(' => insert roles')
  for (const title of Object.keys(permissions)) {
    const role = {
      title,
      permission: permissions[title]
    }
    RoleDB.add(role)
  }
}

function insertUser () {
  const users = [{
    username: 'admin',
    fullname: 'admin',
    email: 'bxb@bxb.tw',
    password: PASSWORD,
    role: 'admin'
  }, {
    username: 'bxb',
    fullname: 'bxb 公用帳號',
    email: 'bxb@bxb.tw',
    password: PASSWORD,
    role: 'user'
  }]
  debug(' => insert users')
  for (const user of users) {
    UserDB.add(user)
  }
}