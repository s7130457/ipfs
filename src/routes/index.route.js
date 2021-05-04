import { Router } from 'express'
import httpStatus from 'http-status'
import JWT from 'jsonwebtoken'

import authRoutes from './auth.route'
import utilsRoutes from './utils.route'
import mediaRoutes from './media.route'

const debug = require('debug')('bxb:route:index')

const router = Router()

router.use('/utils', utilsRoutes)
router.use('/media', mediaRoutes)


function checkAuth (req, res, next) {
  if (!req.session || !req.session.authenticated) {
    return res.status(httpStatus.UNAUTHORIZED).json({message: `Authentication error`})
  } else {
    next()
  }
}

function jwtVerify (req, res, next) {
  try {
    JWT.verify(req.headers.Authorization, 'bxb9703838')
    next()
  } catch (e) {
    next(e)
  }
}

export default router
