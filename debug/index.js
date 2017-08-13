// Sample, how to use module
var SocialLocation = require('../index.js')

var socialLocation = SocialLocation()
socialLocation.recentLocation({ instagram: '5598881023.2e7229d.bcc261e454824ea7ac223f02ab8f53c8' })
.then((userLocations) => {
  console.log(typeof userLocations)
  console.log(JSON.stringify(userLocations, null, '\t'))
})
.then(() => {
  process.exit(0)
})
