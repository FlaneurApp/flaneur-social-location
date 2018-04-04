'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const facebookAPI = require('../services/facebook.js')

chai.use(chaiAsPromised)
chai.should()


describe('Facebook API', function() {
  let testToken

  before('Get Test Token', function() {
    return facebookAPI.getAppToken(appID, appSecret)
      .then(appToken => facebookAPI.getTestUserToken(appID, appToken, fbTestUser))
      .then((response) => {
        testToken = response
        console.log(`   Test Token: ${testToken}\n`)
      })
  })

  describe('Locations', function() {
    it('Should return all facebook locations with default request', function() {
      const options = {
        token: testToken
      }
      return facebookAPI.getLocations(options)
        .then((response) => {
          response.should.be.an('array').and.have.lengthOf(15)
          response.forEach((element) => {
            element.should.have.all.keys('id', 'created_time', 'place')
            element.place.should.have.all.keys('id', 'location', 'name')
          })
        })
    })

    it('Should limit the number of results with maxItems option', function() {
      const options = {
        token: testToken,
        maxItems: 9
      }
      return facebookAPI.getLocations(options)
        .then((response) => {
          response.should.be.an('array').and.have.lengthOf(9)
          response.forEach((element) => {
            element.should.have.all.keys('id', 'created_time', 'place')
            element.place.should.have.all.keys('id', 'location', 'name')
          })
        })
    })

    it('Should stream the results when providing the dest argument', function() {
      let chunksCount = 0
      let fullResponseBody = []
      const options = {
        token: testToken,
        batchSize: 3
      }
      const dest = function dest(chunk) {
        chunksCount += 1
        fullResponseBody = fullResponseBody.concat(JSON.parse(chunk))
      }

      return facebookAPI.getLocations(options, dest)
        .then(() => {
          chunksCount.should.equal(5)
          fullResponseBody.should.be.an('array').and.have.lengthOf(15)
          fullResponseBody.forEach((element) => {
            element.should.have.all.keys('id', 'created_time', 'place')
            element.place.should.have.all.keys('id', 'location', 'name')
          })
        })
    })

    it('Should apply the parsing function', function() {
      const options = {
        token: testToken,
        maxItems: 4,
        parser: () => 42
      }
      return facebookAPI.getLocations(options)
        .then((response) => {
          response.should.be.an('array').and.have.lengthOf(4)
          response.forEach((element) => {
            element.should.eq(42)
          })
        })
    })
  })

  describe('Events', function() {
    it('Should return all facebook events with default request', function() {
      const options = {
        token: testToken
      }
      return facebookAPI.getEvents(options)
        .then((response) => {
          response.should.be.an('array').and.have.lengthOf(4)
          response.forEach((element) => {
            element.should.have.all.keys('place', 'start_time', 'name', 'id')
            element.place.should.have.any.keys('name', 'latitude')
          })
        })
    })

    it('Should limit the number of results with maxItems option', function() {
      const options = {
        token: testToken,
        maxItems: 2
      }
      return facebookAPI.getEvents(options)
        .then((response) => {
          response.should.be.an('array').and.have.lengthOf(2)
          response.forEach((element) => {
            element.should.have.all.keys('place', 'start_time', 'name', 'id')
            element.place.should.have.any.keys('name', 'latitude')
          })
        })
    })

    it('Should stream the results when providing the dest argument', function() {
      let chunksCount = 0
      let fullResponseBody = []
      const options = {
        token: testToken,
        batchSize: 1
      }
      const dest = function dest(chunk) {
        chunksCount += 1
        fullResponseBody = fullResponseBody.concat(JSON.parse(chunk))
      }

      return facebookAPI.getEvents(options, dest)
        .then(() => {
          chunksCount.should.equal(4)
          fullResponseBody.should.be.an('array').and.have.lengthOf(4)
          fullResponseBody.forEach((element) => {
            element.should.have.all.keys('place', 'start_time', 'name', 'id')
            element.place.should.have.any.keys('name', 'latitude')
          })
        })
    })

    it('Should apply the parsing function', function() {
      const options = {
        token: testToken,
        parser: () => 42
      }
      return facebookAPI.getEvents(options)
        .then((response) => {
          response.should.be.an('array').and.have.lengthOf(4)
          response.forEach((element) => {
            element.should.eq(42)
          })
        })
    })
  })
})
