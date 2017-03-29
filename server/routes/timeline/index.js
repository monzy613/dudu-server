import express from 'express'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'
import model from '../../model'
import { tokenValidator } from '../../lib/routerMiddlewares'

const router = express.Router()

// 发布timeline
router.post('/timeline/postTimeline', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const {
    content,
    referredURL,
  } = req.body
  if (isEmpty(content) && isEmpty(referredURL)) {
    return res.send({ error: '请勿发空状态' })
  }

  if (isEmpty(referredURL)) {
    const timeline = new model.timeline({
      mobile,
      content,
      publishDate: new Date(),
      referredItem: undefined,
      comments: [],
      usersLiked: [],
    })

    timeline.save()
    .then(() => res.send({ success: true }))
    .catch(error => res.send({ error }))
  } else {
    model.feedItem.find({ url: referredURL })
    .then(feedItems => {
      const [feedItem] = feedItems
      if (isEmpty(feedItem)) {
        return res.send({ error: '无效的referredURL' })
      }
      const timeline = new model.timeline({
        mobile,
        content,
        publishDate: new Date(),
        referredItem: {
          url: referredURL,
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
})

// 点赞/取消赞
router.post('/timeline/like', tokenValidator, (req, res) => {
/**
 * {
	"timelineID": "xxxx",
	"like": true,
}
 */
})

// 评论某个timeline
router.post('/timeline/comment', tokenValidator, (req, res) => {
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
router.get('/timeline/getTimelineByUser', tokenValidator, (req, res) => {
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