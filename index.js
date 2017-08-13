var Instagram = require('./src/instagram.js')
var Promise = require('bluebird')

// Function to prapare request task with social network options and request function
function createTask (option, func) {
  return func(option).catch((ex) => {
    // Made because Promise all is used. not to stop processing for other possible social networks
    return Promise.resolve({ error: ex })
  })
}

// Function to parse instagramm data
function parseInstagrammFeedData (feedData) {
  var result = []
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

      var usersInPhoto = feedRecord['users_in_photo']
      for (var userIndex in usersInPhoto) {
        var userOnPhoto = usersInPhoto[userIndex]
        locationItem.usersTagged.push({
          provider: 'instagram',
          id: userOnPhoto.user.id,
          name: userOnPhoto.user['full_name']
        })
      }
      result.push(locationItem)
    }
  }
  return result
}

// Function to get user locations info from instagram and format to universal model
function instagramRecent (option) {
  var userLocations = []

  return Instagram.getUserRecent(option.user, null, { count: 100 })
    .then((feed) => {
      userLocations = userLocations.concat(parseInstagrammFeedData(feed.data))
      return { instagram: userLocations }
    }).catch((ex) => {
      console.error('Error in Instagram.getUserRecent():', ex)
      Promise.reject(ex)
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
    return Promise.all(tasks)
      .then((PromisesResult) => {
        var result = {}
        for (var PromiseIndex in PromisesResult) {
          for (var providerIndex in PromisesResult[PromiseIndex]) {
            result[providerIndex] = PromisesResult[PromiseIndex][providerIndex]
          }
        }
        return result
      })
      .catch((ex) => {
        console.error('Error in collecting history:', ex)
        return { error: ex }
      })
  }

  return self
}

module.exports = socialLocation
