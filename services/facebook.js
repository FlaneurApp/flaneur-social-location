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
 * Parse a Facebook response
 * If `withCover` is specified, it merges the cover source url into the locations object
 * @param {*} response The Facebook Response
 * @param {*} withCover True if this is a batch requests including Covers
 */
function parseFacebookResponse(response, withCover) {
  const responseJSON = JSON.parse(response)

  // No cover to merge, just return the parsed reponse
  if (!withCover) {
    return responseJSON
  }

  let places
  let covers
  try {
    // Try to parse the places and covers
    places = JSON.parse(responseJSON[0].body)
    covers = JSON.parse(responseJSON[1].body)
  } catch (e) {
    // Something went wrong
  }

  // No places to handle
  if (!places) {
    return []
  }
  // If the places request returned an error, stop it there
  if (places.error) {
    throw places.error
  }
  // No covers, just return the places
  if (!covers) {
    return places
  }
  // If the covers request returned an error, log it but continue
  if (covers.error) {
    console.error('[Facebook Covers]', covers.error.message)
  }

  // Merge and return the covers in the places
  return {
    paging: places.paging,
    data: places.data.map((place) => {
      const placeID = place.place.id
      const cover = (covers[placeID] && covers[placeID].cover && covers[placeID].cover.source)
      return Object.assign(place, { cover: cover || null })
    })
  }
}

/**
 * Constructs a relative URL with parameters for batch requests
 * @param {*} uri The Facebook Endpoint
 * @param {*} params The parameters
 */
function constructRelativeURI(uri, params) {
  // Browses the parameters
  return Object.keys(params).reduce((acc, param) => {
    if (!params[param]) {
      return acc
    }

    // Concat the param to the uri
    return `${acc}${acc === uri ? '?' : '&'}${param}=${params[param]}`
  }, uri)
}

/**
 * Constructs the Facebook request.
 * If `withCover` is specified, it constructs a batch request.
 * @param {*} uri The Facebook endpoint
 * @param {*} params The parameters
 * @param {*} withCover True if covers url should be included
 */
function constructRequest(uri, params, withCover) {
  if (!withCover) {
    // No cover to fetch, just return a simple GET object
    return {
      uri: `${facebookHost}${facebookAPIVersion}${uri}`,
      qs: params
    }
  }

  // Else we need to construct a Facebook Batch Request
  // See https://developers.facebook.com/docs/graph-api/making-multiple-requests#simple
  return {
    uri: facebookHost,
    method: 'POST',
    form: {
      access_token: params.access_token,
      include_headers: false, // We don't want to include the headers for a smaller response
      batch: JSON.stringify([{
        method: 'GET',
        name: 'locations',
        relative_url: constructRelativeURI(uri, params),
        // We need to set it to false to get theses results
        // See https://developers.facebook.com/docs/graph-api/making-multiple-requests#operations
        omit_response_on_success: false
      }, {
        method: 'GET',
        name: 'covers',
        // We use the results of the previous request to get the cover URL for each location page
        relative_url: '?ids={result=locations:$.data.*.place.id}&fields=cover{source}'
      }])
    }
  }
}

/**
 * Request and paginate the results of a Facebook Endpoint
 * @param {*} uri Facebook Endpoint
 * @param {*} qs Query String (request parameters)
 * @param {*} withCover Include the cover photo URL (if available)
 * @param {*} dest Destination. Used for streaming results (can be a response, a file or any output)
 * @param {*} parsingFunc A function to apply to each result
 * @param {*} maxItems Maximum number of items to retrieve
 */
function paginateResults(uri, qs = {}, withCover, dest, parsingFunc, maxItems) {
  let data = [] // Will contain all results
  let count = 0 // Count the number of results
  const options = qs

  // If `maxItems` is specified but not `limit` (corresponding to batchSize),
  // assign `maxItems to `limit`
  // It will be useful later when determining how many items to retrieve to satisfy `maxItems`
  if (!qs.limit && maxItems) {
    options.limit = maxItems
  }

  // Each call to this function will paginate to the next results
  return (function paginate(next) {
    // Assign the next cursor to the request query string
    if (next) {
      options.after = next
    }

    // Determine how many items we should retrieve to satisfy the `maxItems` condition.
    // If the current limit is greater than the number of items to get, compute the new limit
    // to only get the necessary items.
    if (maxItems && (count + options.limit > maxItems)) {
      options.limit = maxItems - count
    }

    // Construction of the request
    const req = constructRequest(uri, options, withCover)

    // Do the request to the Facebook Endpoint
    return request(req)
      .then((facebookResponse) => {
        if (!facebookResponse) {
          console.error('Empty Response')
          return dest ? 'Empty Response' : data
        }

        // Parse the response
        const parsedResponse = parseFacebookResponse(facebookResponse, withCover)
        let responseData = parsedResponse.data

        // Increment the items count
        count += responseData.length

        // If there is a parsing function, send the items to it
        if (parsingFunc) {
          responseData = responseData.map(parsingFunc)
        }

        if (responseData) {
          // If there is a dest, send the stringified results to it
          if (dest) {
            dest(JSON.stringify(responseData))
          } else {
            // Else concat the results
            data = data.concat(responseData)
          }
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
 * @param {boolean} [params.withCover] - Include the cover photo URL. Optionnal
 * @param {integer} [params.maxItems] - Maximum number of items to retrieve. Optionnal
 * @param {Function} [params.parser] - Function to apply to each item. Optionnal
 * @param {*} dest An optionnal output destination
 */
function getEvents(params = {}, dest) {
  if (!params.token) {
    throw new Error('No access token provided')
  }

  const { token, batchSize, withCover, maxItems, parser } = params
  const uri = getEventsURL
  const queryParams = {
    access_token: token,
    limit: batchSize,
    type: 'attending',
    fields: getEventsFields
  }

  return paginateResults(uri, queryParams, withCover, dest, parser, maxItems)
}

/**
 * Retrieve the tagged places for a given token
 * @param {Object} params - Request Query String
 * @param {string} params.token - Facebook User Token
 * @param {string} [params.batchSize] - Items per batch. Optionnal
 * @param {boolean} [params.withCover] - Include the cover photo URL. Optionnal
 * @param {integer} [params.maxItems] - Maximum number of items to retrieve. Optionnal
 * @param {Function} [params.parser] - Function to apply to each item. Optionnal
 * @param {*} dest An optionnal output destination
 */
function getLocations(params = {}, dest) {
  if (!params.token) {
    throw new Error('No access token provided')
  }

  const { token, batchSize, withCover, maxItems, parser } = params
  const uri = getTaggedPlacesURL
  const queryParams = {
    access_token: token,
    limit: batchSize
  }

  return paginateResults(uri, queryParams, withCover, dest, parser, maxItems)
}

module.exports = {
  getAppToken,
  getTestUserToken,
  getEvents,
  getLocations
}
