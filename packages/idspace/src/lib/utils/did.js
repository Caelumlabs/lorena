'use strict'
const fs = require('fs')
const networks = ['lab', 'labdev', 'labtest', 'tgn', 'tgntest', 'bcn', 'bcntest', 'and', 'andtest', 'max', 'maxtest']

/**
 * Returns one default existing DID.
 *
 * @param {string} dataPath Data DIR Path
 * @returns {Promise} of the most recent DID as a string
 */
const getDefaultDID = (dataPath) => {
  // Windows does not accept colons in filenames
  const regex = new RegExp(/^.*\.db$/g)
  const files = fs.readdirSync(dataPath)
    // filter out the ones that don't match the pattern
    .filter(file => regex.test(file))
    // get the time for each file
    .map((file) => {
      return {
        name: file,
        time: fs.statSync(`${dataPath}/${file}`).mtime.getTime()
      }
    })
  if (files.length > 0) {
    const sorted = files.sort(function (a, b) { return a.time - b.time })
    // take the last file, strip the .db extension: that's the result
    return (sorted[sorted.length - 1].name.split('.')[0])
  } else return false
}

/**
 * Checks needed Enviroment Variables.
 *
 * @returns {obkect} All options.
 */
const checkEnvOptions = () => {
  let options = {}
  if ('LORENA_NETWORK' in process.env &&
    'LORENA_DOMAIN' in process.env &&
    'MATRIX_PASSWORD' in process.env &&
    'PRIVATE_KEY_SEED' in process.env &&
    process.env.LORENA_NETWORK in networks) {
    options = {
      network: process.env.LORENA_NETWORK,
      domain: process.env.LORENA_DOMAIN,
      password: process.env.MATRIX_PASSWORD,
      seed: process.env.PRIVATE_KEY_SEED
    }
  } else {
    console.log('Invalid Env values')
    process.exit(1)
  }
  return options
}

/**
 * Checks needed INIT Enviroment Variables.
 *
 * @returns {object} All options.
 */
const checkInitOptions = (_options) => {
  const options = _options
  if ('INIT_DID' in process.env &&
    'INIT_SEED' in process.env &&
    'INIT_EMAIL' in process.env) {
    options.did = process.env.INIT_DID
    options.tempSeed = process.env.INIT_SEED
    options.email = process.env.INIT_EMAIL
  } else {
    console.log('Env INIT values not found')
    process.exit(1)
  }
  return options
}

module.exports = { getDefaultDID, checkEnvOptions, checkInitOptions }
