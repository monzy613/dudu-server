import alidayuSMS from 'node-alidayu-sms'
import { alidayuCfg } from '../config'

const validMobile = mobile => {
  const re = /^(1(3|4|5|7|8))\d{9}$/
  return re.test(mobile)
}

const formatedUserInfo = user => {
  const {
    mobile,
    isDefaultAvatar,
    name
  } = user
  return { mobile, isDefaultAvatar, name }
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

export {
  validMobile,
  formatedUserInfo,
  sms,
  randomCode
}
