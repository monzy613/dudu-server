import express from 'express'
import isEmpty from 'lodash/isEmpty'

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
        comments: [],
        usersLiked: [],
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
            comments: [],
            usersLiked: [],
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
            comments: [],
            usersLiked: [],
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
/**
 * {
	"timelineID": "xxxx",
	"like": true,
}
 */
})

// 评论某个timeline
router.post('/comment', tokenValidator, (req, res) => {
/**
 * {
	"timelineID": "xxxx",
	"content": "xxxx"
}
 */
})

/**
 * 根据用户获取timeline
 */
router.get('/getTimelineByUser', tokenValidator, (req, res) => {
  const { fromMobile } = req.params
  const { mobile } = req.query

  if (isEmpty(mobile)) {
    return res.send({ error: 'mobile should not be empty' })
  }

  const queries = [
    model.user.find({ model }),
    model.timeline.find({ mobile }),
    model.comment.find({ timelineUserMobile: mobile })
  ]

  Promise.all(queries)
  .then(queryItems => {
    const [users, timelines, comments] = queryItems
    const [user] = users
    const commentMap = {}
    comments.map(comment => {
      const { timelineID } = comment
      const commentArray = commentMap[timelineID] || []
      commentArray.push(comment)
    })

    const result = timelines.map(raw => {
      const timeline = raw.toJSON()
      timeline.user = user
      timeline.liked = timeline.usersLiked.map(user => user.mobile).includes(fromMobile)
      timeline.comments = commentMap[timeline._id] || []
      return timeline
    })
    res.send({ result })
  })
  .catch(error => res.send({ error }))
})

export default router