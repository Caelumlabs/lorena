/* eslint-disable no-async-promise-executor */
'use strict'
const BlockchainInterface = require('@lorena/blockchain')
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
   */
  async connect () {
    debug('connecting to ' + this.providerWS)

    // 'wss://substrate-demo.caelumlabs.com/'
    this.provider = new WsProvider(this.providerWS)
    this.api = await ApiPromise.create({
      provider: this.provider,
      types: {
        Identity: {
          owner: 'AccountId',
          key_index: 'u64'
        },
        Key: {
          key: 'Vec<u8>',
          diddoc: 'Vec<u8>',
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
   */
  async addrState (address = false) {
    return new Promise(async (resolve) => {
      const addrTo = (address === false) ? this.keypair.address : address
      const { nonce, data: balance } = await this.api.query.system.account(addrTo)
      resolve({ balance, nonce })
    })
  }

  /**
   * Transfer Tokens
   *
   * @param {string} addrTo Address to send tokens to
   * @param {*} ammount Ammount of tokens
   */
  async transferTokens (addrTo, ammount) {
    return new Promise(async (resolve) => {
      const unsub = await this.api.tx.balances
        .transfer(addrTo, ammount)
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
  async registerDid (did, pubKey) {
    // Convert did string to hex
    const hexDID = Utils.base64ToHex(did)
    // Convert pubKey to vec[u8]
    const arr = Utils.toUTF8Array(pubKey)
    const zkey = new Vec(registry, 'u8', arr)

    debug('Register did : ' + did)
    debug('Assign pubKey : ' + pubKey)

    const transaction = await this.api.tx.lorenaModule.registerDid(hexDID, zkey)
    await transaction.signAndSend(this.keypair)
  }

  async getActualKey (did) {
    const hexDid = Utils.base64ToHex(did)
    const identity = await this.api.query.lorenaModule.identities(hexDid)

    return this.api.query.lorenaModule.identityKeys([hexDid, identity.key_index.toString()])
  }

  /**
   * Returns the current Key.
   *
   * @param {string} did DID
   * @returns {string} The active key
   */
  async getActualDidKey (did) {
    const result = await this.getActualKey(did)
    return Utils.hexToBase64(result.key.toString().split('x')[1])
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
    const transaction = await this.api.tx.lorenaModule.registerDidDocument(hexDid, docHash)
    await transaction.signAndSend(this.keypair)
  }

  /**
   * Retrieves the Hash of a Did Document for a DID
   *
   * @param {string} did DID
   * @returns {string} the Hash
   */
  async getDidDocHash (did) {
    const identity = await this.getActualKey(did)
    const result = Utils.hexToBase64(identity.diddoc)
    return result
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
    // Call LorenaModule RotateKey function
    const transaction = await this.api.tx.lorenaModule.rotateKey(hexDID, keyArray)
    await transaction.signAndSend(this.keypair)
  }
}
