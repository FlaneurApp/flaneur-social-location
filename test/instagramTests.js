'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const instagramAPI = require('../services/instagram.js')
const config = require('./config.json')

chai.use(chaiAsPromised)
chai.should()

const instagramToken = config.instagramToken

describe('instagram API', function() {
  before(function() {
    console.log(`   Test Token: ${instagramToken}\n`)
  })

  describe('#getUserPhotos', function() {
    it('should return all photos by default', function() {
      const params = {
        token: instagramToken
      }

      return instagramAPI.getUserPhotos(params)
        .then((response) => {
          let withLocation = 0

          response.should.be.an('array').with.lengthOf(20)
          response.forEach((item) => {
            item.should.include.all.keys(['record_id', 'timedate', 'images', 'usersTagged'])
            if (item.info) {
              withLocation += 1
              item.should.include.all.keys(['latitude', 'longitude', 'info'])
            }
          })

          withLocation.should.equal(17)
        })
    })

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

      return instagramAPI.getUserPhotos(params, dest)
        .then(() => {
          chunksCount.should.equal(5)
          fullResponseBody.should.be.an('array').with.lengthOf(12)
          fullResponseBody.forEach((item) => {
            item.should.have.all.keys(['record_id', 'timedate', 'images', 'latitude', 'longitude', 'info', 'usersTagged'])
          })
          return true
        }).should.eventually.be.true
    })
  })
})
