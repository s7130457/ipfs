import Joi from 'joi'

const add = {
  body: Joi.object({
    title: Joi.string().required(),
    permission: Joi.object().required()
  })
}

const set = {
  body: Joi.object({
    title: Joi.string().required(),
    permission: Joi.object().required()
  })
}

module.exports = {
  add,
  set,
}