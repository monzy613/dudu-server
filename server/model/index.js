import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userSchema = new Schema({
  mobile: String,
  name: String,
  isDefaultAvatar: Boolean,
  salt: String,
  pwdHash: String,
})

const verifySchema = new Schema({
  mobile: String,
  number: String, // verify number
  time: Number, // the time verify number was generated
  userInfo: {
    mobile: String,
    name: String,
    isDefaultAvatar: Boolean,
    salt: String,
    pwdHash: String,
  },
})

const tokenSchema = new Schema({
  mobile: String,
  token: String,
  expireDate: Date,
})

const userSubscribeSchema = new Schema({
  mobile: String,
  feeds: Array,
})

export default {
  user: mongoose.model('user', userSchema),
  userSubscribe: mongoose.model('userSubscribe', userSubscribeSchema),
  token: mongoose.model('token', tokenSchema),
  verify: mongoose.model('verify', verifySchema),
}
