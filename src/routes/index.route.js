import { Router } from 'express'
import httpStatus from 'http-status'

import mediaRoutes from './media.route'

const debug = require('debug')('bxb:route:index')

const router = Router()

router.use('/media', mediaRoutes)

export default router
