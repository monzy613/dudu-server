import express from 'express'
import path from 'path'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'
import model from '../../model'
import { tokenValidator } from '../../lib/routerMiddlewares'
import { formatedUserInfo } from '../../lib/util'

const router = express.Router()

// 获取指定用户的关注
router.get('/getFollowing', (req, res) => {
  const { mobile: follower } = req.query
  if (isEmpty(follower)) {
    return res.send({ error: 'mobile不可为空' })
  }
  model.follow.find({ follower })
  .then(result => {
    const mobiles = result.map(follow => follow.following)
    model.user.find({ mobile: { $in: mobiles } })
    .then(rawUsers => {
      res.send({ result: rawUsers.map(user => formatedUserInfo({ user, following: true })) })
    })
    .catch(error => {
      console.warn(error)
      res.send({ error })
    })
  })
  .catch(error => res.send({ error }))
})

// 获取指定用户的粉丝
router.get('/getFollower', (req, res) => {
  const { mobile: following } = req.query
  if (isEmpty(following)) {
    return res.send({ error: 'mobile不可为空' })
  }
  const queries = [
    model.follow.find({ following }), //查找粉丝
    model.follow.find({ follower: following }), //查找mobile关注的人
  ]
  Promise.all(queries)
  .then(queryItems => {
    const [ followerResult, followingResult ] = queryItems
    const followerMobiles = followerResult.map(follow => follow.follower)
    const followingMobiles = followingResult.map(follow => follow.following)
    model.user.find({ mobile: { $in: followerMobiles } })
    .then(rawUsers => {
      res.send({ result: rawUsers.map(user => formatedUserInfo({ user, following: followingMobiles.includes(user.mobile) })) })
    })
    .catch(error => {
      console.warn(error)
      res.send({ error })
    })
  })
  .catch(error => res.send({ error }))
})

router.post('/follow', tokenValidator, (req, res) => {
  const { mobile: follower } = req.params
  const { mobile: following } = req.body
  if (follower === following) {
    return res.send({ error: '不能关注自己' })
  }

  const query = { follower, following }
  const update = query
  const options = { upsert: true }

  model.follow.findOneAndUpdate(query, update, options)
  .then(result => res.send({ success: true }))
  .catch(error => {
    console.warn(error)
    res.send({ error })
  })
})

router.post('/unfollow', tokenValidator, (req, res) => {
  const { mobile: follower } = req.params
  const { mobile: following } = req.body

  console.log(follower, following)
  model.follow.find({ follower, following }).remove()
  .then(obj => {
    const count = obj && obj.result && obj.result.n
    if (count === 0) {
      res.send({ error: '请勿重复取消关注' })
    } else {
      res.send({ success: true })
    }
  })
  .catch(error => res.send({ error }))
})

export default router
