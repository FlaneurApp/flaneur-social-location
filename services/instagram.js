'use strict'

const request = require('request-promise-native')

// Instagram paths
const instagramURL = 'https://api.instagram.com/v1'
const recentMediaPath = 'users/self/media/recent'

/**
 * Parser for instagram media data
 * @param {*} data
 * @param {*} onlyWithLocation
 */
function instagramDataParser(data, onlyWithLocation) {
  return data.reduce((results, feedRecord) => {
    const locationItem = {
      record_id: feedRecord.id,
      timedate: new Date(parseInt(feedRecord.created_time, 10) * 1000),
      images: feedRecord.images
    }

    if (feedRecord.location) {
      locationItem.latitude = feedRecord.location.latitude
      locationItem.longitude = feedRecord.location.longitude
      locationItem.info = {
        id: feedRecord.location.id,
        address: feedRecord.location.street_address || null,
        name: feedRecord.location.name
      }
    } else if (onlyWithLocation) {
      return results
    }

    const usersInPhoto = feedRecord.users_in_photo
    locationItem.usersTagged = usersInPhoto.map((userOnPhoto) => {
      return {
        id: userOnPhoto.user.id,
        name: userOnPhoto.user.username,
        fullName: userOnPhoto.user.full_name,
        picture: userOnPhoto.user.profile_picture
      }
    })

    results.push(locationItem)
    return results
  }, [])
}

function getUserPhotos(params = {}, dest) {
  const { token, maxID, batchSize, maxItems, parser, onlyWithLocation } = params
  const options = {
    uri: `${instagramURL}/${recentMediaPath}`,
    qs: {
      access_token: token,
      max_id: maxID || null,
      count: batchSize || 20
    },
    json: true // Automatically parses the JSON string in the response
  }

  if (!options.qs.access_token) {
    throw new Error('No access token provided')
  }

  let data = []
  let count = 0
  return (function paginate(nextMaxID) {
    options.qs.max_id = nextMaxID

    return request(options)
      .then((instagramResponse) => {
        if (!instagramResponse || instagramResponse.meta.code !== 200) {
          console.error('[#getUserPhotos] It seems that an error occured while fetching the photos..')
          console.error('[#getUserPhotos] Please investigate')
          return dest ? 'Error' : data
        }

        let photosData = instagramResponse.data
        const thisCount = photosData.length

        if (maxItems && (count + thisCount) > maxItems) {
          photosData = photosData.splice(0, maxItems - count)
          count = maxItems
        } else {
          count += thisCount
        }

        // If a parsing function is specified, apply it
        if (parser) {
          photosData = photosData.map(parser)
        } else {
          // Else apply the default parsing function
          photosData = instagramDataParser(photosData, onlyWithLocation)
        }

        if (photosData) {
          // Parse here
          if (dest) {
            dest(JSON.stringify(photosData))
          } else {
            data = data.concat(photosData)
          }
        }

        if ((!maxItems || count < maxItems) && instagramResponse.pagination.next_max_id) {
          return paginate(instagramResponse.pagination.next_max_id)
        }

        return dest ? 'Done' : data
      })
  }())
}


module.exports = {
  instagramDataParser,
  getUserPhotos
}
