'use strict'
const IpfsClient = require('ipfs-http-client')

/**
 * Javascript Class to interact with Zenroom.
 */
module.exports = class Storage {
  /**
   * Constructor
   *
   * @param {string} host connection information
   */
  constructor (host = { host: 'localhost', port: 5001 }) {
    this.params = host
    this.ipfs = IpfsClient(host)
  }

  /**
   * Puts data (DAG) to IPFS.
   *
   * @param {srting} name File name
   * @param {object} data Data object
   * @returns {Promise} CID or false
   */
  async add (name, data) {
    return new Promise((resolve) => {
      const str = JSON.stringify(data)
      const file = { path: name + '.json', content: Buffer.from(str) }
      // this.ipfs.add(Buffer.from(JSON.stringify(data)))
      this.ipfs.add(file)
        .then(result => {
          resolve(result.cid.toBaseEncodedString())
        })
        .catch(e => {
          console.log(e)
        })
    })
  }

  /**
   * Gets data (DAG) from IPFS.
   *
   * @param {string} cid ContentID
   * @returns {Promise} data or false
   */
  async get (cid) {
    let json = {}
    const result = await this.ipfs.cat(cid)
    for await (const item of result) {
      json = JSON.parse(item.toString())
    }
    return json
  }
}
