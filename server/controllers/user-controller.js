const { validationResult } = require('express-validator')

const userService = require('../services/user-service')
const tokenService = require('../services/token-service')
const ApiError = require('../exceptions/api-error')

class UserController {
  registration = async (req, res, next) => {
    try {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest('Ошибка при валидации', errors.array()))
      }

      const { email, password } = req.body
      const user = await userService.registration(email, password)

      tokenService.setCookie(res, user.refreshToken)

      return res.json(user)
    } catch (error) {
      next(error)
    }
  }

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body
      const user = await userService.login(email, password)

      tokenService.setCookie(res, user.refreshToken)

      return res.json(user)
    } catch (error) {
      next(error)
    }
  }

  logout = async (req, res, next) => {
    try {
      const { refreshToken } = req.cookies
      const token = await userService.logout(refreshToken)

      res.clearCookie('refreshToken')

      return res.json(token)
    } catch (error) {
      next(error)
    }
  }

  activate = async (req, res, next) => {
    try {
      const activationId = req.params.id

      await userService.activate(activationId)

      return res.redirect(process.env.CLIENT_URL)
    } catch (error) {
      next(error)
    }
  }

  refresh = async (req, res, next) => {
    try {
      const { refreshToken } = req.cookies
      const user = await userService.refresh(refreshToken)

      tokenService.setCookie(res, user.refreshToken)

      return res.json(user)
    } catch (error) {
      next(error)
    }
  }

  getUsers = async (req, res, next) => {
    try {
      const users = await userService.getAllUsers()

      return res.json(users)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UserController()
