const SocialLocation = require('../index.js');
const chai = require('chai');
const expect = chai.expect;

var social_location = SocialLocation();


var assert = require('assert');
describe('social_location', () => {
    describe('#recentLocation()', () => {
        it('should return user\'s posts with locations as result of promice', function (done) {
            social_location.recentLocation({ instagram: '5598881023.2e7229d.bcc261e454824ea7ac223f02ab8f53c8' })
                .then((user_locations) => {
                    check = typeof user_locations.instagram === 'object';
                    check = check && user_locations.instagram.length > 0;
                    assert.ok(check, 'instagram member is expected in result');

                    if (check) {
                        for (var i in user_locations.instagram) {
                            var record = user_locations.instagram[i];
                            check = record["record_id"];
                            check = check && record["latitude"];
                            check = check && record["longitude"];
                            check = check && record["timedate"];
                            check && typeof record.users_tagged === 'object';
                            assert.ok(check, 'record_id, latitude, longitude, timedate, users_tagged should be a part of instagram element');

                            for (var user_index in record.users_tagged) {
                                var user_tagged = record.users_tagged[user_index];
                                check = user_tagged["provider"] === "instagram";
                                check = check && user_tagged["id"];
                                check = check && typeof user_tagged["name"] === "string";
                                assert.ok(check, 'provider, id, name should be a part of users_tagged element (' + JSON.stringify(user_tagged) + ')');
                            }
                        }
                    }
                }).then(done).catch(done);
        });
    });
});
