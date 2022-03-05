const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')

const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user.dto')

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({ email })

    if (candidate) {
      throw new Error(`Пользователь с почтовым адресом ${email} уже существует`)
    }

    const hashPassword = await bcrypt.hash(password, 3)
    const activationId = uuid.v4()
    const activationLink = `${process.env.API_URL}/api/activate/${activationId}`
    const user = await UserModel.create({
      email,
      password: hashPassword,
      activationId,
    })
    const userDto = new UserDto(user)
    const tokens = tokenService.generateTokens({ ...userDto })

    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    await mailService.sendActivationMail(email, activationLink)

    return {
      ...tokens,
      user: userDto,
    }
  }

  async activate(activationId) {
		const user = await UserModel.findOne({activationId})

		if (!user) {
			throw new Error('Неккоректная ссылка активации')
		}

		user.isActivated = true
		await user.save()
	}
}

module.exports = new UserService()
