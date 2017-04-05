const URL_SCHEME = 'dudu'

const itemDeeplink = ({ title, url }) => `dudu://rss_detail?title=${title}&url=${url}`
const feedDeeplink = ({ title, source }) => `dudu://rss_source?title=${title}&source=${source}`

export {
  itemDeeplink,
  feedDeeplink,
}