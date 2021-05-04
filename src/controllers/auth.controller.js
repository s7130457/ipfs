import httpStatus from 'http-status'
import Model from '../models/user.model'
import Log from '../models/log.model'
import APIError from '../middlewares/errors/APIError'
import JWT from 'jsonwebtoken'

function login(req, res, next) {
  const username = req.body.username
  const password = req.body.password
  const user = Model.get(username, 'username')
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  if (!user) {
    const message = _authError(username, ip)
    throw new APIError({ status: httpStatus.UNAUTHORIZED, message })
  }


  const valid = Model.comparePassword(password, user.password)
  if (!valid) {
    const message = _authError(username, ip)
    throw new APIError({ status: httpStatus.UNAUTHORIZED, message })
  }

  Log.add({
    category: 'auth',
    type: 'info',
    msg: `${user.username} login from ${ip}`
  })


  const token = JWT.sign({
    username: user.username,
    role: user.role
  }, 'bxb9703838', {
    expiresIn: '8h'
  })

  req.session.authenticated = true
  req.session.userId = user.id
  req.session.username = username
  req.session.role = user.role
  
  return res.status(httpStatus.OK).json({ status: 'ok', token })

  function _authError(user, ip) {
    Log.add({
      category: 'auth',
      type: 'error',
      msg: `${user} login failed from ${ip}`
    })
    return `Authentication error`
  }
}

function logout(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  Log.add({
    category: 'auth',
    type: 'info',
    msg: `${req.session.username} logout from ${ip}`
  })

  delete req.session.authenticated
  delete req.session.userId
  delete req.session.username

  return res.status(httpStatus.OK).json({ data: 'ok' })
}

function passwd(req, res, next) {
  if (req.session.authenticated === undefined || req.session.authenticated === false) {
    throw new APIError({ status: httpStatus.UNAUTHORIZED, message: 'Authentication error' })
  }

  let id = req.session.userId

  try {
    let user = Model.get(id)
    const valid = Model.comparePassword(req.body.original, user.password)

    if (!valid) throw new APIError({ status: httpStatus.BAD_REQUEST, message: 'wrong original password' })

    user.password = req.body.password
    Model.set(user)

    return res.status(httpStatus.OK).json({ data: 'ok' })
  } catch (e) {
    next(e)
  }
}

module.exports = { login, logout, passwd }
