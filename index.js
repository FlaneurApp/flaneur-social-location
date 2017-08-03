var Instagram = require('./src/instagram.js');
var Promice = require('bluebird');

var social_location = function(config) {
    var self = this;
    self.config = config;

    self.recentLocation = function(option) {
        var tasks = [];
        if(option.instagram) {
            var task = Instagram.getUserRecent(option.instagram, null)
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
                            timedate: new Date(parseInt(feed_record.created_time)*1000),
                            users_tagged: []
                        };
                        for(var user_index in feed_record.users_in_photo) {
                            var user_in_photo = feed_record.users_in_photo[user_index];
                            location_item.users_tagged.push({
                                provider:'instagram',
                                id:user_in_photo.user.id,
                                name:user_in_photo.user.full_name
                            });
                        }
                        userLocations.push(location_item);
                    }
                }
                return { instagram:userLocations };
            })
            .catch((ex) => {
                return Promice.resolve({});
            });
            tasks.push(task);
        }
        return Promice.all(tasks)
        .then((promices_result) => {
            var result = {};
            for(var promice_index in promices_result) {
                for(var provider_index in promices_result[promice_index]) {
                    result[provider_index] = promices_result[promice_index][provider_index];
                }                
            }
            return result;
        })
        .catch( (ex) => {
            return {};
        });
    };

    return self;
}

module.exports = social_location;