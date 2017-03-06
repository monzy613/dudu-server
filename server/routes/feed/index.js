import express from 'express'
import path from 'path'
import feedparser from 'feedparser-promised'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'
import { tokenValidator } from '../../lib/routerMiddlewares'
import model from '../../model'

const router = express.Router()

const feedItemFormatter = item => {
  const {
    title,
    description,
    date,
    pubdate,
    pubDate,
    link,
    categories,
  } = item
  const publishDate = date || pubdate || pubDate
  return {
    title,
    description,
    publishDate,
    link,
    categories,
  }
}

router.post('/subscribe', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { source } = req.body
  if (isEmpty(source)) {
    return res.send({ error: '需要feed source' })
  }
  model.userSubscribe.find({ mobile })
  .then(docs => {
    let isNewSubscribeInfo = false
    if (isEmpty(docs)) {
      isNewSubscribeInfo = true
    } else {
      const [userSubscribeInfo] = docs
      const { feeds } = userSubscribeInfo
      if (feeds.includes(source)) {
        return res.send({ error: '无法重复订阅' })
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
      const result = {
        [source]: {
          source,
          title,
          description,
          link,
          items: items.map(feedItemFormatter),
        }
      }
      if (isNewSubscribeInfo) {
        const userSubscribe = new model.userSubscribe({ mobile, feeds: [ source ] })
        userSubscribe.save().then(() => res.send({ result }))
      } else {
        const [userSubscribeInfo] = docs
        const { feeds } = userSubscribeInfo
        const newFeedsSet = new Set(feeds)
        newFeedsSet.add(source)
        const newFeeds = Array.from(newFeedsSet)
        model.userSubscribe.findOneAndUpdate({ mobile }, { feeds: newFeeds })
        .then(docs => res.send({ result }))
        .catch(error => res.send(error))
      }
    })
    .catch(error => res.send({ error: '解析xml出错' }))
  })
  .catch(error => res.send({ error }))
})

router.delete('/unsubscribe', tokenValidator, (req, res) => {
  const { mobile } = req.params
  const { source } = req.body
  if (isEmpty(source)) {
    return res.send({ error: '需要feed source' })
  }
  model.userSubscribe.find({ mobile })
  .then(docs => {
    if (isEmpty(docs)) {
      res.send({ error: '你还没有任何订阅' })
    } else {
      const [userSubscribeInfo] = docs
      const { feeds } = userSubscribeInfo
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

router.get('/overview', (req, res) => {
  const result = {}
  for (let i = 0; i < 5; i++) {
    result[`http://blog.devtang${i}.com/atom.xml`] = {
      source: `http://blog.devtang${i}.com/atom.xml`,
      title: `唐巧的技术博客${i}`,
      subtitles: [
        `iOS 移动开发周报 - 第${i}期iOS分享`,
        '小青和他的 RxSwift 课程课程课程课程课程课程课程课程课程',
        '谈谈程序员的软技能',
      ],
      link: `dudu://rss_source?title=唐巧的技术博客${i}&source=http://blog.devtang${i}.com/atom.xml`
    }
  }
  res.send({
    success: true,
    result,
  })
})

router.get('/getBySource', (req, res) => {
  const { authorization: token } = req.headers
  const { source } = req.query
  const result = {}
  for (let i = 0; i < 15; i++) {
    const id = `http://blog.devtang.com/atom.xml${i}`
    result[id] =  {
        id, // 这条文章的id
        source, // 这个feed的url
        read: Math.floor(Math.random() * 10) % 2 === 0,
        bookmark: Math.floor(Math.random() * 10) % 2 === 0,
        title: `《管理的实践》读书心得${i}`,
        publishDate: '2017-02-23T14:32:26.000Z',
        link: 'http://blog.devtang.com/2017/02/23/the-practice-of-management-by-drucker/',
        content: '<p>距离上一次自己在 App Store 发布个人 app 已经过去了两年多了。这段时间里把精力主要都放在了公司项目和继续进一步的学习中，倒也在日常工作和出书等方面取得了一些进展。个人 app 这块近两年虽然有写一些便捷的效率类应用，但是几次审核都被 Apple 无情拒掉以后，也就安心弄成自用的小工具了。看着自己逐渐发霉的开发者证书，果然觉得还是找时间倒腾点什么比较好。于是就有了现在想要介绍给大家的这个工具，<a href="https://mailmeapp.com">Mail Me</a> - 一个可以帮助你快速给自己发送邮件的小 app。</p>'
      }
  }
  res.send({
    success: true,
    result: {
      [source]: result
    }
  })
})

export default router
