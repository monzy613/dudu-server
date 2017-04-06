import express from 'express'
import path from 'path'
import feedparser from 'feedparser-promised'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'
import { tokenValidator } from '../../lib/routerMiddlewares'
import model from '../../model'

const router = express.Router()

router.post('/subscribe', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { source } = req.body
  if (isEmpty(source)) {
    return res.send({ error: '需要feed source' })
  }
  model.userSubscribe.findOne({ mobile })
  .then(userSubscribeInfo => {
    let isNewSubscribeInfo = false
    if (isEmpty(userSubscribeInfo)) {
      isNewSubscribeInfo = true
    } else {
      const { feeds } = userSubscribeInfo
      if (feeds.includes(source)) {
        return res.send({ error: '无法重复订阅' })
      }
    }

    model.feed.findOne({ source })
    .then(feed => {
      // 数据库是否有缓存
      const hasCache = !isEmpty(feed)
      if (hasCache) {
        if (isNewSubscribeInfo) {
          const userSubscribe = new model.userSubscribe({ mobile, feeds: [ source ] })
          userSubscribe.save().then(() => res.send({ result: { [source]: feed } }))
        } else {
          const { feeds } = userSubscribeInfo
          const newFeedsSet = new Set(feeds)
          newFeedsSet.add(source)
          const newFeeds = Array.from(newFeedsSet)
          model.userSubscribe.findOneAndUpdate({ mobile }, { feeds: newFeeds })
          .then(() => res.send({ result: { [source]: feed } }))
          .catch(error => res.send({ error }))
        }
      }

      feedparser.parse(source)
      .then(items => {
        const [randItem] = items
        const { meta } = randItem
        const {
          title,
          description,
          link,
        } = meta

        const sourceTitle = title

        const itemArray = items.map(item => {
          const {
            title,
            description,
            date,
            pubdate,
            pubDate,
            link: url,
            categories,
          } = item
          const publishDate = date || pubdate || pubDate
          return {
            sourceTitle,
            url,
            source,
            link: `dudu://rss_detail?title=${title}&source=${source}&url=${url}`,
            categories,
            publishDate,
            title,
            description,
          }
        })

        const itemOverviews = itemArray.map(item => {
          return {
            url: item.url,
            title: item.title,
            link: item.link,
            source,
          }
        })
        const feed = {
          source,
          title,
          description,
          link: `dudu://rss_source?title=${title}&source=${source}`,
          itemOverviews,
        }
        const result = { [source]: feed }
        if (!hasCache) {
          // 更新user-feedSource collection
          if (isNewSubscribeInfo) {
            const userSubscribe = new model.userSubscribe({ mobile, feeds: [ source ] })
            userSubscribe.save().then(() => res.send({ result }))
          } else {
            const { feeds } = userSubscribeInfo
            const newFeedsSet = new Set(feeds)
            newFeedsSet.add(source)
            const newFeeds = Array.from(newFeedsSet)
            model.userSubscribe.findOneAndUpdate({ mobile }, { feeds: newFeeds })
            .then(() => res.send({ result }))
            .catch(error => res.send(error))
          }
        }

        // 更新一下feed概览
        model.feed
        .findOneAndUpdate({ source }, feed, { upsert: true })
        .then(() => {
          // 更新一下feeditems
          model.feedItem
          .remove({ url: { $in: itemArray.map(item => item.url) } })
          .then(() => {
            model.feedItem
            .insertMany(itemArray)
            .then(() => {
              // inserted items into feeditems collection
            })
            .catch(error => console.warn(error))
          })
          .catch(error => console.warn(error))
        })
        .catch(error => console.warn(error))
      })
      .catch(error => res.send({ error: '解析xml出错' }))
    })
    .catch(error => res.send({ error }))
  })
  .catch(error => res.send({ error }))
})

router.post('/unsubscribe', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { source } = req.body
  if (isEmpty(source)) {
    return res.send({ error: '需要feed source' })
  }
  model.userSubscribe.findOne({ mobile })
  .then(userSubscribe => {
    if (isEmpty(userSubscribe)) {
      res.send({ error: '你还没有任何订阅' })
    } else {
      const { feeds } = userSubscribe
      if (!feeds.includes(source)) {
        res.send({ error: `没有订阅${source}` })
      } else {
        const newFeeds = feeds.filter(feedSource => feedSource !== source)
        model.userSubscribe.findOneAndUpdate({ mobile }, { feeds: newFeeds })
        .then(() => res.send({ success: true }))
        .catch(error => res.send({ error }))
      }
    }
  })
  .catch(error => res.send({ error }))
})

router.get('/getSubscribesByUser/:mobile', (req, res) => {
  const { mobile } = req.params
  model.userSubscribe.findOne({ mobile })
  .then(userSubscribe => {
    const feedSources = (userSubscribe && userSubscribe.feeds) || []
    if (isEmpty(feedSources)) {
      res.send({ result: {} })
    } else {
      model.feed.find({ source: { $in: feedSources } })
      .then(feeds => {
        const result = {}
        for (let i = 0; i < feeds.length; i++) {
          const { source } = feeds[i]
          result[source] = feeds[i]
        }
        res.send({ result })
      })
      .catch(error => res.send({ error }))
    }
  })
  .catch(error => res.send({ error }))
})

router.get('/getFeedBySource', (req, res) => {
  const { source } = req.query
  if (isEmpty(source)) {
    res.send({ error: '未找到指定订阅源' })
  }
  model.feed.findOne({ source })
  .then(feed => {
    if (isEmpty(feed)) {
      res.send({ error: '未找到指定订阅源' })
    } else {
      res.send({ result: { [source]: feed } })
    }
  })
  .catch(error => res.send({ error }))
})

router.get('/getFeedItem', (req, res) => {
  const { url } = req.query
  if (isEmpty(url)) {
    return res.send({ error: '未找到指定文章' })
  }
  model.feedItem.findOne({ url })
  .then(feedItem => {
    if (isEmpty(feedItem)) {
      res.send({ error: '未找到指定文章' })
    } else {
      res.send({ result: feedItem })
    }
  })
  .catch(error => res.send({ error }))
})

export default router
