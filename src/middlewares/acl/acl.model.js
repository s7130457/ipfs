import sqlite from '../../db'

;(() => {
  creatAclTable()
})()

function add (acl) {
  const sql = `INSERT INTO acl (user, api, possession) VALUES ($user, $api, $possession)`
  const param = {
    user: acl.user,
    api: JSON.stringify(acl.api) || '{}',
    possession: JSON.stringify(acl.possession) || '{}'
  }
  const result = sqlite.prepare(sql).run(param)
  return result
}

function get (value, key = `user`) {
  const sql = `SELECT * FROM acl WHERE ${key} = $value;`
  let param = {
    value
  }
  let result = sqlite.prepare(sql).get(param)
  if (result) {
    delete result.id
    result = _format(result)
  }
  return result
}

function list () {
  const sql = `SELECT * FROM acl`
  let results = sqlite.prepare(sql).all()

  results.map(acl => {
    delete acl.id
    acl = _format(acl)
  })
  return results
}

function set (acl) {
  let sql = `UPDATE acl SET api = $api, possession = $possession WHERE user = $user`
  const param = {
    user: acl.user,
    api: JSON.stringify(acl.api) || '{}',
    possession: JSON.stringify(acl.possession) || '{}'
  }

  const result = sqlite.prepare(sql).run(param)
  return result
}

function del (userId) {
  const sql = `DELETE FROM acl WHERE user = $user`
  const param = {
    user: userId
  }
  const result = sqlite.prepare(sql).run(param)
  return result
}

function _format (acl) {
  acl.api = JSON.parse(acl.api)
  acl.possession = JSON.parse(acl.possession)
  return acl
}

// init acl table
function creatAclTable () {
  const aclTable = `CREATE TABLE IF NOT EXISTS acl (
                        id INTEGER PRIMARY KEY AUTOINCREMENT, 
                        user INTEGER UNIQUE,
                        api TEXT NOT NULL, 
                        possession TEXT NOT NULL DEFAULT '{}',
                        FOREIGN KEY("user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
                      );`
  sqlite.prepare(aclTable).run()
}

export default { get, add, set, del, list,  }