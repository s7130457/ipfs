import express from 'express'
import {validate} from 'express-validation'
import paramValidation from '../validations/utils.validation'
import ctrl from '../controllers/utils.controller'

const router = express.Router()

router.route('/sysinfo')
  .get(ctrl.sysinfo)

router.route('/version')
  .get(ctrl.version)

router.route('/license')
  .get(ctrl.getLicense)
  .post(ctrl.setLicense)

export default router