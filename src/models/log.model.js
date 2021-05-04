import sqlite from '../db'

function add(log) {
  const sql = `INSERT INTO log (category, type, user, msg)
                VALUES ($category, $type, $user, $msg);`
  const param = {
    category: log.category,
    type: log.type,
    user: log.user || null,
    msg: log.msg
  }
  const result = sqlite.prepare(sql).run(param)

  return result
}

function list (page, limit, from, to) {
  const param = {}
  let sql = `SELECT * FROM log`
  if (from !== null || to !== null) {
    sql += ` WHERE createdAt >= $from AND createdAt <= $to`
    param.from = from || `*`
    param.to = to || `datetime('now', 'localtime')`
  }
  sql += ` ORDER BY createdAt DESC LIMIT $skip, $limit`
  
  param.skip = page * limit
  param.limit = limit
  const data = sqlite.prepare(sql).all(param)
  
  return data
}

function count (from, to) {
  const param = {}
  let sql = `SELECT COUNT() AS count FROM log`
  if (from !== null || to !== null) {
    sql += ` WHERE createdAt >= $from AND createdAt <= $to`
    param.from = from || `*`
    param.to = to || `datetime('now', 'localtime')`
  }
  const data = sqlite.prepare(sql).get(param)
  
  return data.count
}

function clean (skip) {
  const sql = `SELECT * FROM log ORDER BY createdAt DESC LIMIT -1 OFFSET ${skip}`
  const docs = sqlite.prepare(sql).all()
  const ids = docs.map(doc => doc.id)
  if (ids.length > 0) {
    del(ids)
  }

  return
}

function del(ids) {
  const sql = `DELETE FROM log WHERE id in (${ids.join(',')})`
  sqlite.prepare(sql).run()

  return 
}

export default { add, list, clean, del, count,  }