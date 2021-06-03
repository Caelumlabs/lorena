/* eslint-disable no-async-promise-executor */
'use strict'
const Utils = require('./utils')
const { bufferToU8a } = require('@polkadot/util')

// Debug
var debug = require('debug')('did:debug:sub')
/**
 * IdSpace functions deling with DIDs.
 */
module.exports = class DIDs {
  /**
   * Registers Did in Substrate.
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {string} accountTo Account to assign DID
   * @param {number} level Level to assign
   * @returns {Promise} of transaction
   */
  async registerDid (exec, keypair, did, accountTo, level) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    const transaction = await exec.api.tx.idSpace.registerDid(hexDID, accountTo, level)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Registers an Arweave storage Address (Vec<u8>)for a DID
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} storageAddress Arweave storage address (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async setStorageAddress (exec, keypair, did, storageAddress) {
    const hexDid = Utils.base64ToHex(did)
    const docHash = Utils.toUTF8Array(storageAddress)
    const transaction = await exec.api.tx.idSpace.setStorageAddress(hexDid, docHash)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Registers a Vec<u8> (of the DID document) for a DID
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} diddocHash Did document Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async registerDidDocument (exec, keypair, did, diddocHash) {
    const hexDid = Utils.base64ToHex(did)
    const docHash = Utils.toUTF8Array(diddocHash)
    const transaction = await exec.api.tx.idSpace.registerDidDocument(hexDid, docHash)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Rotate Key : changes the current key for a DID
   * Assumes Key Type = 0
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} pubKey Public Key to be rotated (Vec<u8>)
   * @param {number} typ Public Key type
   * @returns {Promise} Result of the transaction
   */
  async rotateKey (exec, keypair, did, pubKey, typ) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    // Convert pubKey to vec[u8]
    const keyArray = Utils.toUTF8Array(pubKey)
    // Call idSpace RotateKey function
    const transaction = await exec.api.tx.idSpace.rotateKey(hexDID, keyArray, typ)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Rotate Key Type: changes the current key for a specific type for a DID
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} pubKey Public Key to be rotated (Vec<u8>)
   * @param {number} typ Public Key type
   * @returns {Promise} Result of the transaction
   */
  async rotateKeyType (exec, keypair, did, pubKey, typ) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    // Convert pubKey to vec[u8]
    const keyArray = Utils.toUTF8Array(pubKey)
    // Call idSpace RotateKey function
    const transaction = await exec.api.tx.idSpace.rotateKey(hexDID, keyArray, typ)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Change DID owner.
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {string} newOwner New owner's Account (AccountId)
   * @returns {Promise} Result of the transaction
   */
  async changeOwner (exec, keypair, did, newOwner) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    const transaction = await exec.api.tx.idSpace.changeDidOwner(hexDID, newOwner)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Assign a Credential for a DID
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} credential Credential Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async assignCredential (exec, keypair, did, credential) {
    const hexDid = Utils.base64ToHex(did)
    const cred = Utils.toUTF8Array(credential)
    const transaction = await exec.api.tx.idSpace.assignCredential(hexDid, cred)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Remove a Credential for a DID
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} credential Credential Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async removeCredential (exec, keypair, did, credential) {
    const hexDid = Utils.base64ToHex(did)
    const cred = Utils.toUTF8Array(credential)
    const transaction = await exec.api.tx.idSpace.removeCredential(hexDid, cred)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Remove DID.
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @returns {Promise} Result of the transaction
   */
  async removeDid (exec, keypair, did) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    const transaction = await exec.api.tx.idSpace.removeDid(hexDID)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Get Public Key from Did.
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @returns {Promise} of public key
   */
  async getDidData (exec, did) {
    const hexDid = Utils.base64ToHex(did)
    const didData = await exec.api.query.idSpace.didData(hexDid)
    return JSON.parse(didData)
  }

  /**
   * Get Owner Account of a DID.
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @returns {string} public key in hex format
   */
  async getOwnerFromDid (exec, did) {
    return await exec.api.query.idSpace.ownerFromDid(did)
  }

  /**
   * Get DID from Owner Account.
   *
   * @param {object} exec Executor class.
   * @param {string} owner DID
   * @returns {string} DID
   */
  async getDidFromOwner (exec, owner) {
    return await exec.api.query.idSpace.didFromOwner(owner)
  }

  /**
   * Get Public Key from Did.
   * Assumes Key Type = 0
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @param {number} typ Public Key type
   * @returns {string} Actual Key
   */
  async getActualDidKey (exec, did, typ) {
    const hexDid = Utils.base64ToHex(did)
    const result = await exec.api.query.idSpace.publicKeyFromDid([hexDid, typ])
    return bufferToU8a(result)
    // return (result)
  }

  /**
   * Get Public Key of specific type from Did.
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @param {number} typ Public Key type
   * @returns {string} Actual Key
   */
  async getActualDidKeyType (exec, did, typ) {
    const hexDid = Utils.base64ToHex(did)
    const result = await exec.api.query.idSpace.publicKeyFromDid([hexDid, typ])
    return bufferToU8a(result)
    // return (result)
  }

  /**
   * Retrieves the Hash of a Did Document for a DID
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @returns {string} hash in Base64 format
   */
  async getDidDocHash (exec, did) {
    const hexDID = Utils.base64ToHex(did)
    const didDoc = await exec.api.query.idSpace.didDocumentFromDid(hexDID)
    const doc = didDoc.toString().split('x')[1].replace(/0+$/g, '')
    return Utils.hexToBase64(doc)
  }

  /**
   * Adds a CID.
   * DID to assign the CID. By default is Null and the CID
   * will be assigned to the DID of the sender transaction account
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} cid CID
   * @param {string} did DID to assign the new CID (Must exists)
   * @returns {Promise} of transaction
   */
  async addCid (exec, keypair, cid, did, max_hids) {
    // Convert cid string to hex
    const hexCID = Utils.base64ToHex(cid)
    // Convert did string to hex
    let hexDID = Buffer.from([0])
    if (did != null) {
      hexDID = Utils.base64ToHex(did)
    }
    const transaction = await exec.api.tx.idSpace.addCid(hexCID, hexDID, max_hids)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Removes a CID.
   * DID of the CIDs owner. By default is Null and the CID
   * must be assigned to the DID of the sender transaction account
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} cid CID
   * @param {string} did DID of the CIDs owner if providede
   * @returns {Promise} of transaction
   */
  async deleteCid (exec, keypair, cid, did) {
    // Convert cid string to hex
    const hexCID = Utils.base64ToHex(cid)
    // Convert did string to hex
    let hexDID = Buffer.from([0])
    if (did != null) {
      hexDID = Utils.base64ToHex(did)
    }
    const transaction = await exec.api.tx.idSpace.deleteCid(hexCID, hexDID)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Get all CIDs.
   * Get the whole CIDs collection, including deleted.
   *
   * @param {object} exec Executor class.
   * @returns {Array} array of CIDs
   */
  async getCIDs (exec) {
    const CIDs = await exec.api.query.idSpace.cIDs()
    return CIDs.map((cid) => { return JSON.parse(cid) })
  }

  /**
   * Get all valid CIDs.
   * Get all CIDs that are not deleted.
   *
   * @param {object} exec Executor class.
   * @returns {Array} array of CIDs
   */
  async getValidCIDs (exec) {
    const CIDs = await exec.api.query.idSpace.cIDs()
    return CIDs.map((cid) => {
      const c = JSON.parse(cid)
      if (c.valid_to === 0) {
        return c
      }
    })
  }

  /**
   * Get CID by key.
   * Get CID data is key exists, else return null.
   * Because is an ordered array, we use a binary search
   *
   * @param {object} exec Executor class.
   * @param {string} cid CID
   * @returns {string} CID struct or null
   */
  async getCIDByKey (exec, cid) {
    const CIDs = await exec.api.query.idSpace.cIDs()
    let first = 0
    let last = CIDs.length - 1
    let middle = Math.floor((last + first) / 2)

    let parsedCID = JSON.parse(CIDs[middle])
    while (parsedCID.cid !== cid && first < last) {
      if (cid < parsedCID.cid) {
        last = middle - 1
      } else if (cid > parsedCID.cid) {
        first = middle + 1
      }
      middle = Math.floor((last + first) / 2)
      parsedCID = JSON.parse(CIDs[middle])
    }

    return (parsedCID.cid !== cid) ? null : parsedCID
  }

  /**
   * Get all valid CIDs that belongs to a DID.
   * Get a collections of CID data that belongs to a DID.
   * (Can be empty)
   *
   * @param {object} exec Executor class.
   * @param {string} did DID to search
   * @returns {object} CID array
   */
  async getCIDsByDID (exec, did) {
    const CIDs = await exec.api.query.idSpace.cIDs()
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    const didCollection = []
    for (let i = 0; i < CIDs.length; i++) {
      const parsedCID = JSON.parse(CIDs[i])
      if (parsedCID.did_owner.toString().split('x')[1] === hexDID && parsedCID.valid_to === 0) {
        didCollection.push(parsedCID)
      }
    }
    return didCollection
  }
}
