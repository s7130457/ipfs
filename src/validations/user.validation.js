import Joi from 'joi'
import RoleDB from '../models/role.model'

function checkRoles (value, helpers) {
  let roles = RoleDB.list()
  roles = roles.map(role => role.title)

  if (!roles.includes(value)) {
    return helpers.message(`"role" must be one of ${JSON.stringify(roles)}`)
  }
}

const add = {
  body: Joi.object({
    username: Joi.string().required(),
    fullname: Joi.string().required(),
    password: Joi.string().required(),
    email: Joi.string().required(),
    role: Joi.string().custom(checkRoles).required()
  })
}

const set = {
  body: Joi.object({
    fullname: Joi.string().required(),
    password: Joi.string().required(),
    email: Joi.string().required()
  }),
  params: Joi.object({
    id: Joi.number().integer().required()
  })
}

module.exports = {
  add,
  set,
}