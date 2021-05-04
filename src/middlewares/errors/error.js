import httpStatus from 'http-status'
import { ValidationError } from 'express-validation'
import APIError from './APIError'

const converter = function (err, req, res, next) {
  let convertedError = err
  if (err instanceof ValidationError) {
    const detail = err.details.query || err.details.body || err.details.params
    const errorMessage = detail.map(error => error.message).toString()

    convertedError = new APIError({
      message: errorMessage,
      errors: err.error,
      status: err.statusCode,
      stack: err.stack
    })
  } else if (!(err instanceof APIError)) {
    convertedError = new APIError({
      message: err.message,
      status: err.status,
      stack: err.stack
    })
  }
  return next(convertedError)
}

const notFound = (req, res, next) => {
  const err = new APIError({
    message: `API not found : ${req.url}`,
    status: httpStatus.NOT_FOUND
  })
  return next(err)
}

// TODO: 決定要不要判斷環境，輸出 stack
const handler = (err, req, res, next) => {
  const response = {
    status: err.status,
    message: err.message || httpStatus[err.status],
    errors: err.errors,
    stack: err.stack,
  }

  // if (env !== 'development') {
  //   delete response.stack
  // }

  res.status(err.status).json(response)
}

module.exports = {converter, notFound, handler}