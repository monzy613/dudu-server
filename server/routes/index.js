import isEmpty from 'lodash/isEmpty'

import auth from './auth'
import follow from './follow'
import feed from './feed'
import search from './search'

const routeItem = routeDic => {
  const key = Object.keys(routeDic)[0]
  const route = routeDic[key]
  return { key: `/${key}`, route }
}

export default [
  routeItem({ auth }),
  routeItem({ follow }),
  routeItem({ feed }),
  routeItem({ search }),
]
