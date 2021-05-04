import express from 'express'
import { validate } from 'express-validation'
// import paramValidation from '../validations/system.validation'
import ctrl from '../controllers/system.controller'
import multer from 'multer'


const router = express.Router()
const upload = multer({ dest: '/tmp' })


router.route('/backupDB').get(ctrl.backupDB)
router.route('/importDB').post(upload.single('file'), ctrl.importDB)
router.route('/resetDB').get(ctrl.resetDB)
router.route('/update')
  .post(upload.single('file'), ctrl.update)

router.route('/network')
  .get(ctrl.networkGet)
  .post(ctrl.networkSet)
  // .post(validate(paramValidation.network), ctrl.networkSet)
// router.route('/io')
//   .get(ctrl.configGet)
//   .post(validate(paramValidation.io), ctrl.configSet)

// router.route('/time')
//   .post(validate(paramValidation.time), ctrl.timeSet)

export default router
