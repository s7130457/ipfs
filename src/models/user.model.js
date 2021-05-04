import bcrypt from 'bcryptjs'
import sqlite from '../db'

function get(value, key = `id`) {
  const sql = `SELECT * FROM user WHERE ${key} = $value`
  const param = {
    value
  }
  const result = sqlite.prepare(sql).get(param)

  return result
}

function comparePassword(inputPassword, DBPassword) {
  const match = bcrypt.compareSync(inputPassword, DBPassword)
  if (match) {
    return true
  }

  return false
}

function set(user) {
  const sql = `UPDATE user SET password = $password, fullname = $fullname, email = $email WHERE id = $id`
  const param = {
    id: user.id,
    password: bcrypt.hashSync(user.password, 10),
    fullname: user.fullname,
    email: user.email
  }
  const result = sqlite.prepare(sql).run(param)

  return result
}

function list(value, key = `id`) {
  const sql = `SELECT id, username, fullname, email, role FROM user`
  const result = sqlite.prepare(sql).all()

  return result
}

function add(user) {
  const sql = `INSERT INTO user (username, password, fullname, email, role) VALUES ($username, $password, $fullname, $email, $role)`
  const param = {
    username: user.username,
    fullname: user.fullname,
    email: user.email,
    password: bcrypt.hashSync(user.password),
    role: user.role || 'user'
  }
  const result = sqlite.prepare(sql).run(param)

  return result
}

function del(user) {
  const sql = `DELETE from user WHERE id = $id`
  const param = {
    id: user.id
  }
  const result = sqlite.prepare(sql).run(param)

  return result
}

export default { get, comparePassword, set, list, add, del,  }