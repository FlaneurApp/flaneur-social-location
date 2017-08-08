var Instagram = require('./src/instagram.js');
var Promice = require('bluebird');

function createTask(option, func) {
    return func(option).catch((ex) => {
        // Made because promice all is used. not to stop processing for other possible social networks
        return Promice.resolve({});
    });
}

function instagramRecent(option) {
    return Instagram.getUserRecent(option, null)
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

const socials = {
    instagram:instagramRecent
};

var social_location = function (config) {
    var self = this;
    self.config = config;

    self.recentLocation = function (option) {
        var tasks = [];
        for(var key in socials) {
            if(option[key]) {
                tasks.push(createTask(option[key], socials[key]));
            }
        }
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