'use strict'
const fs = require('fs')
const networks = ['lab', 'labdev', 'labtest', 'tgn', 'tgntest', 'bcn', 'bcntest', 'and', 'andtest', 'max', 'maxtest']

/**
 * Returns one default existing DID.
 *
 * @param {string} dataPath Data DIR Path
 * @returns {Promise} of the most recent DID as a string
 */
const getDefaultDID = async (dataPath) => {
  // Windows does not accept colons in filenames
  const regex = new RegExp(/^.*\.db$/g)
  let options = checkEnvOptions()
  options.dataPath = dataPath
  options.newIDSpace = false

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
    // File in the database found.
    const sorted = files.sort(function (a, b) { return a.time - b.time })
    options.did = sorted[sorted.length - 1].name.split('.')[0]
  } else {
    // No Database found. Check if we can add a new DID.
    options = checkInitOptions(options)
    options.newIDSpace = true
    await fs.promises.mkdir(dataPath, { recursive: true })
  }
  return options
}

/**
 * Checks needed Environment Variables.
 *
 * @returns {object} All options.
 */
const checkEnvOptions = () => {
  let options = {}
  if ('LORENA_NETWORK' in process.env &&
    'LORENA_DOMAIN' in process.env &&
    'MATRIX_PASSWORD' in process.env &&
    'PRIVATE_KEY_SEED' in process.env &&
    networks.includes(process.env.LORENA_NETWORK)) {
    options = {
      network: process.env.LORENA_NETWORK,
      domain: process.env.LORENA_DOMAIN,
      password: process.env.MATRIX_PASSWORD,
      seed: process.env.PRIVATE_KEY_SEED
    }
  } else throw (new Error('Invalid Env values'))
  return options
}

/**
 * Checks needed INIT Environment Variables.
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
  } else throw (new Error('Invalid INIT Env values'))
  return options
}

module.exports = { getDefaultDID }
