// Init your Fruit Vault (Identity Container)
// const Index = require('./lib/lorena-index')
const IDspace = require('./lib/idspace')
const HealthChecker = require('./server/health-checker.js')
const { getDefaultDID, checkEnvOptions, checkInitOptions } = require('./lib/utils/did')
const path = require('path')
require('dotenv').config()

/**
 * Main.
 */
const main = async () => {
  // Get & Check Env. Options.
  let options = checkEnvOptions()
  // Get the current working DID.
  const did = getDefaultDID(path.join(__dirname, '../data'))
  if (did === false) {
    // Get & Check INIT Env. Options.
    console.log("ADD DID")
    options = checkInitOptions(options)
    console.log(options)
  }

  // Run the IDSpace
  const idspace = new IDSpace(options)
  // const health = new HealthChecker(this.did, 23246)
  // health.listen()
}

main()
