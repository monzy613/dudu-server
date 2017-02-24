import mongoose from 'mongoose'
import { mongoCfg } from '../config'

mongoose.Promise = global.Promise

const options = {
  user: mongoCfg.user,
  pass: mongoCfg.pass,
}

const db = mongoose.connect(mongoCfg.uri, options)
db.connection.on('error', (err) => {
  console.error('db connect failed: ' + err)
})

db.connection.on('open', () => {
  console.log('db connected success to ' + mongoCfg.uri)
})

export default db
