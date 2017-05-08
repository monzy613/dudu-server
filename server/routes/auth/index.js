import express from 'express'
import path from 'path'
import utils from 'utility'
import isEmpty from 'lodash/isEmpty'
import rand from 'csprng'

import {
  validMobile,
  formatedUserInfo,
  sms,
  randomCode,
  generateToken,
  avatarUploadInfo,
} from '../../lib/util'
import db from '../../lib/db'
import model from '../../model'
import { tokenValidator } from '../../lib/routerMiddlewares'
import { qiniuCfg } from '../../config'

const router = express.Router()

const tokenExpireSeconds = 60 * 60 * 24 * 7 * 1000 // token有效期一周
const MAX_VERIFY_TIME = 600000 // 验证码十分钟有效
const VERIFY_TYPE_REGISTER = 'register'
const VERIFY_TYPE_PASSWORD = 'password'

const DEFAULT_AVATAR = 'http://ojiryy947.bkt.clouddn.com/default_avatar.png'

const isDebug = (process.argv[2] === 'debug')

const removeOutDatedVerifies = () => {
  console.log('Clearing outdated verifies')
  const date = new Date()
  date.setMinutes(date.getMinutes() - 10)
  model.verify.find({ time: { $lt: date.getTime() } })
  .remove()
  .then(obj => console.log(`${obj && obj.result && obj.result.n} outdated records removed`))
  .catch(error => console.warn(error))
  setTimeout(removeOutDatedVerifies, MAX_VERIFY_TIME)
}

removeOutDatedVerifies()

// login
router.post('/login', (req, res) => {
  const {
    mobile,
    password
  } = req.body

  const queries = [
    model.user.findOne({ mobile }),
    model.follow.find({ follower: mobile }), //关注数
    model.follow.find({ following: mobile }), //粉丝数
  ]

  Promise.all(queries)
  .then(queryItems => {
    const [ user, followings, followers ] = queryItems
    if (isEmpty(user)) {
      res.send({ error: `${mobile} 不存在` })
    } else {
      const {
        salt,
        pwdHash
      } = user

      const clientPwdHash = utils.sha1(`${password}${salt}`, 'base64')
      if (clientPwdHash === pwdHash) {
        // 生成 token, 存入token表
        const token = generateToken(user.mobile)
        const expireDate = new Date((new Date()).getTime() + tokenExpireSeconds)
        model.token.findOneAndUpdate({ mobile }, { token, expireDate }, { upsert: true })
        .then(doc => {
          res.send({
            result: {
              user: formatedUserInfo({ user, followings, followers }),
              token,
            }
          })
        })
        .catch(error => {
          console.warn(error)
          res.send({ error })
        })
      } else {
        // wrong password
        res.send({ error: '密码错误' })
      }
    }
  })
  .catch(error => {
    res.send({ error })
  })
})

/**
 * 注册逻辑说明
 * 先传过来手机号和密码, 检验是否已绑定账号
 * 如果可以注册， 手机号和密码以及验证码存入verify表
 * 并给注册手机号发送验证码短信
 * 
  verify: {
    mobile: String,
    number: String,
    password: String,
    time: Date
  }
  用户收到验证码之后回传code
 */

// register
router.post('/register', (req, res) => {
  const {
    mobile,
    password,
    name = '',
    avatar = DEFAULT_AVATAR,
  } = req.body

  if (!validMobile(mobile)) {
    res.send({ error: '手机号不合法' })
    return
  }

  model.user.find({ mobile })
  .then(docs => {
    if (!isEmpty(docs)) {
      res.send({ error: '手机号已被注册' })
    } else {
      // generate salt
      const salt = rand(80, 36)
      const pwdHash = utils.sha1(`${password}${salt}`, 'base64')

      const userInfo = {
        mobile,
        pwdHash,
        salt,
        isDefaultAvatar: true,
        avatar,
        name,
      }

      const number = randomCode(4)
      const time = (new Date()).getTime()

      const verifyData = {
        mobile,
        number,
        time,
        userInfo
      }

      req.session.mobile = mobile

      const updateVerify = () => {
        model.verify.findOneAndUpdate({ mobile }, verifyData, { upsert: true })
        .then(doc => {
          res.send({ result: { success: true } })
        })
        .catch(error => {
          console.warn(error)
          res.send({ error })
        })
      }

      if (isDebug) {
        updateVerify()
      } else {
        sms({ mobile, number, time: `${MAX_VERIFY_TIME / 60000}` }).then(result => {
          updateVerify()
        }).catch(error => {
          console.warn(error)
          res.send({ error })
        })
      }
    }
  }).catch(error => {
    console.warn(error)
    res.send({ error })
  })
})

// resetPassword
router.post('/resetPassword', (req, res) => {
})

// verify
router.post('/verify', (req, res) => {
  const { mobile, number, type } = req.body
  if (isEmpty(mobile)) {
    res.send({ error: '手机号错误' })
    return
  }

  model.verify.findOne({ mobile })
  .then(verify => {
    if (isEmpty(verify)) {
      // empty
      res.send({ error: '验证码已过期' })
    } else {
      if (verify.number === number) {
        // success
        if (type !== VERIFY_TYPE_PASSWORD) {
          // 注册
          const queries = [
            model.user.findOne({ mobile }),
            model.follow.find({ follower: mobile }), //关注数
            model.follow.find({ following: mobile }), //粉丝数
          ]
          Promise.all(queries)
          .then(queryItems => {
            const [ user, followings, followers ] = queryItems
            if (!isEmpty(user)) {
              res.send({ error: '手机号已被注册' })
            } else {
              const {
                pwdHash,
                salt,
                isDefaultAvatar,
                avatar = DEFAULT_AVATAR,
                name,
              } = verify.userInfo
              const token = generateToken(mobile)
              const expireDate = new Date((new Date()).getTime() + tokenExpireSeconds)
              const newUser = new model.user({
                mobile,
                pwdHash,
                salt,
                isDefaultAvatar,
                name,
                avatar,
              })

              newUser.save().then(user => {
                const result = {
                  user: formatedUserInfo({ user, followings, followers }),
                  token
                }
                model.token.findOneAndUpdate({ mobile }, { token, expireDate }, { upsert: true })
                .then(() => model.verify.find({ mobile }).remove(() => res.send({ result })))
                .catch(error => res.send({ error }))
              })
              .catch(error => res.send({ error }))
            }
          })
          .catch(error => {
            console.warn(error)
            res.send({ error })
          })
        } else {
          // 大概是忘了密码
          res.send({ error: '大概是忘了密码' })
        }
      } else {
        // failed
        res.send({ result: { success: false } })
      }
    }
  })
  .catch(error => {
    console.warn(error)
    res.send(error)
  })
})

router.get('/getUser', (req, res) => {
  const { mobile } = req.query
  const queries = [
    model.user.findOne({ mobile }),
    model.follow.find({ follower: mobile }), //关注数
    model.follow.find({ following: mobile }), //粉丝数
  ]
  Promise.all(queries)
  .then(queryItems => {
    const [ user, followings, followers ] = queryItems
    if (isEmpty(user)) {
      return res.send({ error: '未找到用户' })
    }
    const result = formatedUserInfo({ user })
    result.followingCount = followings.length
    result.followerCount = followers.length
    res.send({ result })
  })
  .catch(error => {
    console.warn(error)
    res.send({ error })
  })
})

router.get('/getAvatarUploadInfo', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const result = avatarUploadInfo(mobile)
  res.send({ result })
})

router.post('/changeAvatar', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { key } = req.body
  if (isEmpty(key)) {
    return res.send({ error: 'key not valid' })
  }

  let avatar = `${qiniuCfg.host}/${key}`
  if (!qiniuCfg.host.startsWith('http://') && !qiniuCfg.host.startsWith('https://')) {
    avatar = `http://${avatar}`
  }
  model.user.findOneAndUpdate({ mobile }, { avatar })
  .then(user => res.send({ result: formatedUserInfo({ user }) }))
  .catch(error => {
    console.warn(error)
    res.send({ error })
  })
})

router.post('/changeName', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { name } = req.body
  const newName = name && name.trim()
  if (isEmpty(newName)) {
    return res.send({ error: '姓名不可为空' })
  }
  model.user.findOneAndUpdate({ mobile }, { name: newName })
  .then(user => res.send({ result: formatedUserInfo({ user }) }))
  .catch(error => {
    console.warn(error)
    res.send({ error })
  })
})

router.post('/changeMotto', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { motto } = req.body

  model.user.findOneAndUpdate({ mobile }, { motto })
  .then(user => res.send({ result: formatedUserInfo({ user }) }))
  .catch(error => {
    console.warn(error)
    res.send({ error })
  })
})

export default router
