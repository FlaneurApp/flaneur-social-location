'use strict'

// Imports
const querystring = require('querystring')
const request = require('request-promise-native')

const functions = require('firebase-functions')
const instagramLib = require('../lib/instagram')

// Instagram Config
const instagramConfig = require('../config/config.json').instagram

// Instagram paths
const instagramURL = 'https://api.instagram.com'
const oauthPath = 'oauth/authorize/'
const accessTokenPath = 'oauth/access_token'

// Local paths
const cloudFunctionsDomain = 'http://localhost:5000/flaneur-dev/us-central1'
const authFunction = 'instagramAuthorization'

/**
 * Endpoint for Instagram Connection
 * This is necessary to retrieve a token for further use
 *
 * URL:
 *  /instagramConnection
 * Method:
 *  GET
 * URL Params:
 *  None
 * Success Response:
 *  - Code: 302
 *  Redirect: [instagramConnectionURL]
 * Sample Call:
 *  https://<region>-<projectName>.cloudfunctions.net/instagramConnection
 */
const instagramConnection = functions.https.onRequest((req, res) => {
  console.log('------------------------ [instagramConnection] ------------------------') 
  console.log('#[instagramConnection]', { query: req.query, callingIP: req.ip }) 

  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const params = {
    client_id: instagramConfig.clientId,
    scope: instagramConfig.scopes,
    response_type: 'code',
    redirect_uri: `${cloudFunctionsDomain}/${authFunction}`
  }

  return res.redirect(`${instagramURL}/${oauthPath}?${querystring.stringify(params)}`)
})

/**
 * Endpoint for Instagram Authorization
 * This should not be called manually but rather used as a callback for Instagram Authorization
 *
 * URL:
 *  /instagramAuthorization
 * Method:
 *  GET
 * URL Params:
 *  Required:
 *    code=[string] Instagram Authorization Code
 * Success Response:
 *  - Code: 200
 *  Content: [instagramAccessToken]
 * Error Response:
 *  - Code: 500
 *    Reason: Server Error
 * Sample Call:
 *  https://<region>-<projectName>.cloudfunctions.net/instagramAuthorization?code=123456789
 */
const instagramAuthorization = functions.https.onRequest((req, res) => {
  console.log('------------------------ [instagramAuthorization] ------------------------') 
  console.log('#[instagramAuthorization]', { query: req.query, callingIP: req.ip }) 

  if (req.method !== 'GET') {
    return res.status(405).end()
  }
  if (!req.query.code) {
    return res.status(400).send('Invalid arguments.')
  }

  const body = querystring.stringify({
    client_id: instagramConfig.clientId,
    client_secret: instagramConfig.clientSecret,
    code: req.query.code,
    grant_type: 'authorization_code',
    redirect_uri: `${cloudFunctionsDomain}/${authFunction}`
  })
  const postOptions = {
    method: 'POST',
    uri: `${instagramURL}/${accessTokenPath}`,
    body,
    // The instagram API seems to accept only www-form-urlencoded params
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    },
    json: true // Automatically parses the JSON string in the response
  }

  return request(postOptions)
    .then((parsedBody) => {
      return res.status(200).send(parsedBody.access_token)
    })
    .catch((err) => {
      return res.status(500).send(err)
    })
})

/**
 * Endpoint for Instagram Medias retrieval
 * This retrieves all the medias of the current user, all in once or streaming by batch.
 *
 * URL:
 *  /getUserPhotosAPI
 * Method:
 *  GET
 * URL Params:
 *  Required:
 *    token=[string] Instagram Access Token
 *  Optionnal:
 *    maxID=[string] Get photos older that `maxID`. Useful for flow control
 *    batchSize=[integer] Size of the batches. Default to 20
 *    maxItems=[integer] Maximum number of items to retrieve
 *    stream=[boolean] If `true`, write to the response per batch. Else, wait to have all the data
 *                     before sending it to the response
 *    onlyWithLocation=[boolean] If `true`, returns only photos with geolocation data.
 * Success Response:
 *  - Code: 200
 *    Content: [instagramMediaArray]
 * Error Response:
 *  - Code: 500
 *    Reason: Server Error
 * Sample Call:
 *  https://<region>-<projectName>.cloudfunctions.net/getInstagramUserPhotos?token=123456789&batchSize=5&maxItems=50&stream=true
 */
const getInstagramUserPhotos = functions.https.onRequest((req, res) => {
  console.log('------------------------ [getInstagramUserPhotos] ------------------------') 
  console.log('#[getInstagramUserPhotos]', { query: req.query, callingIP: req.ip }) 

  if (req.method !== 'GET') {
    return res.status(405).end()
  }
  if (!req.query.token) {
    return res.status(400).send('No token provided. Please use the connection endpoint to get one.')
  }

  const dest = req.query.stream ? res.write.bind(res) : null

  return instagramLib.getUserPhotos(req.query, dest)
    .then((results) => {
      return res.status(200).end(results)
    })
    .catch((err) => {
      console.error('[#getInstagramPhotos] Err', err)
      return res.status(500).end(err)
    })
})


module.exports = {
  instagramConnection,
  instagramAuthorization,
  getInstagramUserPhotos
}
