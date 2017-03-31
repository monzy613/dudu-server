import express from 'express'
import isEmpty from 'lodash/isEmpty'

import mongoose from 'mongoose'
import db from '../../lib/db'
import model from '../../model'
import { tokenValidator } from '../../lib/routerMiddlewares'

const TIMELINE_TYPE_TEXT = 'text'
const TIMELINE_TYPE_SOURCE = 'source'
const TIMELINE_TYPE_ITEM = 'item'

const router = express.Router()

// 发布timeline
router.post('/postTimeline', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const {
    content,
    type,
    payload,
  } = req.body
  if (isEmpty(content) && isEmpty(payload)) {
    return res.send({ error: '请勿发空状态' })
  }

  switch (type) {
    case TIMELINE_TYPE_TEXT: {
      const timeline = new model.timeline({
        mobile,
        content,
        type,
        publishDate: new Date(),
        referredItem: undefined,
      })

      timeline.save()
      .then(() => res.send({ success: true }))
      .catch(error => res.send({ error }))
      break
    }
    case TIMELINE_TYPE_SOURCE: {
      const { source } = payload
      if (isEmpty(source)) {
        res.send({ error: 'source 为空' })
      } else {
        model.feed.find({ source })
        .then(feeds => {
          const [feed] = feeds
          if (isEmpty(feed)) {
            return res.send({ error: '无效的 source' })
          }
          const timeline = new model.timeline({
            mobile,
            content,
            type,
            publishDate: new Date(),
            referredItem: {
              source,
              title: feed.title,
            },
          })
          timeline.save()
          .then(() => res.send({ success: true }))
          .catch(error => res.send({ error }))
        })
        .catch(error => res.send({ error }))
        .catch(error => res.send({ error }))
      }
      break
    }
    case TIMELINE_TYPE_ITEM: {
      const { url } = payload
      if (isEmpty(url)) {
        res.send({ error: 'url 为空' })
      } else {
        model.feedItem.find({ url })
        .then(feedItems => {
          const [feedItem] = feedItems
          if (isEmpty(feedItem)) {
            return res.send({ error: '无效的referredURL' })
          }
          const timeline = new model.timeline({
            mobile,
            content,
            type,
            publishDate: new Date(),
            referredItem: {
              url,
              title: feedItem.title,
              sourceTitle: feedItem.sourceTitle,
            },
          })
          timeline.save()
          .then(() => res.send({ success: true }))
          .catch(error => res.send({ error }))
        })
        .catch(error => res.send({ error }))
      }
      break
    }
    default:
      res.send({ error: '无效的type' })
  }
})

// 点赞/取消赞
router.post('/like', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { timelineID } = req.body

  const queries = [
    model.like.find({ timelineID }),
    model.timeline.findById(timelineID),
    model.user.findOne({ mobile }),
  ]

  Promise.all(queries)
  .then(queryItems => {
    const [ likes, timeline, user ] = queryItems
    if (isEmpty(timeline)) {
      res.send({ error: '未找到timeline' })
    } else {
      const liked = likes.map(like => like.mobile).includes(mobile)
      if (liked) {
        // 取消点赞
        model.like.findOneAndRemove({ timelineID, mobile })
        .then(() => {
          res.send({ success: true })
        })
        .catch(error => res.send)
      } else {
        // 点赞
        const like = new model.like({
          authorMobile: timeline.mobile,
          mobile,
          avatar: user.avatar,
          name: user.name,
          timelineID,
          publishDate: new Date()
        })
        like.save()
        .then(() => res.send({ success: true }))
        .catch(error => res.send({ error }))
      }
    }
  })
  .catch(error => res.send({ error }))
})

// 评论某个timeline
router.post('/comment', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const {
    timelineID,
    content,
    replyMobile,
  } = req.body

  if (isEmpty(content)) {
    return res.send({ error: '评论不可为空' })
  }

  const queries = [
    model.timeline.findById(timelineID),
    model.user.findOne({ mobile }),
  ]
  if (!isEmpty(replyMobile)) {
    queries.push(model.user.findOne({ mobile: replyMobile }))
  }
  Promise.all(queries)
  .then(queryItems => {
    const [ timeline, user, replyUser = {} ] = queryItems
    if (isEmpty(timeline)) {
      res.send({ error: '未找到timeline' })
    } else {
      const comment = new model.comment({
        authorMobile: timeline.mobile,
        mobile,
        name: user.name,
        replyMobile: replyUser.mobile,
        replyName: replyUser.name,
        timelineID,
        content,
        publishDate: new Date(),
      })
      comment.save()
      .then(() => res.send({ success: true }))
      .catch(error => res.send({ error }))
    }
  })
  .catch(error => res.send({ error }))
})

/**
 * 根据用户获取timeline
 */
router.get('/getByUser', tokenValidator, (req, res) => {
  const { mobile: viewerMobile } = req.params
  const { mobile } = req.query

  if (isEmpty(mobile)) {
    return res.send({ error: 'mobile should not be empty' })
  }

  const queries = [
    model.user.findOne({ mobile }),
    model.timeline.find({ mobile }),
    model.comment.find({ authorMobile: mobile }),
    model.like.find({ authorMobile: mobile }),
  ]

  Promise.all(queries)
  .then(queryItems => {
    const [user, timelines, comments, likes] = queryItems

    // comment
    const commentMap = {}
    comments.map(comment => {
      const { timelineID } = comment
      const commentArray = commentMap[timelineID] || []
      commentArray.push(comment)
      commentMap[timelineID] = commentArray
    })

    // like
    const likeMap = {}
    likes.map(like => {
      const { timelineID } = like
      const likeArray = likeMap[timelineID] || []
      likeArray.push(like)
      likeMap[timelineID] = likeArray
    })

    const result = timelines.map(raw => {
      const timeline = raw.toJSON()
      timeline.user = user

      timeline.comments = commentMap[timeline._id] || []

      const likes = likeMap[timeline._id] || []
      timeline.likes = likes
      timeline.liked = likes.map(like => like.mobile).includes(viewerMobile)
      return timeline
    })
    res.send({ result })
  })
  .catch(error => res.send({ error }))
})

export default router