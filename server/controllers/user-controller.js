const { validationResult } = require('express-validator')

const userService = require('../services/user-service')
const ApiError = require('../exceptions/api-error')

class UserController {
  MILLISECONDS_IN_A_MONTH = 30 * 24 * 60 * 60 * 1000

  registration = async (req, res, next) => {
    try {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest('Ошибка при валидации', errors.array()))
      }

      const { email, password } = req.body
      const userData = await userService.registration(email, password)

      this._setCookie(res, userData.refreshToken)

      return res.json(userData)
    } catch (error) {
      next(error)
    }
  }

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body
      const userData = await userService.login(email, password)

      this._setCookie(res, userData.refreshToken)

      return res.json(userData)
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
      const userData = await userService.refresh(refreshToken)

      this._setCookie(res, userData.refreshToken)

      return res.json(userData)
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

  _setCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
      maxAge: this.MILLISECONDS_IN_A_MONTH,
      httpOnly: true,
    })
  }
}

module.exports = new UserController()
