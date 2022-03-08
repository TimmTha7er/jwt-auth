const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')

const mailService = require('./mail-service')
const tokenService = require('./token-service')
const ApiError = require('../exceptions/api-error')

class UserService {
  registration = async (email, password) => {
    const candidate = await UserModel.findOne({ email })

    if (candidate) {
      throw ApiError.BadRequest(
        `Пользователь с почтовым адресом ${email} уже существует`
      )
    }

    const hashPassword = await bcrypt.hash(password, 3)
    const activationId = uuid.v4()
    const activationLink = `${process.env.API_URL}/api/activate/${activationId}`
    const user = await UserModel.create({
      email,
      password: hashPassword,
      activationId,
    })
    const authUser = await tokenService.addTokens(user)

    await mailService.sendActivationMail(email, activationLink)

    return authUser
  }

  activate = async (activationId) => {
    const user = await UserModel.findOne({ activationId })

    if (!user) {
      throw ApiError.BadRequest('Неккоректная ссылка активации')
    }

    user.isActivated = true
    await user.save()
  }

  login = async (email, password) => {
    const user = await UserModel.findOne({ email })

    if (!user) {
      throw ApiError.BadRequest('Пользователь с таким email не найден')
    }

    const isPassEquals = await bcrypt.compare(password, user.password)

    if (!isPassEquals) {
      throw ApiError.BadRequest('Неверный пароль')
    }

    const authUser = await tokenService.addTokens(user)

    return authUser
  }

  logout = async (refreshToken) => {
    const token = await tokenService.removeToken(refreshToken)

    return token
  }

  refresh = async (refreshToken) => {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }

    const userData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.findToken(refreshToken)

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError()
    }

    const user = await UserModel.findById(userData.id)
    const authUser = await tokenService.addTokens(user)

    return authUser
  }

  getAllUsers = async () => {
    const users = await UserModel.find()

    return users
  }
}

module.exports = new UserService()
