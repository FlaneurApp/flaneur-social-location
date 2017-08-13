const querystring = require('querystring')
const util = require('util')
const bluebird = require('bluebird')
const request = bluebird.promisifyAll(require('request'))

const tokenPattern = '?access_token=%s'
const apiBaseURL = 'https://api.instagram.com/v1'
const recent = '/users/%s/media/recent'

var instagramHelper = {}
instagramHelper.getUserRecent = function (token, user, options) {
  if (!user) user = 'self'
  var url = apiBaseURL
  url += util.format(recent, user)
  url += util.format(tokenPattern, token)
  if (options) {
    url += '&'
    url += querystring.stringify(options)
  }
  return request.getAsync(url)
        .then((res) => {
          var obj
          try {
            obj = JSON.parse(res.body)
          } catch (ex) {
            console.error('Error parsing instagran mesponse:', ex)
            obj = null
          }
          return obj
        })
}

module.exports = instagramHelper
