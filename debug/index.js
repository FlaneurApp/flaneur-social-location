// Sample, how to use module
const SocialLocation = require('../index.js')

var socialLocation = SocialLocation()

const Express = require('express')
const Instagram = require('../src/instagram.js')

var app = Express()
const instagramConfig = {
  'clientId': '2e7229dd4d1c4a72a3f90e00a7c07087',
  'clientSecret': '56acbc9afe26420b9fe7154205db25dd',
  'scopes': ['basic', 'public_content', 'follower_list']
}
const port = 3000

app.get('/instagram/auth', (req, resp) => {
  var url = Instagram.loginUrl(instagramConfig, 'http://127.0.0.1:' + port + '/instagram/auth/callback')
  resp.redirect(url)
})

app.get('/instagram/auth/callback', (req, resp) => {
  return Instagram.callback(instagramConfig, req)
    .then((result) => {
      resp.send(result)
    }).catch((ex) => {
      resp.send(ex)
    })
})

app.get('/instagram/feed', (req, resp) => {
  var token = req.query.user;
  var onlyWithLocation = req.query.onlyWithLocation || true
  return socialLocation.recentLocation({
    instagram: {
      user: token,
      onlyWithLocation: onlyWithLocation
    }
  })
    .then((userLocations) => {
      console.log(JSON.stringify(userLocations, null, '\t'))
      resp.send(userLocations)
    })
    .catch((ex) => {
      resp.send(ex)
    })
})

app.listen(port, function () {
  console.log('Example app listening on port', port)
})
