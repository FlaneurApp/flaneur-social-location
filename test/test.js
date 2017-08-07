var SocialLocation = require('../index.js');

var social_location = SocialLocation();


var assert = require('assert');
describe('social_location', function () {
    describe('#recentLocation()', function () {
        it('should return user\'s posts with locations', function () {
            social_location.recentLocation({ instagram: '5598881023.2e7229d.bcc261e454824ea7ac223f02ab8f53c8' })
                .then((user_locations) => {
                    var check = true;

                    check = check && user_locations;
                    check = check && typeof user_locations.instagram === 'object';
                    check = check && user_locations.instagram.length > 0;

                    if (check) {
                        for (var i in user_locations.instagram) {
                            var record = user_locations.instagram[i];
                            check = check && record["record_id"];
                            check = check && record["latitude"];
                            check = check && record["longitude"];
                            check = check && record["timedate"];
                            check && typeof record.users_tagged === 'object';
                            for (var user_index in record) {
                                var user_tagged = record[user_index];
                                check = check && user_tagged["provider"] === "instagram";
                                check = check && user_tagged["id"] === "instagram";
                                check = check && typeof user_tagged["name"] === "string";
                            }
                        }

                    }
                    assert.ok(check);
                })
                .catch(() => {
                    assert.ok(false);
                });
        });
    });
});
