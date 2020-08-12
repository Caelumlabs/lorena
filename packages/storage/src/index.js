'use strict'
const IpfsClient = require('ipfs-http-client')
const CID = require('cids')

// Debug
var debug = require('debug')('did:debug:ipfs')
var error = require('debug')('did:error:ipfs')

/**
 * Javascript Class to interact with Zenroom.
 */
module.exports = class Storage {
  /**
   * Constructor
   *
   * @param {*} opts connection information
   */
  constructor (opts = { host: 'labdev.ipfs.lorena.tech', port: '5001' }) {
    this.ipfs = new IpfsClient(opts)
  }

  /**
   * Puts data (DAG) to IPFS.
   *
   * @param {object} data Data object
   * @returns {Promise} CID or false
   */
  async put (data) {
    return new Promise((resolve) => {
      this.ipfs.dag.put(data, { format: 'dag-cbor', hashAlg: 'sha2-256' })
        .then((cid) => {
          const cids = new CID(1, 'dag-cbor', cid.multihash)
          debug('CID = ' + cids.toBaseEncodedString())
          resolve(cids.toBaseEncodedString())
        })
        .catch((e) => {
          error(e)
          resolve(false)
        })
    })
  }

  cid (hash) {
    const cids = new CID(hash)
    return cids
  }

  /**
   * Gets data (DAG) from IPFS.
   *
   * @param {string} cid ContentID
   * @returns {Promise} data or false
   */
  async get (cid) {
    return new Promise((resolve) => {
      this.ipfs.dag.get(cid)
        .then((data) => {
          resolve(data)
        })
        .catch((e) => {
          error(e)
          resolve(false)
        })
    })
  }
}
