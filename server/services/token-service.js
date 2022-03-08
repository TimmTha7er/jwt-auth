const jwt = require('jsonwebtoken')

const TokenModel = require('../models/token-model')

class TokenService {
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
    const tokenData = await TokenModel.findOne({ user: userId })

    if (tokenData) {
      tokenData.refreshToken = refreshToken

      return tokenData.save()
    }

    const token = await TokenModel.create({ user: userId, refreshToken })

    return token
  }

  removeToken = async (refreshToken) => {
    const tokenData = await TokenModel.deleteOne({ refreshToken })

    return tokenData
  }

  findToken = async (refreshToken) => {
    const tokenData = await TokenModel.findOne({ refreshToken })

    return tokenData
  }
}

module.exports = new TokenService()
