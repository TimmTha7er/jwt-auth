const jwt = require('jsonwebtoken')

const tokenModel = require('../models/token-model')

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '15s',
    })
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '30s',
    })

    return {
      accessToken,
      refreshToken,
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
  async saveToken(userId, refreshToken) {
    const tokenData = await tokenModel.findOne({ user: userId })

    if (tokenData) {
      tokenData.refreshToken = refreshToken
      return tokenData.save()
    }

    const token = await tokenModel.create({ user: userId, refreshToken })

    return token
  }
}

module.exports = new TokenService()
