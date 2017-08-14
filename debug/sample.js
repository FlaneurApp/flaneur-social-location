const SocialLocation = require('../index.js')
var socialLocation = SocialLocation()

var options = {
  instagram: {
    user: '349984920.2e7229d.fa2ac950bfe9432591eccd1781db750f', // User's instagram token should be here
    onlyWithLocation: false // Specifi if only records with location marks should be returned. Default - true
  }
}
socialLocation.recentLocation(options)
    .then((userLocations) => {
      console.log(JSON.stringify(userLocations))
    })

    .then(() => {
      return socialLocation.recentLocation('something')
    })
    .then((userLocations) => {
      console.log(JSON.stringify(userLocations))
    })
    .then(() => {
      process.exit(0)
    })
