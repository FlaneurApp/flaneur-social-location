const querystring = require('querystring')
const util = require('util')
const bluebird = require('bluebird')
const request = bluebird.promisifyAll(require('request'))
const helpers = require('./helpers.js')

const tokenPattern = '?access_token=%s'
const apiBaseURL = 'https://api.instagram.com/v1'
const accessTokenUri = 'https://api.instagram.com/oauth/access_token'
const authorizationUri = 'https://api.instagram.com/oauth/authorize/'
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

instagramHelper.loginUrl = function (config, callbackUrl) {
  var params = {
    'client_id': config.clientId,
    'redirect_uri': callbackUrl,
    'response_type': 'code',
    'scope': config.scopes
  }

  return authorizationUri + '?' + querystring.stringify(params)
}

instagramHelper.callback = function (config, req) {
  var callbackUrl = helpers.requestUrl(req)
  var limiter = '?'
  for (var param in req.query) {
    if (param !== 'code') {
      callbackUrl += limiter + param + '=' + req.query[param]
      limiter = '&'
    }
  }

  var data = {
    'client_id': config.clientId,
    'client_secret': config.clientSecret,
    'grant_type': 'authorization_code',
    'redirect_uri': callbackUrl,
    'code': req.query.code
  }

  return request.postAsync(accessTokenUri, { formData: data, headers: { 'Content-Type': 'multipart/form-data' } })
    .then((resp) => {
      var result = JSON.parse(resp.body)
      if (result && result.access_token) {
        var instagramUser = result.user
        instagramUser.access_token = result.access_token
        return instagramUser
      } else {
        Promise.reject(new Error('Instagram: Faild to login.'))
      }
    })
}

module.exports = instagramHelper
