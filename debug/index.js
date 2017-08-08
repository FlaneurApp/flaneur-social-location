// Sample, how to use module
var SocialLocation = require('../index.js');

var social_location = SocialLocation();
social_location.recentLocation({instagram:'5598881023.2e7229d.bcc261e454824ea7ac223f02ab8f53c8'})
.then((user_locations) => {
    console.log(typeof user_locations);
    console.log(JSON.stringify(user_locations, null, '\t'));
})
.then(()=> {
    process.exit(0);
});
