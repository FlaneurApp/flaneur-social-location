/**
 * Cloud Functions HTTP Trigger Mocking
 * These functions are naive and willingly minimal
 * They will be improved as needed
 */

'use strict'

const util = require('util')
const emitter = require('events').EventEmitter

/**
 * Naive mock of Http Express-like request for Cloud Functions
 * @param {string} method REST Method to use
 * @param {object} params Parameters to send
 */
const makeRequest = function makeRequest(method, params = {}) {
  const req = { method }

  if (method === 'GET') {
    req.query = params
  } else {
    req.body = params
  }

  return req
}

/**
 * Naive mock of Http express-like response for Cloud Functions
 * It could be great to reuse the native express response in a clean http-mocking module
 * Note that `mock-express` exists here https://github.com/masotime/mock-express/
 * But doesn't allow method chaining like `res.status().send()`
 *
 * The `tests` function should contain sync or async tests executed after the response ends
 * The response context is accessible from the first argument of the callback
 * The response body is accessible from the second argument of the callback
 *
 * Note: Do NOT call the Mocha callback inside the tests function
 *
 * Examples:
 *  Sync:
 * ```
 *  const res = chai.makeResponse(function(resContext) {
 *    resContext.statusCode.should.equal(200)
 *  })
 * ```
 *
 *  Async:
 * ```
 *  const res = chai.makeResponse(function(resContext) {
 *    asyncFunctionHere()
 *      .then((asyncResult) => {
 *        asyncResult.shoud.not.be.null
 *      })
 *  })
 * ```
 *
 * @param {*} tests A function containing the tests.
 * @param {*} done The Mocha (or other Unit Testing Framework) callback
 */
const makeResponse = function makeResponse(tests, done) {
  if (!(typeof tests === 'function') || !(typeof done === 'function')) {
    throw new Error('#makeResponse: Functions expected for both arguments (tests, done)')
  }

  function ResponseObject() {
    this.statusCode = 0
    this.headersSent = false

    this.redirect = function redirect(statusCode, url) {
      if (!url) {
        url = statusCode
        statusCode = 302
      }

      this.statusCode = statusCode
      return this.end(`Found. Redirecting to ${url}`)
    }

    this.status = function status(statusCode) {
      this.statusCode = statusCode
      return this
    }

    this.send = function send(body) {
      return this.end(body)
    }

    this.write = function write(chunk) {
      this.emit('data', chunk)
    }

    this.end = function end(body) {
      this.headersSent = true
      this.emit('end')

      // In the case of Promise usage in the function calling res.send() or res.end(),
      // any failed assertion in tests() would be catched by the catch block and not by the
      // Unit Testing Framework.
      // So we have to bypass this by catching it before and sending the error to the
      // Unit Testing Framework Callback
      return Promise.resolve()
        .then(() => {
          return tests(this, body)
        })
        .then(() => done())
        .catch(done)
    }
  }

  util.inherits(ResponseObject, emitter)
  return new ResponseObject()
}

module.exports = {
  makeRequest,
  makeResponse
}
