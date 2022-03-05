const ApiError = require('../exceptions/api-error')

const errorMiddleware = () => (error, req, res, next) => {
  console.error(error)

  if (error instanceof ApiError) {
    const { status, message, errors } = error

    return res.status(status).json({ message, errors })
  }

  return res.status(500).json({ message: 'Непредвиденная ошибка' })
}

module.exports = errorMiddleware
