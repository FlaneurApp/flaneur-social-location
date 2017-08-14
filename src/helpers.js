var path = require('path')

module.exports = {
  requestUrl: function (req, join) {
    var end = req.originalUrl.indexOf('?')
    var url = req.originalUrl
    if (end > -1) {
      url = url.substring(0, end)
    }
    if (join) {
      url = path.join(url, join)
    }
    return req.protocol + '://' + req.headers.host + url
  },

  randomToken: function () {
    return (Math.random() * 100000000).toString(16)
  }
}
