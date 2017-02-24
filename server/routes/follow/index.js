import express from 'express'
import path from 'path'
import db from '../../lib/db'

const router = express.Router()

router.get('/', (req, res) => {
  res.send('get follow/')
})

export default router
