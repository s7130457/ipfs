import sqlite from '../db'

function get(value, key = `id`) {
  const sql = `SELECT * FROM role WHERE ${key} = $value`
  const param = {
    value
  }
  let result = sqlite.prepare(sql).get(param)
  if (result) {
    result = _format(result)
  }

  return result
}

function set(role) {
  const sql = `UPDATE role SET title = $title, permission = $permission WHERE id = $id`
  const param = {
    id: role.id,
    title: role.title,
    permission: JSON.stringify(role.permission) || '{}'
  }
  const result = sqlite.prepare(sql).run(param)

  return result
}

function list() {
  const sql = `SELECT * FROM role`
  let result = sqlite.prepare(sql).all()
  result = result.map(e => _format(e))

  return result
}

function add(role) {
  const sql = `INSERT INTO role (title, permission) VALUES ($title, $permission)`
  const param = {
    title: role.title,
    permission: JSON.stringify(role.permission) || '{}'
  }
  const result = sqlite.prepare(sql).run(param)

  return result
}

function del(role) {
  const sql = `DELETE from role WHERE id = $id`
  const param = {
    id: role.id
  }
  const result = sqlite.prepare(sql).run(param)

  return result
}

function _format (role) {
  role.permission = JSON.parse(role.permission)
  return role
}

export default { get, set, list, add, del, }