var Instagram = require('./src/instagram.js')
var Promice = require('bluebird')

// Function to prapare request task with social network options and request function
function createTask (option, func) {
  return func(option).catch((ex) => {
        // Made because promice all is used. not to stop processing for other possible social networks
    return Promice.resolve({})
  })
}

// Function to get user locations info from instagram and format to universal model
function instagramRecent (option) {
  return Instagram.getUserRecent(option.user, null)
        .then((feed) => {
          var feedData = feed.data
          var userLocations = []
          for (var index in feedData) {
            var feedRecord = feedData[index]
            if (feedRecord.location) {
              var locationItem = {
                record_id: feedRecord.id,
                latitude: feedRecord.location.latitude,
                longitude: feedRecord.location.longitude,
                timedate: new Date(parseInt(feedRecord.created_time) * 1000),
                usersTagged: []
              }
              for (var userIndex in feedRecord.usersOnPhoto) {
                var userOnPhoto = feedRecord.usersOnPhoto[userIndex]
                locationItem.usersTagged.push({
                  provider: 'instagram',
                  id: userOnPhoto.user.id,
                  name: userOnPhoto.user.fullName
                })
              }
              userLocations.push(locationItem)
            }
          }
          return { instagram: userLocations }
        })
}

// List of providers, will be used to collecting info
const socials = {
  instagram: instagramRecent
}

var socialLocation = function (config) {
  var self = this
  self.config = config || {} // general config for future use

  self.recentLocation = function (option) {
    var tasks = []
        // Preparing tasks according to options.
        // Options should be an object with following structure:
        // { "social1":{/* social1 request options */}, "social2":{/* social2 request options */} }
    for (var key in socials) {
      if (option[key]) {
        var requestOption = {}
        requestOption.user = option[key]
        requestOption.client = self.config[key]
        tasks.push(createTask(requestOption, socials[key]))
      }
    }
        // Waiting until all tasks done
    return Promice.all(tasks)
            .then((promicesResult) => {
              var result = {}
              for (var promiceIndex in promicesResult) {
                for (var providerIndex in promicesResult[promiceIndex]) {
                  result[providerIndex] = promicesResult[promiceIndex][providerIndex]
                }
              }
              return result
            })
            .catch((ex) => {
              return { error: ex }
            })
  }

  return self
}

module.exports = socialLocation
