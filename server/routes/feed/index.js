import express from 'express'
import path from 'path'
import db from '../../lib/db'

const router = express.Router()

router.get('/overview', (req, res) => {
  const result = [
    {
      id: '7as9asdfasldjlasd8asd88a',
      title: '唐巧的技术博客',
      subtitles: [
        'iOS 移动开发周报 - 第48期iOS分享',
        '小青和他的 RxSwift 课程',
        '谈谈程序员的软技能',
      ],
      link: 'dudu://rss_source?title=唐巧的技术博客&source=http://blog.devtang.com/atom.xml'
    },
    {
      id: '7as9asdfasldjlasd8asd88x',
      title: '唐巧的技术博客2',
      subtitles: [
        'iOS 移动开发周报 - 第48期iOS分享',
        '小青和他的 RxSwift 课程',
        '谈谈程序员的软技能',
      ],
      link: 'dudu://rss_source?title=唐巧的技术博客2&source=http://blog.devtang.com/atom.xml'
    },
    {
      id: '7as9asdfasldjlasd8asd88b',
      title: '唐巧的技术博客3',
      subtitles: [
        'iOS 移动开发周报 - 第48期iOS分享',
        '小青和他的 RxSwift 课程',
        '谈谈程序员的软技能',
      ],
      link: 'dudu://rss_source?title=唐巧的技术博客3&source=http://blog.devtang.com/atom.xml'
    },
  ]
  res.send({
    success: true,
    result,
  })
})

export default router
