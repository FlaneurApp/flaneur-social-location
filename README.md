## Owerview
Module to collect location history from different social networks.
Supported networks: Instagram, Facebook (Tagged Places & Events)

## Usage:
Each network has his own service exposing different methods for data retrieval, but the usage and parameters stay almost the same.
Each method accepts two arguments:
* `params`, an object containing the parameters
* `dest`, a function for batch streaming (each batch will be send to the `dest` function instead of being sent in one block at the end of the request)

Params has always the following properties available:
* `token`: String, Required. The user token for the given service.
* `batchSize`: Integer, Optional. Number of items in each batch. Especially useful when used with `dest`. Note that the APIs have their own limits.
* `maxItems`: Integer, Optional. Maximum number of records to retrieve.
* `parser`: Function, Optional. A parsing function to apply to each item.

### Instagram-specific Parameters

* `maxID`: String, Optional. Fetch the posts from this ID.
* `onlyWithLocation`: Boolean, Optional. Fetch only posts with location. Doesn't used if a custom parser function is provided.

## Code sample:
```js
const socialLocation = require('social_location')

// Fetches location from Instagram, Facebook Tagged Places and Facebook Events
Promise.all([
  socialLocationService.instagramAPI.getUserPhotos({ token: instagramToken }),
  socialLocationService.facebookAPI.getLocations({ token: facebookToken }),
  socialLocationService.facebookAPI.getEvents({ token: facebookToken })
])
  .then((results) => {
    console.log(results)
  })
```

## Response

### Instagram

```json
{
    [ // Array of records with social network name as a key
        {
            "record_id": "1678900001234999000_0008881024", // Id of record if social network
            "timedate": "2017-07-28T13:26:05.000Z", // Time
            "usersTagged": [ // Array of users form social network, tagged on the record
                {
                    "id": "000000001", // Id of user in Sosial network
                    "name": "jonsmith90",
                    "fullName": "Jon Smith", // Name of user in social network
                    "picture": "https://scontent.cdninstagram.com/t30.2885-19/s150x150/16465407_134027990443410_7777777728803741696_a.jpg"
                }
            ],
            "latitude": 49.786225761362, // Coordinates - latitude
            "longitude": 22.763717472553, // Coordinates - longitude
            "info": { // Information about location from Social network
                "id": 6889842, // Instagram Location ID
                "address": "", // Street Address if available,
                "name": "Львів" // Name of the location
            }
        },
        // Other records
    ]
}
```

### Facebook

#### Tagged Places (Locations)

```json
{
    [ // Array of records with social network name as a key
        {
            "id": "103643550485856", // Facebook item ID
            "created_time": "2016-04-12T10:00:00+0000", // Item creation time
            "place": { // Place details
                "id": "151367198235335", // Facebook Place ID
                "name": "Düsseldorfer Altstadt", // Facebook Place Name
                "location": { // Location Details
                    "city": "Düsseldorf", // City (if available)
                    "country": "Germany", // Country
                    "latitude": 51.226224556667, // Latitude
                    "longitude": 6.7741376, // Longitude
                    "street": "Heinrich-Heine-Platz 1", // Street (if available)
                    "zip": "40213" // Zip (if available)
                }
            }
        },
        // Other records
    ]
}
```

#### Events

```json
{
    [ // Array of records with social network name as a key
        {
            "id": "420894938351528", // Facebook Event ID
            "name": "Feria d\'Alès 2018", // Facebook Event Name
            "start_time": "2018-05-09T18:00:00+0200", // Facebook Event Start Time
            "place": { // Place Details
                "id": "508525152533549", // Facebook Place ID
                "name": "Alès", // Facebook Place Name
                "location": { // Location Details
                    "city": "Alès", // City (if available)
                    "country": "France", // Country
                    "latitude": 44.125216911674, // Latitude
                    "longitude": 4.0771781115702, // Longitude
                    "street": "Place de l\'Hôtel de Ville", // Street (if available)
                    "zip": "30100" // Zip (if available)
                }
            }
        },
        // Other records
    ]
}
```

Note that in Facebook Events, the `place.id` and `location` properties may not exist if the linked location doesn't exist in Facebook.

## Unit Tests
For Unit Testing, API informations (keys and/or tokens) are required. Please fill the `test/config.json` file if your need to run Unit Tests.
