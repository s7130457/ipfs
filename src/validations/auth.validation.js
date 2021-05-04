import Joi from 'joi'

const login = {
  body: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  })
}

const passwd = {
  body: Joi.object({
    password: Joi.string().required(),
    original: Joi.string().required()
  })
}

module.exports = {
  login,
  passwd,
}