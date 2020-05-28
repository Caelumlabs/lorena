// Lorena Libraries
const IDSpace = require('./lib/idspace')
// const HealthChecker = require('./server/health-checker.js')
const { getDefaultDID } = require('./lib/utils/did')

// Util Libraries
const path = require('path')
var debug = require('debug')('idspace:debug:index')
var error = require('debug')('idspace:error:index')
require('dotenv').config()

// Main.
const main = async () => {
  // Get the current working DID.
  const options = await getDefaultDID(path.join(__dirname, '../data'))
  IDSpace.build(options)
    .then(async (idspace) => {
      // Launch a new IDSpace
      debug('Launching IDSpace')
      if (options.newIDSpace) {
        await idspace.init()
      } else {
        await idspace.open()
      }
      debug(`${idspace.context.info.did}`)
      debug('Listening...')
    })
    .catch((e) => {
      error(e)
      process.exit(1)
    })
  // Run the IDSpace
  // const health = new HealthChecker(this.did, 23246)
  // health.listen()
  // idspace.run()
}

main()
