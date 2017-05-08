import { addPath } from 'app-module-path'
addPath(__dirname)

import express from 'express'
import routes from './routes'
import methodOverride from 'method-override'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import session from 'express-session'

import { sessionSecret } from './config'

const app = express()

const PORT = process.env.PORT || 3000

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // intercept OPTIONS method
  if ('OPTIONS' === req.method) {
    res.send(200)
  } else {
    next()
  }
}

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  store: new session.MemoryStore()
}))

app.use(methodOverride())
app.use(allowCrossDomain)
for (let i in routes) {
  const item = routes[i]
  app.use(`/api${item.key}`, item.route)
}

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`)
})

// for testing
export default app
