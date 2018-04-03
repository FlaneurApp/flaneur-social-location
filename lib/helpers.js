'use strict'

const path = require('path')

module.exports = {
  requestUrl(req, join) {
    const end = req.originalUrl.indexOf('?')
    let url = req.originalUrl

    if (end > -1) {
      url = url.substring(0, end)
    }
    if (join) {
      url = path.join(url, join)
    }
    return `${req.protocol}://${req.headers.host}${url}`
  },

  randomToken() {
    return (Math.random() * 100000000).toString(16)
  }
}
