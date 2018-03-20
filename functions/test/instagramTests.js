'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const httpMock = require('./httpMocks')
const instagramLib = require('../lib/instagram')
const instagramAPI = require('../services/instagram.js')

chai.use(chaiAsPromised)
chai.should()

// Note: this token can be expired. In this case, please manually regenerate one with
//       the instagramConnection endpoint

describe('instagram Lib', function() {
  describe('#getUserPhotos', function() {
    it('should return expected photos', function() {
      this.timeout(0)

      let chunksCount = 0
      let fullResponseBody = []
      const params = {
        token: instagramToken,
        stream: true,
        batchSize: 3,
        maxItems: 15,
        maxID: '1403623235451351879_3505645396',
        onlyWithLocation: true
      }
      const dest = function(chunk) {
        chunksCount += 1
        fullResponseBody = fullResponseBody.concat(JSON.parse(chunk))
      }

      return instagramLib.getUserPhotos(params, dest)
        .then(() => {
          chunksCount.should.equal(5)
          fullResponseBody.should.be.an('array').with.lengthOf(12)
          fullResponseBody.forEach((item) => {
            item.should.have.all.keys(['record_id', 'timedate', 'latitude', 'longitude', 'info', 'usersTagged'])
          })
          return true
        }).should.eventually.be.true
    })
  })
})

describe('instagramService', function() {
  describe('Connection', function() {
    it('should redirect to instagram', function(done) {
      const req = httpMock.makeRequest('GET')
      const testsCallback = function(resContext, resMessage) {
        resMessage.should.include('Found. Redirecting to https://api.instagram.com/oauth/authorize/?client_id=')
        resContext.statusCode.should.equal(302)
      }
      const res = httpMock.makeResponse(testsCallback, done)

      instagramAPI.instagramConnection(req, res)
    })
  })

  describe('getInstagramUserPhotos', function() {
    it('should return all photos by default', function(done) {
      const req = httpMock.makeRequest('GET', { token: instagramToken })
      const testsCallback = function(resContext, resMessage) {
        resMessage.should.be.an('array').with.lengthOf.at.least(20)
        resMessage[0].should.include.all.keys('record_id', 'timedate')
        resContext.statusCode.should.equal(200)
      }
      const res = httpMock.makeResponse(testsCallback, done)

      instagramAPI.getInstagramUserPhotos(req, res)
    })

    it('should handle options', function(done) {
      this.timeout(0)

      let chunksCount = 0
      let fullResponseBody = []
      const params = {
        token: instagramToken,
        stream: true,
        batchSize: 3,
        maxItems: 15,
        maxID: '1403623235451351879_3505645396',
        onlyWithLocation: true
      }
      const req = httpMock.makeRequest('GET', params)
      const testsCallback = function(resContext, resMessage) {
        chunksCount.should.equal(5)
        resMessage.should.equal('Done')
        fullResponseBody.should.be.an('array').with.lengthOf(12)
        fullResponseBody.forEach((item) => {
          item.should.have.all.keys(['record_id', 'timedate', 'latitude', 'longitude', 'info', 'usersTagged'])
        })
        resContext.statusCode.should.equal(200)
      }
      const res = httpMock.makeResponse(testsCallback, done)

      res.on('data', (data) => {
        chunksCount += 1
        fullResponseBody = fullResponseBody.concat(JSON.parse(data))
      })

      instagramAPI.getInstagramUserPhotos(req, res)
    })
  })
})
