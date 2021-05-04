import Joi from 'joi'

const ipReg = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/

const network = {
  body: Joi.object({
    address: Joi.string().required(),
    gateway: Joi.string().required(),
    netmask: Joi.string().required()
  }).unknown(true)
}

const fcs = {
  body: Joi.object({
    ip: Joi.string().regex(ipReg).required()
  })
}

const io = {
  body: Joi.object({
    rs232: Joi.any().valid('ufo', 'edc2051', 'edc1051', 'fcs', 'dsp'),
    syncGotoPreset: Joi.boolean()
  })
}

const time = {
  body: Joi.object({
    ts: Joi.string().regex(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/).required()
  })
}

module.exports = {
  network,
  fcs,
  io,
  time,
}
