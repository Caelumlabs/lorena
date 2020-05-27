const networks = require('../networks.json')
const Storage = require('@lorena/storage')
const Blockchain = require('@lorena/blockchain-substrate')
const bip39 = require('bip39')
var debug = require('debug')('did-resolver:debug')

// Cache connections to various networks
const connections = {}

/**
 * Interface for did-resolver
 *
 * @returns {*} resolver
 */
function getResolver () {
  /**
   * method for did-resolver
   *
   * @param {string} did to look up
   * @param {string} parsed DID
   * @param {*} didResolver the calling resolver
   * @returns {*} DIDDocument
   */
  async function resolve (
    did, // : string,
    parsed, // : ParsedDID,
    didResolver // : DIDResolver
  ) /* : Promise<DIDDocument | null> */ {
    // console.log (parsed)

    const info = getInfoForDid(did)
    if (!info) {
      return null
    }

    const connection = await getBlockchainConnection(did)
    let didDocHash
    try {
      // Look it up in the blockchain with just the ID
      const didParts = parsed.id.split(':')
      didDocHash = await connection.getDidDocHash(didParts[1])
    } catch (e) {
      debug(e)
      return null
    }

    // If there is no DID Document registered, return nothing
    if (didDocHash === '') {
      return null
    }

    // Connect to Matrix to get the DID Document
    const storage = await new Storage(info.matrixEndpoint)
    const didDoc = await storage.get(didDocHash)

    // no DID Document found: return nothing
    if (!didDoc || !didDoc.data) {
      return null
    }

    // if there's no path, just return the whole shebang
    if (parsed.did === parsed.didUrl) {
      return didDoc.data
    }

    // TODO: process path and fragment
    // {method: 'mymethod', id: 'abcdefg', did: 'did:mymethod:abcdefg/some/path#fragment=123', path: '/some/path', fragment: 'fragment=123'}
    return didDoc.data
  }

  return { lor: resolve }
}

/**
 * Returns connected blockchain object for the specified DID
 *
 * @param {string} did for which to retrieve the public key
 * @returns {object} Blockchain interface with connection open
 */
async function getBlockchainConnection (did) {
  const info = getInfoForDid(did)
  if (!info) {
    return null
  }

  // use cached connection, if any
  let connection = connections[info.network]

  if (!connection) {
    // Connect to Blockchain

    switch (info.type) {
      case 'substrate':
        connection = new Blockchain(info.blockchainEndpoint)
        break
      default:
        throw new Error(`Unsupported network type ${info.type}`)
    }

    // Connect to the blockchain
    await connection.connect()

    // Even though we are read-only, we need to supply a key (for reasons)
    // to a certain blockchain. So here's a key.
    connection.setKeyring(bip39.generateMnemonic())

    connections[info.network] = connection
  }

  return connection
}

/**
 * Returns public key for the did specified
 *
 * @param {string} did for which to retrieve the public key
 * @returns {string} public key
 */
async function getPublicKeyForDid (did) {
  // TODO: Check multihash type to see if this should be looked up
  // in blockchain or IPLD

  // TODO: if not recorded in blockchain (depending on network type)
  // get the public key from the diddoc

  try {
    const connection = await getBlockchainConnection(did)
    const didParts = did.split(':')
    const publicKey = await connection.getActualDidKey(didParts[3])
    return publicKey
  } catch (e) {
    debug(e)
    return ('')
  }
}

/**
 * Parses the network name from the DID
 *
 * @param {string} did for which to retrieve endpoint information
 * @returns {string} network name
 */
function getNetworkForDid (did) {
  const arr = /did:lor:(.*?):.*/.exec(did)
  return arr[1]
}

/**
 * Returns information specific to the namespace of the did specified
 *
 * @param {string} did for which to retrieve endpoint information
 * @returns {JSON} endpoint information (or undefined)
 */
function getInfoForDid (did) {
  return getInfoForNetwork(getNetworkForDid(did))
}

/**
 * Returns information for the network specified
 *
 * @param {string} network for which to retrieve endpoint information
 * @returns {JSON} endpoint information (or undefined)
 */
function getInfoForNetwork (network) {
  return networks[`did:lor:${network}`]
}

/**
 * Disconnects all cached connections
 */
function disconnectAll () {
  Object.keys(connections).forEach((network) => {
    connections[network].disconnect()
    delete connections[network]
  })
}

module.exports = { disconnectAll, getResolver, getInfoForDid, getInfoForNetwork, getPublicKeyForDid }
