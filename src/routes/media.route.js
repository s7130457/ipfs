import express from 'express'
import multer from 'multer'
import {validate, Joi} from 'express-validation'
import ctrl from '../controllers/media.controller'

import config from '../lib/bxb_config'

const router = express.Router()
const upload = multer({ dest: config.get('storage') })

router.route('/')
  .post(upload.single('file'), ctrl.add)
  .get(ctrl.list)

router.route('/:id')
  .delete(ctrl.del)

router.param('id', ctrl.load)

export default router
