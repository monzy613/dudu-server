import express from 'express'
import path from 'path'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'
import model from '../../model'
import { tokenValidator } from '../../lib/routerMiddlewares'

const router = express.Router()

// 获取指定用户的关注
router.get('/getFollowing', (req, res) => {
  const { mobile: follower } = req.query
  if (isEmpty(follower)) {
    return res.send({ error: 'mobile不可为空' })
  }
  model.follow.find({ follower })
  .then(result => res.send({ result }))
  .catch(error => res.send({ error }))
})

// 获取指定用户的粉丝
router.get('/getFollower', (req, res) => {
  const { mobile: following } = req.query
  if (isEmpty(following)) {
    return res.send({ error: 'mobile不可为空' })
  }
  model.follow.find({ following })
  .then(result => res.send({ result }))
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
