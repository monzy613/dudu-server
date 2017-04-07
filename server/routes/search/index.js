import express from 'express'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'
import model from '../../model'
import { tokenValidator } from '../../lib/routerMiddlewares'
import { formatedUserInfo } from '../../lib/util'

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

  const feedQuery = model.feed.find({ title: { '$regex': keyword } })
  const itemQuery = model.feedItem.find({ title: { '$regex': keyword } })
  const userQuery = model.user.find({ name: { '$regex': keyword }, mobile: { $ne: mobile } })
  const followingQuery = model.follow.find({ follower: mobile })

  switch (type) {
    case SEARCH_TYPE_DEFAULT: {
      const queries = [ feedQuery, itemQuery, userQuery, followingQuery ]

      Promise.all(queries)
      .then(queryResults => {
        const [ feeds, items, users, followingResult ] = queryResults
        const followingMobiles = followingResult.map(result => result.following)

        if (isEmpty(feeds)) {
          const result = []
          items.map(item => result.push({ type: SEARCH_TYPE_ITEM, item }))
          users.map(user => result.push({
            type: SEARCH_TYPE_USER,
            user: formatedUserInfo({ user, following: followingMobiles.includes(user.mobile) })
          }))
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
            users.map(user => result.push({
              type: SEARCH_TYPE_USER,
              user: formatedUserInfo({ user, following: followingMobiles.includes(user.mobile) })
            }))
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
        feedQuery,
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
      itemQuery
      .then(feedItems => res.send({ result: feedItems.map(item => ({ type: SEARCH_TYPE_ITEM, item })) }))
      .catch(error => res.send({ error }))
      break
    }
    case SEARCH_TYPE_USER: {
      Promise.all([ userQuery, followingQuery ])
      .then(queryItems => {
        const [ users, followingResult ] = queryItems
        const followingMobiles = followingResult.map(result => result.following)
        res.send({ result: users.map(user => ({
          type: SEARCH_TYPE_USER,
          user: formatedUserInfo({ user, following: followingMobiles.includes(user.mobile) })
        })) })
      })
      .catch(error => res.send({ error }))
      break
    }
    default:
      res.send({ error: 'undefined search type' })
  }
})

export default router