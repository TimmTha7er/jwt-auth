const jwt = require('jsonwebtoken')

const UserDto = require('../dtos/user.dto')
const TokenModel = require('../models/token-model')

class TokenService {
  MILLISECONDS_IN_A_MONTH = 30 * 24 * 60 * 60 * 1000

  addTokens = async (user) => {
    const userDto = new UserDto(user)
    const tokens = this.generateTokens({ ...userDto })

    await this.saveToken(userDto.id, tokens.refreshToken)

    return {
      ...tokens,
      user: userDto,
    }
  }
  
  generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_LIFETIME,
    })
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_TOKEN_LIFETIME,
    })

    return {
      accessToken,
      refreshToken,
    }
  }

  validateAccessToken = (token) => {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

      return userData
    } catch (error) {
      return null
    }
  }

  validateRefreshToken = (token) => {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

      return userData
    } catch (error) {
      return null
    }
  }

  // !!!
  // При таком подходе в БД по одному пользователю всегда находится один токен
  // и при попытке зайти на аккаунт с другого устройства, с того устровйства
  // с которого мы были залогинены нас выкенет т.к. токен перезатрется и в БД
  // будет новый токен

  // Можно сохранять по несколько токенов на одного пользователя, но нужно
  // продумать удаление умерших токенов из БД, чтобы БД не превратилась в мусорку
  // !!!
  saveToken = async (userId, refreshToken) => {
    let token = await TokenModel.findOne({ user: userId })

    if (token) {
      token.refreshToken = refreshToken

      return token.save()
    }

    token = await TokenModel.create({ user: userId, refreshToken })

    return token
  }

  removeToken = async (refreshToken) => {
    const token = await TokenModel.deleteOne({ refreshToken })

    return token
  }

  findToken = async (refreshToken) => {
    const token = await TokenModel.findOne({ refreshToken })

    return token
  }

  setCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
      maxAge: this.MILLISECONDS_IN_A_MONTH,
      httpOnly: true,
    })
  }
}

module.exports = new TokenService()
