/* eslint-disable no-async-promise-executor */
'use strict'
const BlockchainInterface = require('@caelumlabs/blockchain')
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
const Utils = require('./utils')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const { bufferToU8a } = require('@polkadot/util')

// Debug
var debug = require('debug')('did:debug:sub')
/**
 * Javascript Class to interact with the Blockchain.
 */
module.exports = class SubstrateLib extends BlockchainInterface {
  /**
   * Constructor
   *
   * @param {string} server Web Sockets Provider, e.g. 'ws://127.0.0.1:9944/'
   */
  constructor (server) {
    super()
    this.providerWS = server
    this.api = false
    this.keypair = {}
    this.units = 1000000000
  }

  /**
   * Connect with the Blockchain.
   *
   * @returns {boolean} success
   */
  async connect () {
    debug('connecting to ' + this.providerWS)

    // 'wss://substrate-demo.caelumlabs.com/'
    this.provider = new WsProvider(this.providerWS)
    this.api = await ApiPromise.create({
      provider: this.provider,
      types: {
        Credential: {
          credential: 'Vec<u8>',
          valid_from: 'u64',
          valid_to: 'u64'
        },
        PublicKey: {
          pub_key: 'Vec<u8>',
          valid_from: 'u64',
          valid_to: 'u64'
        },

        PublicKeyType: {
          pub_key_type: 'u16',
          pub_keys: 'Vec<PublicKey>',
          valid_from: 'u64',
          valid_to: 'u64'
        },

        DIDData: {
          owner: 'AccountId',
          did_promoter: 'Vec<u8>',
          level: 'u16',
          pub_keys: 'Vec<PublicKeyType>',
          did_doc: 'Vec<u8>',
          credentials: 'Vec<Credential>',
          valid_from: 'u64',
          valid_to: 'u64'
        }
      }
    })

    await cryptoWaitReady()

    const [chain, nodeName, nodeVersion] = await Promise.all([
      this.api.rpc.system.chain(),
      this.api.rpc.system.name(),
      this.api.rpc.system.version()
    ])

    debug(`Connected to chain ${chain} - ${nodeName} v${nodeVersion}`)
    return true
  }

  /**
   * Disconnect from Blockchain.
   */
  disconnect () {
    this.provider.disconnect()
  }

  /**
   * Sets the Keyring
   *
   * @param {string} seed Seed (12, 15, 24-digit mnemonic, or //Alice)
   * @returns {string} address
   */
  setKeyring (seed) {
    const keyring = new Keyring({ type: 'sr25519' })
    this.keypair = keyring.addFromUri(seed)
    debug('Keyring added:' + this.keypair.address)
    return this.keypair.address
  }

  getKeyring (seed) {
    const keyring = new Keyring({ type: 'sr25519' })
    return keyring.addFromUri(seed)
  }

  /**
   * Get Address
   *
   * @param {string} seed Seed (12, 15, 24-digit mnemonic, or //Alice)
   * @returns {string} address
   */
  getAddress (seed) {
    const keyring = new Keyring({ type: 'sr25519' })
    const keypair = keyring.addFromUri(seed)
    return keypair.address
  }

  /**
   * Balance of Tokens
   *
   * @param {string} address Address to send tokens to
   * @returns {*} balance and nonce
   */
  async addrState (address = false) {
    return new Promise(async (resolve) => {
      const addressTo = (address === false) ? this.keypair.address : address
      const { nonce, data: balance } = await this.api.query.system.account(addressTo)
      resolve({ balance, nonce })
    })
  }

  /**
   * Transfer Tokens
   *
   * @param {string} addrTo Address to send tokens to
   * @param {*} amount Amount of tokens
   * @returns {Promise} of sending tokens
   */
  async transferTokens (addrTo, amount) {
    return new Promise(async (resolve) => {
      const unsub = await this.api.tx.balances
        .transfer(addrTo, amount)
        .signAndSend(this.keypair, (result) => {
          if (result.status.isInBlock) {
            debug(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            debug(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            resolve(true)
            unsub()
          }
        })
    })
  }

  /**
   * Transfer All Tokens
   *
   * @param {string} addrTo Address to send tokens to
   * @returns {Promise} of sending tokens
   */
  async transferAllTokens (addrTo) {
    const current = await this.addrState()
    const amount = current.balance.free
    const info = await this.api.tx.balances.transfer(addrTo, amount).paymentInfo(this.keypair)
    return this.transferTokens(addrTo, amount.sub(info.partialFee))
  }

  /**
   * Registers Did in Substrate.
   *
   * @param {string} did DID
   * @param {string} accountTo Account to assign DID
   * @param {number} level Level to assign
   * @returns {Promise} of transaction
   */
  async registerDid (did, accountTo, level) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    const transaction = await this.api.tx.lorenaDids.registerDid(hexDID, accountTo, level)
    return await this.execTransaction(transaction)
  }

  /**
   * Registers a Vec<u8> (of the DID document) for a DID
   *
   * @param {string} did DID
   * @param {object} diddocHash Did document Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async registerDidDocument (did, diddocHash) {
    const hexDid = Utils.base64ToHex(did)
    const docHash = Utils.toUTF8Array(diddocHash)
    const transaction = await this.api.tx.lorenaDids.registerDidDocument(hexDid, docHash)
    return await this.execTransaction(transaction)
  }

  /**
   * Rotate Key : changes the current key for a DID
   * Assumes Key Type = 0
   *
   * @param {string} did DID
   * @param {object} pubKey Public Key to be rotated (Vec<u8>)
   * @param {number} typ Public Key type
   * @returns {Promise} Result of the transaction
   */
  async rotateKey (did, pubKey, typ = 0) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    // Convert pubKey to vec[u8]
    const keyArray = Utils.toUTF8Array(pubKey)
    // Call lorenaDids RotateKey function
    const transaction = await this.api.tx.lorenaDids.rotateKey(hexDID, keyArray, typ)
    return await this.execTransaction(transaction)
  }

  /**
   * Rotate Key Type: changes the current key for a specific type for a DID
   *
   * @param {string} did DID
   * @param {object} pubKey Public Key to be rotated (Vec<u8>)
   * @param {number} typ Public Key type
   * @returns {Promise} Result of the transaction
   */
  async rotateKeyType (did, pubKey, typ) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    // Convert pubKey to vec[u8]
    const keyArray = Utils.toUTF8Array(pubKey)
    // Call lorenaDids RotateKey function
    const transaction = await this.api.tx.lorenaDids.rotateKey(hexDID, keyArray, typ)
    return await this.execTransaction(transaction)
  }

  /**
   * Change DID owner.
   *
   * @param {string} did DID
   * @param {string} newOwner New owner's Account (AccountId)
   * @returns {Promise} Result of the transaction
   */
  async changeOwner (did, newOwner) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    const transaction = await this.api.tx.lorenaDids.changeDidOwner(hexDID, newOwner)
    return await this.execTransaction(transaction)
  }

  /**
   * Assign a Credential for a DID
   *
   * @param {string} did DID
   * @param {object} credential Credential Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async assignCredential (did, credential) {
    const hexDid = Utils.base64ToHex(did)
    const cred = Utils.toUTF8Array(credential)
    const transaction = await this.api.tx.lorenaDids.assignCredential(hexDid, cred)
    return await this.execTransaction(transaction)
  }

  /**
   * Remove a Credential for a DID
   *
   * @param {string} did DID
   * @param {object} credential Credential Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async removeCredential (did, credential) {
    const hexDid = Utils.base64ToHex(did)
    const cred = Utils.toUTF8Array(credential)
    const transaction = await this.api.tx.lorenaDids.removeCredential(hexDid, cred)
    return await this.execTransaction(transaction)
  }

  /**
   * Remove DID.
   *
   * @param {string} did DID
   * @returns {Promise} Result of the transaction
   */
  async removeDid (did) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    const transaction = await this.api.tx.lorenaDids.removeDid(hexDID)
    return await this.execTransaction(transaction)
  }

  /**
   * Get Public Key from Did.
   *
   * @param {string} did DID
   * @returns {Promise} of public key
   */
  async getDidData (did) {
    const hexDid = Utils.base64ToHex(did)
    const didData = await this.api.query.lorenaDids.didData(hexDid)
    return JSON.parse(didData)
  }

  /**
   * Get Owner Account of a DID.
   *
   * @param {string} did DID
   * @returns {string} public key in hex format
   */
  async getOwnerFromDid (did) {
    return await this.api.query.lorenaDids.ownerFromDid(did)
  }

  /**
   * Get Public Key from Did.
   * Assumes Key Type = 0
   *
   * @param {string} did DID
   * @param {number} typ Public Key type
   * @returns {string} Actual Key
   */
  async getActualDidKey (did, typ = 0) {
    const hexDid = Utils.base64ToHex(did)
    const result = await this.api.query.lorenaDids.publicKeyFromDid([hexDid, typ])
    return bufferToU8a(result)
    // return (result)
  }

  /**
   * Get Public Key of specific type from Did.
   *
   * @param {string} did DID
   * @param {number} typ Public Key type
   * @returns {string} Actual Key
   */
  async getActualDidKeyType (did, typ) {
    const hexDid = Utils.base64ToHex(did)
    const result = await this.api.query.lorenaDids.publicKeyFromDid([hexDid, typ])
    return bufferToU8a(result)
    // return (result)
  }

  /**
   * Retrieves the Hash of a Did Document for a DID
   *
   * @param {string} did DID
   * @returns {string} hash in Base64 format
   */
  async getDidDocHash (did) {
    const hexDID = Utils.base64ToHex(did)
    const didDoc = await this.api.query.lorenaDids.didDocumentFromDid(hexDID)
    const doc = didDoc.toString().split('x')[1].replace(/0+$/g, '')
    return Utils.hexToBase64(doc)
  }

  /**
   * Subscribe to register events
   *
   * @param {string} eventMethod Event to listen to
   * @returns {Promise} Result of the transaction
   */
  async wait4Event (eventMethod) {
    return new Promise(resolve => {
      this.api.query.system.events(events => {
        // loop through
        events.forEach(record => {
          // extract the phase, event and the event types
          const { event } = record
          const types = event.typeDef
          if (event.section === 'lorenaDids' && event.method === eventMethod) {
            for (let i = 0; i < event.data.length; i++) {
              // All events have a a type 'AccountId'
              if (types[i].type === 'AccountId') {
                resolve(JSON.parse(event.data.toString()))
              }
            }
            resolve([])
          }
        })
      })
    })
  }

  /**
   * Execute a transaction.
   *
   * @param {object} transaction Transaction to execute (Transaction)
   * @returns {Promise} result of the Transaction
   */
  async execTransaction (transaction) {
    return new Promise(async (resolve) => {
      let result = true
      console.log(this.keypair.address)
      await transaction.signAndSend(this.keypair, ({ status, events }) => {
        if (status.isInBlock || status.isFinalized) {
          const errors = events.filter(({ event: { method, section } }) =>
            section === 'system' && method === 'ExtrinsicFailed'
          )
          if (errors.length > 0) {
            errors.forEach(({ event: { data: [error, info] } }) => {
              if (error.isModule) {
                console.log(`Module error: ${Uint8Array.of(error.asModule.index, error.asModule.error)}`)
              } else {
                console.log('System error found ' + error.toString())
              }
            })
            result = false
          }
          resolve(result)
        }
      })
    })
  }
}
