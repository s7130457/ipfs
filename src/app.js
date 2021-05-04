import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import httpStatus from 'http-status'
import os from 'os'
import routes from './routes/index.route'
import utilsRoutes from './routes/utils.route'
import Config from './lib/bxb_config'

import { ValidationError } from 'express-validation'
import error from './middlewares/errors/error'
import sysStatus from './lib/bxb_status'
import tools from '@bxb/device-tools'

const http = require('http')

const app = express()
const debug = require('debug')('bxb:app')
const server = require('http').Server(app)
const pkg = require('./package.json')
const SQLiteStore = require('connect-sqlite3')(session)

const ws = require('socket.io')(server, {
  transports: ['websocket', 'polling'],
  pingInterval: 40000,
  pingTimeout: 25000
})

const db = require('./db.js')
const dbScript = require('./initDB')


debug(`[INIT] backend ver : \x1b[31m${pkg.gitVersion}\x1b[0m`)

const model = Config.get('model')
if (os.platform() === 'linux' && tools.licenseValid(model) === false) {
  initUnlicense()
} else {
  initNormal()
}

function initUnlicense () {
  app.use(`/api/utils`, utilsRoutes)

  app.listen(8090, async () => {
    debug('\x1b[31m=====> This device is un-licensed!!! <=====\x1b[0m')
    // desktop.send({ cmd: 'ip', show: 'true', text: 'un-licensed' })
  })
}

function initNormal() {
  app.use(cors())
  app.use(bodyParser.json({ limit: 1024 * 1024 * 1024 })) // 1G
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(helmet())

  app.use(session({
    secret: 'bxb9703838',
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000
    },
    store: new SQLiteStore(),
    resave: false,
    saveUninitialized: true
  }))

  app.use((req, res, next) => {
    req.ws = ws
    next()
  })

  app.use('/api', routes)

  app.use(error.converter)

  app.use(error.notFound)

  app.use(error.handler)

  // NOTE: 這裡要用 server，不能用 app，不然 websocket 會失效
  server.listen(8090, () => {
    initWS(ws)

    // setTimeout(() => {
    //   // desktop.send({ cmd: 'ip', show: 'true', text: tools.getHostIp('eth0') })
    // }, 5000)
  })
}

function initWS (ws) {
  setInterval(() => {
    let ret = {}
    try {
      ret = sysStatus.get()
    } catch (e) {
      console.log(e)
    }
    ws.emit('systemStat', ret)
  }, 1000)
}

export default app
