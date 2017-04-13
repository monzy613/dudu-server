import alidayuSMS from 'node-alidayu-sms'
import { alidayuCfg } from '../config'
import utils from 'utility'
import rand from 'csprng'
import qiniu from 'qiniu'

import { qiniuCfg } from '../config'

qiniu.conf.ACCESS_KEY = qiniuCfg.accessKey
qiniu.conf.SECRET_KEY = qiniuCfg.secretKey

const validMobile = mobile => {
  const re = /^(1(3|4|5|7|8))\d{9}$/
  return re.test(mobile)
}

const formatedUserInfo = ({
  user,
  followings = [],
  followers = [],
  following = false,
}) => {
  const {
    mobile,
    isDefaultAvatar,
    name,
    avatar,
    motto,
  } = user
  return {
    mobile,
    isDefaultAvatar,
    name,
    avatar,
    motto,
    following,
    followings,
    followers,
  }
}

const sms = ({ mobile, number, time }) => {
  return alidayuSMS.send({
    appkey: alidayuCfg.appkey,
    appsecret: alidayuCfg.appsecret,
    params: {
      sms_type: 'normal',
      sms_free_sign_name: alidayuCfg.sms_free_sign_name,
      rec_num: mobile,
      sms_template_code: alidayuCfg.sms_template_code,
      sms_param: { number, time }
    }
  })
}

const randomCode = digitCount => {
  let result = ''
  for (let i = 0; i < digitCount; i++) {
    const digit = Math.floor(Math.random() * 10)
    result += `${digit}`
  }
  return result
}

const generateToken = mobile => {
  const randomPart = rand(160, 36)
  const accountPart = utils.sha1(mobile, 'base64')
  return `${accountPart}.${randomPart}`
}

const avatarUploadInfo = mobile => {
  const dateString = ((new Date()).getTime()).toString()

  const mobilePart = utils.sha1(mobile, 'base64')
  const datePart = utils.sha1(dateString, 'base64')
  const randomPart = rand(80, 36)

  const key = `${randomPart}${mobilePart}${datePart}`
  const putPolicy = new qiniu.rs.PutPolicy(`${qiniuCfg.bucket}:${key}`)
  return {
    token: putPolicy.token(),
    key,
  }
}

export {
  validMobile,
  formatedUserInfo,
  sms,
  randomCode,
  generateToken,
  avatarUploadInfo,
}
