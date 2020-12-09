'use strict'
// const IpfsClient = require('ipfs-http-client')
const fleekStorage = require('@fleekhq/fleek-storage-js')

/**
 * Javascript Class to interact with Zenroom.
 */
module.exports = class Storage {
  /**
   * Constructor
   *
   * @param {string} apiKey Fleek API KEY
   * @param {string} apiSecret Fleek API SECRET
   */
  constructor (apiKey, apiSecret) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  async add (name, data) {
    const uploadedFile = await fleekStorage.upload({
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      key: name,
      data: JSON.stringify(data)
    })
    return uploadedFile.hash
  }

  async get (cid) {
    const uploadedFile = await fleekStorage.getFileFromHash({
      hash: cid
    })
    return uploadedFile
  }

  async del (cid) {
    const uploadedFile = await fleekStorage.getFileFromHash({
      hash: cid
    })
    return uploadedFile
  }
}

/**
 * Gets data (DAG) from IPFS.
 *
 * @param {string} cid ContentID
 * @returns {Promise} data or false
 */
/*
  async get (cid) {
    let json = {}
    const result = await this.ipfs.cat(cid)
    for await (const item of result) {
      json = JSON.parse(item.toString())
    }
    return json
  }
  */
/**
 * Puts data (DAG) to IPFS.
 *
 * @param {string} name File name
 * @param {object} data Data object
 * @returns {Promise} CID or false
 */
/*
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
  */
