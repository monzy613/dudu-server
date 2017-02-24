import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userSchema = new Schema({
  mobile: String,
  name: String,
  isDefaultAvatar: Boolean,
  salt: String,
  pwdHash: String
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
    pwdHash: String
  }
})

export default {
  user: mongoose.model('user', userSchema),
  verify: mongoose.model('verify', verifySchema)
}
