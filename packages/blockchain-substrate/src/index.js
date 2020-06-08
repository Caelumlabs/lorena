/* eslint-disable no-async-promise-executor */
'use strict'
const BlockchainInterface = require('@caelumlabs/blockchain')
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
const { TypeRegistry } = require('@polkadot/types')
const { Vec } = require('@polkadot/types/codec')
const Utils = require('./utils')
const { cryptoWaitReady } = require('@polkadot/util-crypto')
const registry = new TypeRegistry()

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
        PublicKey: {
          pub_key: 'Vec<u8>',
          valid_from: 'u64',
          valid_to: 'u64'
        },

        DIDData: {
          owner: 'AccountId',
          did_promoter: 'Hash',
          level: 'u16',
          pub_keys: 'Vec<PublicKey>',
          did_doc: 'Hash',
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
            console.log(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            resolve(true)
            unsub()
          }
        })
    })
  }

  /**
   * Registers Did in Substrate .
   *
   * @param {string} did DID
   * @param {string} pubKey Zenroom Public Key
   *
   * Example:
   *    registerDid ('E348FEE8328', 'ZenroomValidPublicKey')
   */
  async registerDid (did, accountTo, level) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)

    debug('Register did : ' + did)
    debug('Assign to account : ' + accountTo)
    debug('Assigned level : ' + level)

    const transaction = await this.api.tx.lorenaDids.registerDid(hexDID, accountTo, level)
    await transaction.signAndSend(this.keypair)
  }

  /**
   * Get Public Key from Did.
   *
   * @param {string} did DID
   */
  async getDidData (did) {
    const hexDid = Utils.base64ToHex(did)
    return await this.api.query.lorenaDids.didData(hexDid)
  }

  /**
   * Get Public Key from Did.
   *
   * @param {string} did DID
   */
  async getActualKey (did) {
    const hexDid = Utils.base64ToHex(did)
    const ret = await this.api.query.lorenaDids.publicKeyFromDid(hexDid)
    return ret
  }

  /**
   * Returns the current Key.
   *
   * @param {string} did DID
   */
  async getActualDidKey (did) {
    const result = await this.getActualKey(did)
    return result.toString().split('x')[1].replace(/0+$/g, '')
  }

  /**
   * Registers a Hash (of the DID document) for a DID
   *
   * @param {string} did DID
   * @param {string} diddocHash Did document Hash
   */
  async registerDidDocument (did, diddocHash) {
    const hexDid = Utils.base64ToHex(did)
    const docHash = Utils.toUTF8Array(diddocHash)
    const transaction = await this.api.tx.lorenaDids.registerDidDocument(hexDid, docHash)
    await transaction.signAndSend(this.keypair)
  }

  /**
   * Retrieves the Hash of a Did Document for a DID
   *
   * @param {string} did DID
   */
  async getDidDocHash (did) {
    const didDoc = await this.api.query.lorenaDids.didDocumentFromDid(did)
    const doc = didDoc.toString().split('x')[1].replace(/0+$/g, '')
    return Utils.hexToBase64(doc)
  }

  /**
   * Rotate Key : changes the current key for a DID
   *
   * @param {string} did DID
   * @param {string} pubKey Public Key to register into the DID
   */
  async rotateKey (did, pubKey) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    // Convert pubKey to vec[u8]
    const keyArray = Utils.toUTF8Array(pubKey)
    // Call lorenaDids RotateKey function
    const transaction = await this.api.tx.lorenaDids.rotateKey(hexDID, keyArray)
    await transaction.signAndSend(this.keypair)
  }
}
