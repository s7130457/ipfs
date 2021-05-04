import express from 'express'
import {validate} from 'express-validation'
import paramValidation from '../validations/user.validation'
import ctrl from '../controllers/user.controller'
import acl from '../middlewares/acl/user.acl'

const router = express.Router()

router.route('/')
  .get(ctrl.list)
  .post(validate(paramValidation.add), acl.checkAdmin, ctrl.add)

router.route('/acl')
  .get(ctrl.listAcl)
  
router.route('/:id/acl')
  .get(ctrl.getAcl)
  .put(ctrl.saveAcl)

router.route('/:id')
  .get(ctrl.get)
  .put(validate(paramValidation.set), ctrl.set)
  .delete(ctrl.del)

router.param('id', ctrl.load)
router.param('id', acl.load)

export default router
