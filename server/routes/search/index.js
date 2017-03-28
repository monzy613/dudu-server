import express from 'express'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'
import model from '../../model'
import { tokenValidator } from '../../lib/routerMiddlewares'

const router = express.Router()

const SEARCH_TYPE_DEFAULT = 'default'
const SEARCH_TYPE_FEED = 'feed'
const SEARCH_TYPE_ITEM = 'item'
const SEARCH_TYPE_USER = 'user'

router.get('/', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const {
    keyword: originKeyword,
    type = SEARCH_TYPE_DEFAULT,
  } = req.query
  const keyword = originKeyword && originKeyword.trim() || ''
  if (isEmpty(keyword)) {
    return res.send({ result: [] })
  }

  switch (type) {
    case SEARCH_TYPE_DEFAULT: {
      const queries = [
        model.feed.find({ title: { '$regex': keyword } }),
        model.feedItem.find({ title: { '$regex': keyword } }),
        model.user.find({ name: { '$regex': keyword } })
      ]

      Promise.all(queries)
      .then(queryResults => {
        const [feeds, items, users] = queryResults

        if (isEmpty(feeds)) {
          const result = []
          items.map(item => result.push({ type: SEARCH_TYPE_ITEM, item }))
          users.map(user => result.push({ type: SEARCH_TYPE_USER, user }))
          res.send({ result })
        } else {
          // 结果里有feed
          model.userSubscribe.find({ mobile })
          .then(userSubscribes => {
            const [userSubscribe] = userSubscribes

            const result = []

            feeds.map(feedDoc => {
              const feed = feedDoc.toJSON()
              if (isEmpty(userSubscribe)) {
                feed.subscribed = false
              } else {
                feed.subscribed = userSubscribe.feeds.includes(feedDoc.source)
              }
              result.push({ type: SEARCH_TYPE_FEED, feed })
            })
            items.map(item => result.push({ type: SEARCH_TYPE_ITEM, item }))
            users.map(user => result.push({ type: SEARCH_TYPE_USER, user }))
            res.send({ result })
          })
          .catch(error => res.send({ error }))
        }
      })
      .catch(error => res.send({ error }))
      break
    }
    case SEARCH_TYPE_FEED: {
      const queries = [
        model.feed.find({ title: { '$regex': keyword } }),
        model.userSubscribe.find({ mobile }),
      ]

      Promise.all(queries)
      .then(queryItems => {
        const [feeds, userSubscribes] = queryItems
        const [userSubscribe] = userSubscribes

        res.send({
          result: feeds.map(feedDoc => {
            const feed = feedDoc.toJSON()
            if (isEmpty(userSubscribe)) {
              feed.subscribed = false
            } else {
              feed.subscribed = userSubscribe.feeds.includes(feedDoc.source)
            }
            return { type: SEARCH_TYPE_FEED, feed }
          })
        })
      })
      .catch(error => res.send({ error }))
      break
    }
    case SEARCH_TYPE_ITEM: {
      model.feedItem.find({ title: { '$regex': keyword } })
      .then(feedItems => res.send({ result: feedItems.map(item => ({ type: SEARCH_TYPE_ITEM, item })) }))
      .catch(error => res.send({ error }))
      break
    }
    case SEARCH_TYPE_USER: {
      model.user.find({ name: { '$regex': keyword } })
      .then(users => res.send({ result: users.map(user => ({ type: SEARCH_TYPE_USER, user })) }))
      .catch(error => res.send({ error }))
      break
    }
    default:
      res.send({ error: 'undefined search type' })
  }
})

export default router