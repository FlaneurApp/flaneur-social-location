var Instagram = require('./src/instagram.js')
var Promise = require('bluebird')

// Function to prapare request task with social network options and request function
function createTask (option, func) {
  return func(option)
    .catch((ex) => {
      // Made because Promise all is used. not to stop processing for other possible social networks
      return Promise.resolve({ error: ex })
    })
}

// Function to parse instagramm data
function parseInstagrammFeedData (feedData, onlyWithLocation) {
  var result = []
  for (var index in feedData) {
    var feedRecord = feedData[index]
    var locationItem = {
      record_id: feedRecord.id,
      timedate: new Date(parseInt(feedRecord.created_time) * 1000),
      usersTagged: []
    }
    if (feedRecord.location) {
      locationItem.latitude = feedRecord.location.latitude
      locationItem.longitude = feedRecord.location.longitude
      locationItem.info = {
        provider: 'instagram',
        id: feedRecord.location.id,
        address : feedRecord.location["street_address"],
        name : feedRecord.location.name
      }
    } else if (onlyWithLocation) {
      continue
    }

    var usersInPhoto = feedRecord['users_in_photo']
    for (var userIndex in usersInPhoto) {
      var userOnPhoto = usersInPhoto[userIndex]
      locationItem.usersTagged.push({
        provider: 'instagram',
        id: userOnPhoto.user.id,
        name: userOnPhoto.user['username'],
        fullName: userOnPhoto.user['full_name'],
        picture: userOnPhoto.user['profile_picture']
      })
    }
    result.push(locationItem)
  }
  return result
}

function getInstagramFeedPage (user, nextMaxId, userLocations, onlyWithLocation) {
  var options = {
    count: 30
  }
  if (nextMaxId) {
    options = { max_id: nextMaxId }
  }

  return Instagram.getUserRecent(user, null, options)
    .then((resp) => {
      if (!resp) {
        return Promise.reject(new Error('Error getting instagramm feed'))
      }
      userLocations = userLocations.concat(parseInstagrammFeedData(resp.data, onlyWithLocation))
      if (resp.pagination && resp.pagination['next_max_id']) {
        return getInstagramFeedPage(user, resp.pagination['next_max_id'], userLocations, onlyWithLocation)
      } else {
        return userLocations
      }
    })
}

// Function to get user locations info from instagram and format to universal model
function instagramRecent (option) {
  var userOption = option.user

  var onlyWithLocation = userOption.onlyWithLocation ? parseInt(userOption.onlyWithLocation) : true
  var token = userOption.user || userOption
  return new Promise((resolve, reject) => {
    getInstagramFeedPage(token, null, [], onlyWithLocation)
      .then((userLocations) => {
        resolve({
          instagram: userLocations
        })
      })
      .catch((ex) => {
        console.error('Error in Instagram.getUserRecent():', ex)
        reject(new Error({
          instagram: {
            error: ex
          }
        }))
      })
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
          var currentResult = PromisesResult[PromiseIndex]
          for (var providerIndex in currentResult) {
            result[providerIndex] = currentResult[providerIndex]
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
