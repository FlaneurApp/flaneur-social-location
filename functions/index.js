'use strict'

const functions = require('firebase-functions')
const InstagramAPI = require('./services/instagram')
const instagramLib = require('./lib/instagram')

// List of providers, will be used to collecting info
const socials = {
  instagram: instagramLib.getUserPhotos
}

/**
 * Prepare a Promise for further Promise.all usage
 * @param {*} func
 * @param {*} params
 */
function createTask(func, params) {
  return func(params)
    .catch((err) => {
      // Made because Promise all is used. not to stop processing for other possible social networks
      return Promise.resolve({ error: err })
    })
}

/**
 * Parses the URL parameters.
 * The URL parameters should be in the following format:
 *  `{ social1: '{"options1": "val1, "option2": "val2"...}', social2: ...}`
 * Each social requested should have a stringified options object.
 * This function browses the parameters and parses the options for supported social services
 * @param {*} params
 */
function parseOptions(params) {
  const optionKeys = Object.keys(params)

  // No option to handle
  if (!optionKeys || !optionKeys.length) {
    return null
  }

  // For each social options
  return optionKeys.reduce((acc, key) => {
    // If this social service is supported
    if (socials[key]) {
      try {
        // Try to parse the corresponding options
        acc[key] = JSON.parse(params[key])
      } catch (e) {
        // We may want to use it differently (e.g. pass the token directly as `instagram: token`)
        // In this case, this should be handled here
        console.error(`Error while parsing the options for ${key}`, e)
      }
    }

    return acc
  }, {})
}

const socialLocation = functions.https.onRequest((req, res) => {
  const config = parseOptions(req.query) || {} // general config for future use
  const services = Object.keys(config)
  const tasks = services.map((serviceName) => {
    return createTask(socials[serviceName], config[serviceName])
  })

  // Waiting until all tasks done
  Promise.all(tasks)
    .then((PromisesResult) => {
      const results = {}

      PromisesResult.forEach((currentResult, idx) => {
        const serviceName = services[idx]
        results[serviceName] = currentResult
      })

      return res.status(200).send(results)
    })
    .catch((err) => {
      console.error('Error in collecting history:', err)
      return res.status(500).send(err)
    })
})

exports.socialLocation = socialLocation

// Expose Instagram API endpoints
Object.assign(exports, InstagramAPI)
