/* eslint-disable no-async-promise-executor */
'use strict'
const Utils = require('./utils')
const { bufferToU8a, stringToU8a, u8aConcat, u8aToHex, hexToU8a, hexToString, stringToHex } = require('@polkadot/util')

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
   * @param {string} accountTo Account to assign DID
   * @param {number} level Level to assign
   * @param {number} didType DID type
   * @param {string} legalName Organization's legal name
   * @param {string} taxId Organization's tax id
   * @returns {Promise} of transaction
   */
  async registerDid (exec, keypair, accountTo, level, didType, legalName, taxId) {
    const transaction = await exec.api.tx.idSpace.registerDid(accountTo, level, didType, legalName, taxId)
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
    const storageAddr = u8aToHex(storageAddress)
    const transaction = await exec.api.tx.idSpace.setStorageAddress(did, storageAddr)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Set Key : changes the current key for a DID
   * If did == null or undefined adds the new key to the sender
   * If did has value moves the key from sender to DID receiver
   * Assumes Key Type = 0
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} pubKey Public Key to be created/rotated (Vec<u8>)
   * @param {number} typ Public Key type
   * @returns {Promise} Result of the transaction
   */
  async setKey (exec, keypair, did, pubKey, typ) {
    if (did === undefined || did === null) {
      did = u8aToHex('\x00')
    }
    // Convert pubKey to vec[u8]
    const keyArray = u8aToHex(Utils.toUTF8Array(pubKey))
    // Call idSpace SetKey function
    const transaction = await exec.api.tx.idSpace.setKey(did, keyArray, typ)
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
    // Check if DID is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const transaction = await exec.api.tx.idSpace.changeDidOwner(did, newOwner)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Assign a Credential for a DID
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} credential Credential Hash (Vec<u8>)
   * @param {object} certificate Certificate from which hash is generated
   * @param {object} typ Type
   * @returns {Promise} Result of the transaction
   */
  async putHash (exec, keypair, did, credential, certificate, typ) {
    const transaction = await exec.api.tx.idSpace.putHash(did, credential, certificate, typ)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Change Legal Name or Tax ID
   * Only the promoter account is allowed to do it
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} legalName New Legal Name (if null will not be changed)
   * @param {object} taxId New Tax Id (if null will not be changed)
   * @returns {Promise} Result of the transaction
   */
  async changeLegalNameOrTaxId (exec, keypair, did, legalName, taxId) {
    if (legalName === null) { legalName = '0x00' }
    if (taxId === null) { taxId = '0x00' }
    const transaction = await exec.api.tx.idSpace.changeLegalNameOrTaxId(did, legalName, taxId)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Change DID Info
   * Only the owner account is allowed to do it
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {object} name New Name (if null will not be changed)
   * @param {object} address New address Id (if null will not be changed)
   * @param {object} postalCode New postal code (if null will not be changed)
   * @param {object} city New city (if null will not be changed)
   * @param {object} countryCode New country code (if null will not be changed)
   * @param {object} phoneNumber New phone number (if null will not be changed)
   * @param {object} website New website (if null will not be changed)
   * @param {object} endpoint New endpoint (if null will not be changed)
   * @returns {Promise} Result of the transaction
   */
  async updateInfo (exec, keypair, did, name, address, postalCode, city, countryCode, phoneNumber, website, endpoint) {
    if (name === null) { name = '0x00' }
    if (address === null) { address = '0x00' }
    if (postalCode === null) { postalCode = '0x00' }
    if (city === null) { city = '0x00' }
    if (countryCode === null) { countryCode = '0x00' }
    if (phoneNumber === null) { phoneNumber = '0x00' }
    if (website === null) { website = '0x00' }
    if (endpoint === null) { endpoint = '0x00' }
    const transaction = await exec.api.tx.idSpace.updateInfo(did, name, address, postalCode, city, countryCode, phoneNumber, website, endpoint)
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
  async revokeHash (exec, keypair, did, credential) {
    const transaction = await exec.api.tx.idSpace.revokeHash(did, credential)
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
    // Check if Certificate is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const transaction = await exec.api.tx.idSpace.removeDid(did)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Get DID Data.
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @returns {Promise} of public key
   */
  async getDidData (exec, did) {
    // Check if Certificate is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const { internalDid } = this.structDid(did)
    const didData = await exec.api.query.idSpace.didData(internalDid)
    return JSON.parse(didData)
  }

  /**
   * Get All DID Data.
   *
   * @param {object} exec Executor class.
   * @returns {Promise} of public key
   */
  async getAllDidData (exec) {
    const allDidData = await exec.api.query.idSpace.didData.entries()
    const didData = allDidData
      .map((v) => {
        const data = JSON.parse(v[1])
        const did = '0x' + Utils.decimalToHex(data.did_version, 2) +
                           Utils.decimalToHex(data.network_id, 4) +
                           Utils.decimalToHex(data.did_type, 2) +
                           u8aToHex(v[0]).slice(100)
        return { did: did, data: data }
      })
    return didData
  }

  /**
   * Get Owner Account of a DID.
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @returns {string} public key in hex format
   */
  async getOwnerFromDid (exec, did) {
    // Check if Certificate is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const { internalDid } = this.structDid(did)
    return await exec.api.query.idSpace.ownerFromDid(internalDid)
  }

  /**
   * Get DID from Owner Account.
   *
   * @param {object} exec Executor class.
   * @param {string} owner DID
   * @returns {string} DID
   */
  async getDidFromOwner (exec, owner) {
    const did = await exec.api.query.idSpace.didFromOwner(owner)
    return u8aToHex(did)
  }

  /**
   * Get Public Key from Did.
   * Assumes Key Type = 0
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} did DID
   * @param {number} typ Public Key type
   * @returns {string} Actual Key
   */
  async getActualDidKey (exec, keypair, did, typ) {
    if (did === undefined || did === null) {
      did = this.getDidFromOwner(exec, this.keypair.address)
    }
    // Check if DID is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const { internalDid } = this.structDid(did)
    const result = await exec.api.query.idSpace.publicKeyFromDid([internalDid, typ])
    return bufferToU8a(result)
  }

  /**
   * Get Public Key of specific type from Did.
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @param {object} keypair Account's keypair
   * @param {number} typ Public Key type
   * @returns {string} Actual Key
   */
  async getActualDidKeyType (exec, keypair, did, typ) {
    if (did === undefined || did === null) {
      did = this.getDidFromOwner(exec, this.keypair.address)
    }
    // Check if Certificate is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const { internalDid } = this.structDid(did)
    const result = await exec.api.query.idSpace.publicKeyFromDid([internalDid, typ])
    return bufferToU8a(result)
  }

  /**
   * Retrieves the Hash of a Storage Address for a DID
   *
   * @param {object} exec Executor class.
   * @param {string} did DID
   * @returns {string} hash in Base64 format
   */
  async getStorageAddressHash (exec, did) {
    // Check if Certificate is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const { internalDid } = this.structDid(did)
    return await exec.api.query.idSpace.storageAddressFromDid(internalDid)
  }

  /**
   * Adds a Certificate.
   * DID to assign the Certrificate. By default is Null and the Certificate
   * will be assigned to the DID of the sender transaction account
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} cid Certificate ID
   * @param {string} title Certicate's title
   * @param {string} urlCertificate Certificate's URL
   * @param {string} urlImage Certificate's URL image
   * @param {string} cidType Certificate's type
   * @param {string} did DID to assign the new CID (Either null or Must exists)
   * @returns {Promise} of transaction
   */
  async addCertificate (exec, keypair, cid, title, urlCertificate, urlImage, cidType, did) {
    if (title === undefined || title === null) {
      title = u8aToHex('\x00')
    }
    if (urlCertificate === undefined || urlCertificate === null) {
      urlCertificate = u8aToHex('\x00')
    }
    if (urlImage === undefined || urlImage === null) {
      urlImage = u8aToHex('\x00')
    }
    if (cidType === undefined || cidType === null) {
      cidType = u8aToHex('\x00')
    }
    if (did === undefined || did === null) {
      did = u8aToHex('\x00')
    }
    const transaction = await exec.api.tx.idSpace.addCertificate(cid, title, urlCertificate, urlImage, cidType, did)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Revokes a Certificate.
   * DID of the Certificates owner. By default is Null and the Certificate
   * must be assigned to the DID of the sender transaction account
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} cid Certificate ID
   * @param {string} did DID of the Certificate owner if provided
   * @returns {Promise} of transaction
   */
  async revokeCertificate (exec, keypair, cid, did) {
    const transaction = await exec.api.tx.idSpace.revokeCertificate(cid, did)
    return await exec.execTransaction(keypair, transaction)
  }

  /**
   * Get all Certificates.
   * Get the whole Certificates collection, including revoked.
   *
   * @param {object} exec Executor class.
   * @returns {Array} array of Certificates
   */
  async getCertificates (exec) {
    const allCids = await exec.api.query.idSpace.certificates.entries()
    const cids = allCids
      .map((v) => {
        const data = JSON.parse(v[1])
        const cid = '0x' + u8aToHex(v[0]).slice(100)
        return { certificate: cid, data: data }
      })
    return cids
  }

  /**
   * Get all valid Certificates.
   * Get all Certificates that are not revoked.
   *
   * @param {object} exec Executor class.
   * @returns {Array} array of Certificates
   */
  async getValidCertificates (exec) {
    const allCids = await exec.api.query.idSpace.certificates.entries()
    const cids = allCids
      .map((v) => {
        const data = JSON.parse(v[1])
        if (data.block_valid_to === 0) {
          const cid = '0x' + u8aToHex(v[0]).slice(100)
          return { certificate: cid, data: data }
        }
      })
    return cids
  }

  /**
   * Get Certificate by key.
   * Get Certificate data is key exists, else return null.
   * Because is an ordered array, we use a binary search
   *
   * @param {object} exec Executor class.
   * @param {string} cid Certificate ID
   * @returns {string} Certificate struct or null
   */
  async getCertificateByKey (exec, cid) {
    // Check if Certificate is wellformed
    if (Utils.verifyHexString(cid) === false) {
      return false
    }
    return await exec.api.query.idSpace.certificates(cid)
  }

  /**
   * Get all valid Certificates that belongs to a DID.
   * Get a collections of Certificate data that belongs to a DID.
   * (Can be empty)
   *
   * @param {object} exec Executor class.
   * @param {string} did DID to search
   * @returns {object} Certificate array
   */
  async getCertificatesByDID (exec, did) {
    // Check if Certificate is wellformed
    if (Utils.verifyHexString(did) === false) {
      return false
    }
    const allCids = await exec.api.query.idSpace.certificates.entries()
    const cids = allCids
      .map((v) => {
        const data = JSON.parse(v[1])
        if (data.did_owner === did && data.block_valid_to === 0) {
          const cid = '0x' + u8aToHex(v[0]).slice(100)
          return { certificate: cid, data: data }
        }
      })
    return cids
  }

  /**
   * Destructure DID into its components as version.
   *
   * @param {string} did DID to search
   * @returns {object} Certificate array
   */
  structDid (did) {
    return {
      version: did.slice(2, 4),
      network: did.slice(4, 8),
      didType: did.slice(8, 10),
      internalDid: did.slice(0, 2).concat(did.slice(10))
    }
  }
}
