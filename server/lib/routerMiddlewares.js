import isEmpty from 'lodash/isEmpty'

import db from './db'
import model from '../model'

const tokenValidator = (req, res, next) => {
  const { token } = req.headers
  model.token.find({ token })
  .then(tokens => {
    if (isEmpty(tokens)) {
      res.send({ error: 'token无效' })
    } else {
      const [tokenInfo] = tokens
      const { mobile, expireDate } = tokenInfo
      if (Date.now() >= expireDate.getTime()) {
        res.send({ error: 'token已过期' })
      } else {
        req.params.mobile = mobile
        next()
      }
    }
  })
  .catch(error => res.send({ error }))
}

export {
  tokenValidator,
}