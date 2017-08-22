## Owerview
Module to collect history from different social networks.
Supported networks: Instagram

## Code sample:
```js
const SocialLocation = require('social_location')
var socialLocation = SocialLocation()

var options = { 
    instagram: {
        user:'<instagram token>', // User's instagram token should be here
        onlyWithLocation: false // Specifi if only records with location marks should be returned. Default - true
    }
}
socialLocation.recentLocation(options)
.then((userLocations) => {
    console.log(JSON.stringify(userLocations));
})
```

The result will have following structure:
```json
{
    "instagram":[ // Array of records with social network name as a key
        {
            "record_id":"1678900001234999000_0008881024", // Id of record if social network
            "timedate":"2017-07-28T13:26:05.000Z", // Time
            "usersTagged":[ // Array of users form social network, tagged on the record
                {
                    "provider":"instagram", // Sosial network key
                    "id":"000000001", // Id of user in Sosial network
                    "fullName":"Jon Smith", // Name of user in social network
					"name": "jonsmith90",
					"fullName": "Nataliia Artym",
					"picture": "https://scontent.cdninstagram.com/t30.2885-19/s150x150/16465407_134027990443410_7777777728803741696_a.jpg"
                }
            ],
            "latitude":49.786225761362, // Coordinates - latitude
            "longitude":22.763717472553, // Coordinates - longitude
            "info": {    // Information about location from Social network
                "provider":"instagram",
                "id":767620622,
                "name":"Львів"
            }
        }
    ]
}
```