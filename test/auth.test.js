import chai from 'chai'
import chaiHttp from 'chai-http'
import isEmpty from 'lodash/isEmpty'

import server from '../server'

const should = chai.should()

chai.use(chaiHttp)

describe('/POST api/auth/login', () => {
  beforeEach(() => {
    // you can remove all the items in the database here
  })

  it('login success', done => {
    chai.request(server)
    .post('/api/auth/login')
    .send({ mobile: '15316699712', password: '111111' })
    .end((err, res) => {
      res.should.have.status(200)
      const body = res.body
      const { result } = body
      if (isEmpty(result)) {
        res.body.should.have.property('error')
        done()
      } else {
        result.should.have.property('user')
        result.should.have.property('token')
        done()
      }
    })
  })

  it('getUser success', done => {
    chai.request(server)
    .get('/api/auth/getUser')
    .query({ mobile: '15316699712' })
    .end((err, res) => {
      res.should.have.status(200)
      const body = res.body
      const { result } = body
      if (isEmpty(result)) {
        res.body.should.have.property('error')
        done()
      } else {
        res.body.should.have.property('result')
        done()
      }
    })
  })
})
