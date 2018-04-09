'use strict'

const request = require('request-promise-native')

// Paths
const facebookHost = 'https://graph.facebook.com/'
const facebookAPIVersion = 'v2.12'
const getTaggedPlacesURL = '/me/tagged_places'
const getEventsURL = '/me/events'
const getEventsFields = 'place{location, name},start_time,name'
const getAppTokenURL = '/oauth/access_token'
const getTestUserURL = '/accounts/test-users'

/** **************************************** TOKEN UTILS **************************************** */
/**
 * Retrieves an App Token for the Facebook API
 * It can be used for Facebook App configuration or especially retrieving a test user token
 */
function getAppToken(appID, appSecret) {
  const options = {
    uri: `${facebookHost}${facebookAPIVersion}${getAppTokenURL}`,
    qs: {
      client_id: appID,
      client_secret: appSecret,
      grant_type: 'client_credentials'
    }
  }

  return request(options)
    .then((response) => {
      const parsedResponse = JSON.parse(response)
      return parsedResponse.access_token
    })
}

/**
 * Retrieves a Facebook Test User Token
 * @param {*} appToken Your Facebook App Token
 * @param {*} testUserID The test user from whom the token is retrieved
 */
function getTestUserToken(appID, appToken, testUserID) {
  const options = {
    uri: `${facebookHost}${facebookAPIVersion}/${appID}${getTestUserURL}`,
    qs: { access_token: appToken }
  }
  const isTestUser = (currentUser => currentUser.id === testUserID)

  return request(options)
    .then((results) => {
      const users = JSON.parse(results).data
      const testUser = users.find(isTestUser)

      return testUser ? testUser.access_token : null
    })
}

/** *************************************** REQUEST UTILS *************************************** */
/**
 * Request and paginate the results of a Facebook Endpoint
 * @param {*} uri Facebook Endpoint
 * @param {*} qs Query String (request parameters)
 * @param {*} dest Destination. Used for streaming results (can be a response, a file or any output)
 * @param {*} parsingFunc A function to apply to each result
 * @param {*} maxItems Maximum number of items to retrieve
 */
function paginateResults(uri, qs = {}, dest, parsingFunc, maxItems) {
  const options = { uri, qs } // Construction of the request
  let data = [] // Will contain all results
  let count = 0 // Count the number of results

  // If `maxItems` is specified but not `limit` (corresponding to batchSize),
  // assign `maxItems to `limit`
  // It will be useful later when determining how many items to retrieve to satisfy `maxItems`
  if (!options.qs.limit && maxItems) {
    options.qs.limit = maxItems
  }

  // Each call to this function will paginate to the next results
  return (function paginate(next) {
    // Assign the next cursor to the request query string
    options.qs.after = next

    // Determine how many items we should retrieve to satisfy the `maxItems` condition.
    // If the current limit is greater than the number of items to get, compute the new limit
    // to only get the necessary items.
    if (maxItems && (count + options.qs.limit > maxItems)) {
      options.qs.limit = maxItems - count
    }

    // Do the request to the Facebook Endpoint
    return request(options)
      .then((facebookResponse) => {
        if (!facebookResponse) {
          console.error('Empty Response')
          return dest ? 'Empty Response' : data
        }

        const parsedResponse = JSON.parse(facebookResponse)
        let responseData = parsedResponse.data

        // Increment the items count
        count += responseData.length

        // If there is a parsing function, send the items to it
        if (parsingFunc) {
          responseData = responseData.map(parsingFunc)
        }

        // If there is a dest, send the stringified results to it
        if (dest) {
          dest(JSON.stringify(responseData))
        } else {
          // Else concat the results
          data = data.concat(responseData)
        }

        // Continue to the next results if needed
        const getMore = (!maxItems || count < maxItems)
        if (getMore && parsedResponse.paging && parsedResponse.paging.next) {
          return paginate(parsedResponse.paging.cursors.after)
        }

        // If there was a dest, every data has been sent, so just send null
        // Else, send the concatened data
        return dest ? null : data
      })
  }())
}

/** ***************************************** ENDPOINTS ***************************************** */
/**
 * Retrieve the attended Facebook Events for a given token
 * @param {Object} params - Request Query String
 * @param {string} params.token - Facebook User Token
 * @param {string} [params.batchSize] - Items per batch. Optionnal
 * @param {integer} [params.maxItems] - Maximum number of items to retrieve. Optionnal
 * @param {Function} [params.parser] - Function to apply to each item. Optionnal
 * @param {*} dest An optionnal output destination
 */
function getEvents(params = {}, dest) {
  if (!params.token) {
    throw new Error('No access token provided')
  }

  const { token, batchSize, maxItems, parser } = params
  const uri = `${facebookHost}${facebookAPIVersion}${getEventsURL}`
  const queryParams = {
    access_token: token,
    limit: batchSize,
    type: 'attending',
    fields: getEventsFields
  }

  return paginateResults(uri, queryParams, dest, parser, maxItems)
}

/**
 * Retrieve the tagged places for a given token
 * @param {Object} params - Request Query String
 * @param {string} params.token - Facebook User Token
 * @param {string} [params.batchSize] - Items per batch. Optionnal
 * @param {integer} [params.maxItems] - Maximum number of items to retrieve. Optionnal
 * @param {Function} [params.parser] - Function to apply to each item. Optionnal
 * @param {*} dest An optionnal output destination
 */
function getLocations(params = {}, dest) {
  if (!params.token) {
    throw new Error('No access token provided')
  }

  const { token, batchSize, maxItems, parser } = params
  const uri = `${facebookHost}${facebookAPIVersion}${getTaggedPlacesURL}`
  const queryParams = {
    access_token: token,
    limit: batchSize
  }

  return paginateResults(uri, queryParams, dest, parser, maxItems)
}

module.exports = {
  getAppToken,
  getTestUserToken,
  getEvents,
  getLocations
}
