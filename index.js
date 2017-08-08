var Instagram = require('./src/instagram.js');
var Promice = require('bluebird');

// Function to prapare request task with social network options and request function
function createTask(option, func) {
    return func(option).catch((ex) => {
        // Made because promice all is used. not to stop processing for other possible social networks
        return Promice.resolve({});
    });
}

// Function to get user locations info from instagram and format to universal model
function instagramRecent(option) {
    return Instagram.getUserRecent(option.user, null)
        .then((feed) => {
            var feed_data = feed.data;
            var userLocations = [];
            for (var index in feed_data) {
                var feed_record = feed_data[index];
                if (feed_record.location) {
                    var location_item = {
                        record_id: feed_record.id,
                        latitude: feed_record.location.latitude,
                        longitude: feed_record.location.longitude,
                        timedate: new Date(parseInt(feed_record.created_time) * 1000),
                        users_tagged: []
                    };
                    for (var user_index in feed_record.users_in_photo) {
                        var user_in_photo = feed_record.users_in_photo[user_index];
                        location_item.users_tagged.push({
                            provider: 'instagram',
                            id: user_in_photo.user.id,
                            name: user_in_photo.user.full_name
                        });
                    }
                    userLocations.push(location_item);
                }
            }
            return { instagram: userLocations };
        });
}

// List of providers, will be used to collecting info
const socials = {
    instagram:instagramRecent
};

var social_location = function (config) {
    var self = this;
    self.config = config || {}; // general config for future use

    self.recentLocation = function (option) {
        var tasks = [];
        // Preparing tasks according to options.
        // Options should be an object with following structure:
        // { "social1":{/* social1 request options */}, "social2":{/* social2 request options */} }
        for(var key in socials) {
            if(option[key]) {
                var requestOption = {};
                requestOption.user = option[key];
                requestOption.client = self.config[key];
                tasks.push(createTask(requestOption, socials[key]));
            }
        }
        // Waiting until all tasks done
        return Promice.all(tasks)
            .then((promices_result) => {
                var result = {};
                for (var promice_index in promices_result) {
                    for (var provider_index in promices_result[promice_index]) {
                        result[provider_index] = promices_result[promice_index][provider_index];
                    }
                }
                return result;
            })
            .catch((ex) => {
                return { error:ex };
            });
    };

    return self;
}

module.exports = social_location;