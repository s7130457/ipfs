import express from 'express'
import {validate} from 'express-validation'
import paramValidation from '../validations/role.validation'
import ctrl from '../controllers/role.controller'
import acl from '../middlewares/acl/user.acl'

const router = express.Router()

router.route('/')
  .get(ctrl.list)
  .post(validate(paramValidation.add), acl.checkAdmin, ctrl.add)
  
router.route('/:id')
  .get(ctrl.get)
  .put(validate(paramValidation.set), ctrl.set)
  .delete(ctrl.del)

router.param('id', ctrl.load)
router.param('id', acl.checkAdmin)

export default router
