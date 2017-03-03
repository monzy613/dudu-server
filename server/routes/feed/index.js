import express from 'express'
import path from 'path'
import db from '../../lib/db'

const router = express.Router()

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
