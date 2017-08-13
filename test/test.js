const SocialLocation = require('../index.js')

var socialLocation = SocialLocation()

var assert = require('assert')
describe('socialLocation', () => {
  describe('#recentLocation()', () => {
    it('should return user\'s posts with locations as result of Promise', function (done) {
      socialLocation.recentLocation({ instagram: '5598881023.2e7229d.bcc261e454824ea7ac223f02ab8f53c8' })
                .then((userLocations) => {
                  var check = typeof userLocations.instagram === 'object'
                  check = check && userLocations.instagram.length > 0
                  assert.ok(check, 'instagram member is expected in result (' + JSON.stringify(userLocations) + ')')

                  if (check) {
                    for (var i in userLocations.instagram) {
                      var record = userLocations.instagram[i]
                      check = record['record_id']
                      check = check && record['latitude']
                      check = check && record['longitude']
                      check = check && record['timedate']
                      check = check && typeof record.usersTagged === 'object'
                      assert.ok(check, 'record_id, latitude, longitude, timedate, users_tagged should be a part of instagram element (' + JSON.stringify(record) + ')')

                      for (var userIndex in record.usersTagged) {
                        var userTagged = record.usersTagged[userIndex]
                        check = userTagged['provider'] === 'instagram'
                        check = check && userTagged['id']
                        check = check && typeof userTagged['name'] === 'string'
                        assert.ok(check, 'provider, id, name should be a part of users_tagged element (' + JSON.stringify(userTagged) + ')')
                      }
                    }
                  }
                }).then(done).catch(done)
    })
  })
})
