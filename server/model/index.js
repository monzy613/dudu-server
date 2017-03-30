import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userSchema = new Schema({
  mobile: String,
  name: String,
  isDefaultAvatar: Boolean,
  avatar: String,
  salt: String,
  motto: String,
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
    avatar: String,
    salt: String,
    pwdHash: String,
  },
})

const tokenSchema = new Schema({
  mobile: String,
  token: String,
  expireDate: Date,
})

const feedSchema = new Schema({
  source: String,
  title: String,
  description: String,
  itemOverviews: Array,
  link: String,
})

const feedItemSchema = new Schema({
  url: String,
  link: String,
  source: String,
  sourceTitle: String,
  categories: Array,
  publishDate: Date,
  title: String,
  description: String,
})

const userSubscribeSchema = new Schema({
  mobile: String,
  feeds: Array,
})

// timeline
const timelineSchema = new Schema({
  mobile: String,
  content: String,
  publishDate: Date,
  type: String,
  referredItem: {
    url: String,
    title: String,
    sourceTitle: String,
  },
  comments: Array, // <String> comment id
  usersLiked: Array, // <String> like id
})

// 用户点赞的表
const likeSchema = new Schema({
  authorMobile: String,
  mobile: String,
  avatar: String,
  name: String,
  timelineID: String,
  publishDate: Date,
})

// 评论表
const commentSchema = new Schema({
  authorMobile: String,
  mobile: String,
  name: String,
  replyMobile: String,
  replyName: String,
  timelineID: String,
  content: String,
  publishDate: Date,
})

export default {
  user: mongoose.model('user', userSchema),
  userSubscribe: mongoose.model('userSubscribe', userSubscribeSchema),
  token: mongoose.model('token', tokenSchema),
  feed: mongoose.model('feed', feedSchema),
  feedItem: mongoose.model('feedItem', feedItemSchema),
  verify: mongoose.model('verify', verifySchema),

  // timeline
  timeline: mongoose.model('timeline', timelineSchema),
  like: mongoose.model('like', likeSchema),
  comment: mongoose.model('comment', commentSchema),
}
