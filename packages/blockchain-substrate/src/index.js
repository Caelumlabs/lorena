/* eslint-disable no-async-promise-executor */
'use strict'
const BlockchainInterface = require('@caelumlabs/blockchain')
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api')
const Utils = require('./utils')
const { bufferToU8a } = require('@polkadot/util')
const SubstrateBlockchainTypes = require('./types')
const Executor = require('./executor')
const DID = require('./dids')
const Balance = require('./balance')
const Process = require('./process')
const Tokens = require('./tokens')

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
    // Initialize all needed classes
    this.exec = new Executor(server)
    this.dids = new DID()
    this.balance = new Balance()
    this.process = new Process()
    this.tokens = new Tokens()
    this.keypair = {}
  }

  // Blockchain execution related functions

  /**
   * Connect with the Blockchain.
   *
   * @returns {boolean} success
   */
  async connect () {
    const result = await this.exec.connect()
    if (result === undefined || result === null) {
      return false
    }
    return true
  }

  /**
   * Disconnect from Blockchain.
   */
  disconnect () {
    this.exec.disconnect()
  }

  /**
   * Get Metadata.
   * Get the State Metadata.
   *
   * @returns {Array} array of CIDs
   */
  async getMetadata () {
    return await this.exec.getMetadata()
  }

  // Keys related functions

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
  getAddress (seed = null) {
    if (seed == null) {
      return this.keypair.address
    }
    const keyring = new Keyring({ type: 'sr25519' })
    const keypair = keyring.addFromUri(seed)
    return keypair.address
  }

  // The following functions deal with native blockchain tokens
  // Gets and sets token balances

  /**
   * Balance of Tokens
   *
   * @param {string} address Address to send tokens to
   * @returns {*} balance and nonce
   */
  async addrState (address = false) {
    return this.balance.addrState(this.exec, this.keypair, address)
  }

  /**
   * Transfer Tokens
   *
   * @param {string} addrTo Address to send tokens to
   * @param {*} amount Amount of tokens
   * @returns {Promise} of sending tokens
   */
  async transferTokens (addrTo, amount) {
    return this.balance.transferTokens(this.exec, this.keypair, addrTo, amount)
  }

  /**
   * Transfer Tokens
   *
   * @param {string} addrTo Address to send tokens to
   * @param {*} amount Amount of tokens
   * @returns {Promise} of sending tokens
   */
  async transferTokensNoFees (addrTo, amount) {
    return this.balance.transferTokensNoFees(this.exec, this.keypair, addrTo, amount)
  }

  /**
   * Transfer All Tokens
   *
   * @param {string} addrTo Address to send tokens to
   * @returns {Promise} of sending tokens
   */
  async transferAllTokens (addrTo) {
    return this.balance.transferAllTokens(this.exec, this.keypair, addrTo)
  }

  
  /**
   * Transfer All Tokens
   *
   */
  async createOwnAdminToken (id, admin, minBalance) {
    return this.tokens.createOwnAdminToken(this.exec, this.keypair, id, admin, minBalance)
  }

  // DID and CID functions

  /**
   * Registers Did in Substrate.
   *
   * @param {string} did DID
   * @param {string} accountTo Account to assign DID
   * @param {number} level Level to assign
   * @returns {Promise} of transaction
   */
  async registerDid (did, accountTo, level) {
    return await this.dids.registerDid(this.exec, this.keypair, did, accountTo, level)
  }
  /**
   * Registers aa Arweave storage Address (Vec<u8>)for a DID
   *
   * @param {string} did DID
   * @param {object} storageAddress Arweave storage address (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async setStorageAddress (did, storageAddress) {
    return await this.dids.setStorageAddress(this.exec, this.keypair, did, storageAddress)
  }

  /**
   * Registers a Vec<u8> (of the DID document) for a DID
   *
   * @param {string} did DID
   * @param {object} diddocHash Did document Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async registerDidDocument (did, diddocHash) {
    return await this.dids.registerDidDocument(this.exec, this.keypair, did, diddocHash)
  }

  /**
   * Rotate Key : changes the current key for a DID
   * Assumes Key Type = 0
   *
   * @param {string} did DID
   * @param {object} pubKey Public Key to be rotated (Vec<u8>)
   * @param {number} typ Public Key type. Defaults to zero
   * @returns {Promise} Result of the transaction
   */
  async rotateKey (did, pubKey, typ = 0) {
    return await this.dids.rotateKey(this.exec, this.keypair, did, pubKey, typ)
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
    return await this.dids.rotateKeyType(this.exec, this.keypair, did, pubKey, typ)
  }

  /**
   * Change DID owner.
   *
   * @param {string} did DID
   * @param {string} newOwner New owner's Account (AccountId)
   * @returns {Promise} Result of the transaction
   */
  async changeOwner (did, newOwner) {
    return await this.dids.changeOwner(this.exec, this.keypair, did, newOwner)
  }

  /**
   * Assign a Credential for a DID
   *
   * @param {string} did DID
   * @param {object} credential Credential Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async assignCredential (did, credential) {
    return await this.dids.assignCredential(this.exec, this.keypair, did, credential)
  }

  /**
   * Remove a Credential for a DID
   *
   * @param {string} did DID
   * @param {object} credential Credential Hash (Vec<u8>)
   * @returns {Promise} Result of the transaction
   */
  async removeCredential (did, credential) {
    return await this.dids.removeCredential(this.exec, this.keypair, did, credential)
  }

  /**
   * Remove DID.
   *
   * @param {string} did DID
   * @returns {Promise} Result of the transaction
   */
  async removeDid (did) {
    return await this.dids.removeDid(this.exec, this.keypair, did)
  }

  /**
   * Get Public Key from Did.
   *
   * @param {string} did DID
   * @returns {Promise} of public key
   */
  async getDidData (did) {
    return await this.dids.getDidData(this.exec, did)
  }

  /**
   * Get Owner Account of a DID.
   *
   * @param {string} did DID
   * @returns {string} public key in hex format
   */
  async getOwnerFromDid (did) {
    return await this.dids.getOwnerFromDid(this.exec, did)
  }

  /**
   * Get DID from Owner Account.
   *
   * @param {string} owner DID
   * @returns {string} DID
   */
  async getDidFromOwner (owner = null) {
    const execOwner = owner == null ? this.keypair.address : owner
    return await this.dids.getDidFromOwner(this.exec, execOwner)
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
    return await this.dids.getActualDidKey(this.exec, did, typ)
  }

  /**
   * Get Public Key of specific type from Did.
   *
   * @param {string} did DID
   * @param {number} typ Public Key type
   * @returns {string} Actual Key
   */
  async getActualDidKeyType (did, typ) {
    return await this.dids.getActualDidKeyType(this.exec, did, typ)
  }

  /**
   * Retrieves the Hash of a Did Document for a DID
   *
   * @param {string} did DID
   * @returns {string} hash in Base64 format
   */
  async getDidDocHash (did) {
    return await this.dids.getDidDocHash(this.exec, did)
  }

  /**
   * Adds a CID.
   * DID to assign the CID. By default is Null and the CID
   * will be assigned to the DID of the sender transaction account
   *
   * @param {string} cid CID
   * @param {string} did DID to assign the new CID (Must exists)
   * @returns {Promise} of transaction
   */
  async addCid (cid, did = null, max_hids = 0) {
    return await this.dids.addCid(this.exec, this.keypair, cid, did, max_hids)
  }

  /**
   * Removes a CID.
   * DID of the CIDs owner. By default is Null and the CID
   * must be assigned to the DID of the sender transaction account
   *
   * @param {string} cid CID
   * @param {string} did DID of the CIDs owner if providede
   * @returns {Promise} of transaction
   */
  async deleteCid (cid, did = null) {
    return await this.dids.deleteCid(this.exec, this.keypair, cid, did)
  }

  /**
   * Get all CIDs.
   * Get the whole CIDs collection, including deleted.
   *
   * @returns {Array} array of CIDs
   */
  async getCIDs () {
    return await this.dids.getCIDs(this.exec)
  }

  /**
   * Get all valid CIDs.
   * Get all CIDs that are not deleted.
   *
   * @returns {Array} array of CIDs
   */
  async getValidCIDs () {
    return await this.dids.getValidCIDs(this.exec)
  }

  /**
   * Get CID by key.
   * Get CID data is key exists, else return null.
   * Because is an ordered array, we use a binary search
   *
   * @param {string} cid CID
   * @returns {string} CID struct or null
   */
  async getCIDByKey (cid) {
    return await this.dids.getCIDByKey(this.exec, cid)
  }

  /**
   * Get all valid CIDs that belongs to a DID.
   * Get a collections of CID data that belongs to a DID.
   * (Can be empty)
   *
   * @param {string} did DID to search
   * @returns {object} CID array
   */
  async getCIDsByDID (did) {
    return await this.dids.getCIDsByDID(this.exec, did)
  }

  /**
   * Starts a Process.
   * This must be the first call when a recipe o process is being executed
   * all other execution subprocesses, steps or documents depends on it
   * DID is the DID of the executor of the process
   * Hash is the hash of the process root node
   *
   * @param {string} did DID
   * @param {string} hash Process node hash
   * @returns {Promise} of transaction
   */
  async startProcess (did, hash) {
    return await this.process.startProcess(this.exec, this.keypair, did, hash)
  }

  /**
   * Starts a SubProcess.
   * A SubProcess This must be the first call when a recipe o process is being executed
   * all other execution subprocesses, steps or documents depends on it
   * DID is the DID of the executor of the process
   * Hash is the hash of the process root node
   *
   * @param {string} did DID
   * @param {string} hash Process node hash
   * @param {string} parentHash Has of the parent Process or SubProcess
   * @returns {Promise} of transaction
   */
  async startSubprocess (did, hash, parentHash) {
    return await this.process.startSubprocess(this.exec, this.keypair, did, hash, parentHash)
  }

  /**
   * Starts a Step.
   * A SubProcess This must be the first call when a recipe o process is being executed
   * all other execution subprocesses, steps or documents depends on it
   * DID is the DID of the executor of the process
   * Hash is the hash of the process root node
   *
   * @param {string} did DID
   * @param {string} hash Process node hash
   * @param {string} parentHash Has of the parent Process or SubProcess
   * @returns {Promise} of transaction
   */
  async startStep (did, hash, parentHash) {
    return await this.process.startStep(this.exec, this.keypair, did, hash, parentHash)
  }

  /**
   * Adds a Document.
   * A SubProcess This must be the first call when a recipe o process is being executed
   * all other execution subprocesses, steps or documents depends on it
   * DID is the DID of the executor of the process
   * Hash is the hash of the process root node
   *
   * @param {string} did DID
   * @param {string} hash Process node hash
   * @param {string} parentHash Has of the parent Process or SubProcess
   * @returns {Promise} of transaction
   */
  async addDocument (did, hash, parentHash) {
    return await this.process.addDocument(this.exec, this.keypair, did, hash, parentHash)
  }

  /**
   * Adds an Attachment to a Document.
   * A SubProcess This must be the first call when a recipe o process is being executed
   * all other execution subprocesses, steps or documents depends on it
   * DID is the DID of the executor of the process
   * Hash is the hash of the process root node
   *
   * @param {string} did DID
   * @param {string} hash Process node hash
   * @param {string} parentHash Has of the parent Process or SubProcess
   * @returns {Promise} of transaction
   */
  async addAttachment (did, hash, parentDocHash) {
    return await this.process.addAttachment(this.exec, this.keypair, did, hash, parentDocHash)
  }

  /**
   * Obtain the process node data
   *
   * @param {object} exec Executor class.
   * @param {string} hash Process node hash
   * @returns {Promise} of transaction
   */
  async getProcessNode(hash) {
    return await this.process.getProcessNode(this.exec, hash)
  }

  /**
   * Resolve the path from root to given node.
   * A SubProcess This must be the first call when a recipe o process is being executed
   * all other execution subprocesses, steps or documents depends on it
   * DID is the DID of the executor of the process
   * Hash is the hash of the process root node
   *
   * @param {string} hash Process node hash
   * @returns {Promise} of transaction
   */
  async pathTo (hash) {
    return await this.process.pathTo(this.exec, this.keypair, hash)
  }

  /**
   * Giving any node of a process tree, resolves
   * to the full process tree.
   * A SubProcess This must be the first call when a recipe o process is being executed
   * all other execution subprocesses, steps or documents depends on it
   * DID is the DID of the executor of the process
   * Hash is the hash of the process root node
   *
   * @param {string} hash Process node hash
   * @returns {Promise} of transaction
   */
  async getFullProcessTree (hash) {
    return await this.process.getFullProcessTree(this.exec, this.keypair, hash)
  }

  // Functions deling with tokens

  /**
   * Issue a new class of fungible tokens from a public origin.
   * This new token class has no tokens initially and its owner is the origin.
   * The origin must be Signed (Keypair) and the sender must have sufficient funds free.
   * Funds of sender are reserved by `TokenDeposit`.
   *
   * Parameters:
   * - `id`: The identifier of the new token. This must not be currently in use to identify an existing token.
   * - `admin`: The admin of this class of tokens. The admin is the initial address of each member of the token class's admin team.
   * - `minBalance`: The minimum balance of this new token that any single account must have. 
   *    If an account's balance is reduced below this, then it collapses to zero.
   *
   * @param {number} id The identifier of the new token. 
   * @param {object} admin The admin of this class of tokens. 
   * @param {number} minBalance The minimum balance.
   * @returns {Promise} of transaction
   */
  async createNewToken (id, admin, minBalance) {
    return await this.tokens.createNewToken(this.exec, this.keyring, id, admin, minBalance)
  }

  /**
   * Issue a new class of fungible tokens from a privileged origin.
   * This new token class has no tokens initially.
   * The origin must conform to `ForceOrigin`.
   * Unlike `create`, no funds are reserved.
   *
   * - `id`: The identifier of the new token. This must not be currently in use to identify an existing token.
   * - `owner`: The owner of this class of tokens. The owner has full superuser permissions over this token, 
   *    but may later change and configure the permissions using `transfer_ownership`and `set_team`.
   * - `isSufficient`: Controls that the account should have sufficient tokens free.
   * - `minBalance`: The minimum balance of this new token that any single account must have. 
   *    If an account's balance is reduced below this, then it collapses to zero.
   *
   * @param {number} id The identifier of the new token. 
   * @param {object} owner The owner of this class of tokens. 
   * @param {bool} isSufficient Controls that the account should have sufficient tokens free. 
   * @param {number} minBalance The minimum balance.
   * @returns {Promise} of transaction
   */
  async forceCreateToken (id, owner, isSufficient, minBalance) {
    return await this.tokens.forceCreateToken(this.exec, this.keyring, id, owner, isSufficient, minBalance)
  } 

  /**
   * Destroy a class of fungible tokens.
   * The origin must conform to `ForceOrigin` or must be Signed and the sender must be the
   * owner of the token `id`.
   *
   * - `id`: The identifier of the token to be destroyed. This must identify an existing token.
   *   Emits `Destroyed` event when successful.
   * - `witness`: The identifier of the token to be destroyed. This must identify an existing token.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} witness The identifier of the token to be destroyed.. 
   * @returns {Promise} of transaction
   */
  async destroyToken (id, witness) {
    return await this.tokens.destroyToken(this.exec, this.keyring, id, witness)
  } 

  /**
   * Mint tokens of a particular class.
   * The origin must be Signed and the sender must be the Issuer of the token `id`.
   * - `id`: The identifier of the token to have some amount minted.
   * - `beneficiary`: The account to be credited with the minted tokens.
   * - `amount`: The amount of the token to be minted.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} beneficiary The account to be credited with the minted tokenss. 
   * @param {number} amount The amount of the token to be minted. 
   * @returns {Promise} of transaction
   */
  async mintToken (id, beneficiary, amount) {
    return await this.tokens.mintToken(this.exec, this.keyring, id, beneficiary, amount)
  } 

  /**
   * Reduce the balance of `who` by as much as possible up to `amount` tokens of `id`.
   * Origin must be Signed and the sender should be the Manager of the token `id`.
   * Bails with `BalanceZero` if the `who` is already dead.
   *
   * - `id`: The identifier of the token to have some amount burned.
   * - `who`: The account to be debited from.
   * - `amount`: The maximum amount by which `who`'s balance should be reduced.
   *
   *    Modes: Post-existence of `who`; Pre & post Zombie-status of `who`.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} who The account to be debited from. 
   * @param {number} amount The maximum amount by which `who`'s balance should be reduced. 
   * @returns {Promise} of transaction
   */
  async burnToken (id, who, amount) {
    return await this.tokens.burnToken(this.exec, this.keyring, id, who, amount)
  } 

  /**
   * Move some tokens from the sender account to another.
   *
   * - `id`: The identifier of the token to have some amount transferred.
   * - `target`: The account to be credited.
   * - `amount`: The amount by which the sender's balance of tokens should be reduced
   * - `target`'s balance increased. The amount actually transferred may be slightly greater in
   *    the case that the transfer would otherwise take the sender balance above zero but below
   *    the minimum balance. Must be greater than zero.
   *
   * Modes: Pre-existence of `target`; Post-existence of sender; Prior & post zombie-status
   * of sender; Account pre-existence of `target`.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} target The account to be credited. 
   * @param {number} amount The amount by which the sender's balance of tokens should be reduced. 
   * @returns {Promise} of transaction
   */
  async transferToken (id, target, amount) {
    return await this.tokens.transferToken(this.exec, this.keyring, id, target, amount)
  } 

  /**
   * Move some tokens from the sender account to another, keeping the sender account alive.
   *
   * - `id`: The identifier of the token to have some amount transferred.
   * - `target`: The account to be credited.
   * - `amount`: The amount by which the sender's balance of tokens should be reduced 
   * - `target`'s balance increased. The amount actually transferred may be slightly greater in
   *    the case that the transfer would otherwise take the sender balance above zero but below
   *    the minimum balance. Must be greater than zero.
   * Modes: Pre-existence of `target`; Post-existence of sender; Prior & post zombie-status
   * of sender; Account pre-existence of `target`.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} target The amount actually transferred may be slightly greater. 
   * @param {number} amount The amount actually transferred. 
   * @returns {Promise} of transaction
   */
  async transferTokenKeepAlive (id, target, amount) {
    return await this.tokens.transferTokenKeepAlive(this.exec, this.keyring, id, target, amount)
  } 

  /**
   * Move some tokens from one account to another.
   * The sender should be the Admin of the token `id`.
   *
   * - `id`: The identifier of the token to have some amount transferred.
   * - `source`: The account to be debited.
   * - `dest`: The account to be credited.
   * - `amount`: The amount by which the `source`'s balance of tokens should be reduced and
   * - `dest`'s balance increased. The amount actually transferred may be slightly greater in
   * the case that the transfer would otherwise take the `source` balance above zero but
   * below the minimum balance. Must be greater than zero.
   * Modes: Pre-existence of `dest`; Post-existence of `source`; Prior & post zombie-status
   * of `source`; Account pre-existence of `dest`.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} source The account to be debited. 
   * @param {object} dest The account to be credited. 
   * @param {number} amount The amount by which the `source`'s balance of tokens should be reduced. 
   * @returns {Promise} of transaction
   */
  async forceTransferToken (id, source, dest, amount) {
    return await this.tokens.forceTransferToken(this.exec, this.keyring, id, source, dest, amount)
  } 

  /**
   * Disallow further unprivileged transfers from an account.
   * Sender should be the Freezer of the token `id`.
   *
   * - `id`: The identifier of the token to be frozen.
   * - `who`: The account to be frozen.
   *
   * @param {number} id The identifier of the token. 
   * @param {string} who The account to be frozen. 
   * @returns {Promise} of transaction
   */
  async freezeAccountForToken (id, who) {
    return await this.tokens.freezeAccountForToken(this.exec, this.keyring, id, who)
  } 

  /**
   * Allow unprivileged transfers from an account again.
   * Sender should be the Admin of the token `id`.
   *
   * - `id`: The identifier of the token to be frozen.
   * - `who`: The account to be unfrozen.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} who The account to be unfrozen. 
   * @returns {Promise} of transaction
   */
  async unfrozenAccountForToken (id, who) {
    return await this.tokens.unfrozenAccountForToken(this.exec, this.keyring, id, who)
  } 

  /**
   * Disallow further unprivileged transfers for the token class.
   * Sender should be the Freezer of the token `id`.
   *
   * - `id`: The identifier of the token to be frozen.
   *
   * @param {number} id The identifier of the token. 
   * @returns {Promise} of transaction
   */
  async freezeToken (id) {
    return await this.tokens.freezeToken(this.exec, this.keyring, id)
  } 

  /**
   * Allow unprivileged transfers for the token again.
   * Sender should be the Admin of the token `id`.
   *
   * - `id`: The identifier of the token to be frozen.
   *
   * @param {number} id The identifier of the token. 
   * @returns {Promise} of transaction
   */
  async unfrozenToken (id) {
    return await this.tokens.unfrozenToken(this.exec, this.keyring, id)
  } 

  /**
   * Change the Owner of a token.
   * Sender should be the Owner of the token `id`.
   *
   * - `id`: The identifier of the token.
   * - `owner`: The new Owner of this token.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} owner The new Owner of this token. 
   * @returns {Promise} of transaction
   */
  async transferTokenOwnership (id, owner) {
    return await this.tokens.transferTokenOwnership(this.exec, this.keyring, id, owner)
  } 

  /**
   * Change the Issuer, Admin and Freezer of a token.
   * Sender should be the Owner of the token `id`.
   *
   * - `id`: The identifier of the token to be frozen.
   * - `issuer`: The new Issuer of this token.
   * - `admin`: The new Admin of this token.
   * - `freezer`: The new Freezer of this token.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} issuer The new Issuer of this token. 
   * @param {object} admin The new Admin of this token. 
   * @param {object} freezer The new Freezer of this toke. 
   * @returns {Promise} of transaction
   */
  async setTokenTeam (id, issuer, admin, freezer) {
    return await this.tokens.setTokenTeam(this.exec, this.keyring, id, issuer, admin, freezer)
  } 

  /**
   * Set the metadata for a token.
   * Sender should be the Owner of the token `id`.
   *
   * Funds of sender are reserved according to the formula:
   * `MetadataDepositBase + MetadataDepositPerByte * (name.len + symbol.len)` taking into
   * account any already reserved funds.
   *
   * - `id`: The identifier of the token to update.
   * - `name`: The user friendly name of this token. Limited in length by `StringLimit`.
   * - `symbol`: The exchange symbol for this token. Limited in length by `StringLimit`.
   * - `decimals`: The number of decimals this token uses to represent one unit.
   *
   * @param {number} id The identifier of the token. 
   * @param {string} name The user friendly name of this token. Limited in length by `StringLimit. 
   * @param {string} symbol The exchange symbol for this token. Limited in length by `StringLimit`n. 
   * @param {number} decimals The number of decimals this token uses to represent one unit. 
   * @returns {Promise} of transaction
   */
  async setTokenMetadata (id, name, symbol, decimals) {
    return await this.tokens.setTokenMetadata(this.exec, this.keyring, id, name, symbol, decimals)
  } 

  /**
   * Clear the metadata for a token.
   * Sender should be the Owner of the token `id`.
   *
   * Any deposit is freed for the token owner.
   *
   * - `id`: The identifier of the token to clear.
   *
   * @param {number} id The identifier of the token. 
   * @returns {Promise} of transaction
   */
  async clearTokenMetadata (id) {
    return await this.tokens.clearTokenMetadata(this.exec, this.keyring, id)
  } 

  /**
   * Force the metadata for a token to some value.
   *
   * Any deposit is left alone.
   *
   * - `id`: The identifier of the token to update.
   * - `name`: The user friendly name of this token. Limited in length by `StringLimit`.
   * - `symbol`: The exchange symbol for this token. Limited in length by `StringLimit`.
   * - `decimals`: The number of decimals this token uses to represent one unit.
   *
   * @param {number} id The identifier of the token. 
   * @param {atring} name The user friendly name of this token. Limited in length by `StringLimit`. 
   * @param {string} symbol The exchange symbol for this token. Limited in length by `StringLimit`. 
   * @param {number} decimals The number of decimals this token uses to represent one unit. 
   * @param {bool} isFrozen The identifier of the token. 
   * @returns {Promise} of transaction
   */
  async forceSetTokenMetadata (id, name, symbol, decimals, isFrozen) {
    return await this.tokens.forceSetTokenMetadata(this.exec, this.keyring, id, name, symbol, decimals, isFrozen)
  } 

  /**
   * Clear the metadata for a token.
   *
   * Any deposit is returned.
   *
   * - `id`: The identifier of the token to clear.
   *
   * @param {number} id The identifier of the token. 
   * @returns {Promise} of transaction
   */
  async forceClearTokenMetadata (id) {
    return await this.tokens.forceClearTokenMetadata(this.exec, this.keyring, id)
  } 

  /**
   * Alter the attributes of a given token.
   *
   * - `id`: The identifier of the token.
   * - `owner`: The new Owner of this token.
   * - `issuer`: The new Issuer of this token.
   * - `admin`: The new Admin of this token.
   * - `freezer`: The new Freezer of this token.
   * - `min_balance`: The minimum balance of this token that any single account must
   *    have. If an account's balance is reduced below this, then it collapses to zero.
   * - `is_sufficient`: Whether a non-zero balance of this token is deposit of sufficient
   *    value to account for the state bloat associated with its balance storage. If set to
   * - `true`, then non-zero balances may be stored without a `consumer` reference (and thus
   *    an ED in the Balances pallet or whatever else is used to control user-account state
   *    growth).
   * - `is_frozen`: Whether this token class is frozen except for permissioned/admin
   *    instructions.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} owner The new Owner of this token. 
   * @param {object} issuer The new Issuer of this token. 
   * @param {object} admin The new Admin of this token. 
   * @param {object} freezer The new Freezer of this token. 
   * @param {number} minBalance The minimum balance of this token. 
   * @param {bool} isSufficient Whether a non-zero balance of this token is deposit of sufficient. 
   * @param {bool} isFrozen Whether this token class is frozen except for permissioned/admin instructions. 
   * @returns {Promise} of transaction
   */
  async forceTokenStatus (id, owner, issuer, admin, freezer, minBalance, isSufficient, isFrozen) {
    return await this.tokens.forceTokenStatus(this.exec, this.keyring, id, owner, issuer, admin, freezer, minBalance, isSufficient, isFrozen)
  } 

  /**
   * Approve an amount of token for transfer by a delegated third-party account.
   *
   * Ensures that `TokenApprovalDeposit` worth of `Currency` is reserved from signing account
   * for the purpose of holding the approval. If some non-zero amount of tokens is already
   * approved from signing account to `delegate`, then it is topped up or unreserved to
   * meet the right value.
   *
   * NOTE: The signing account does not need to own `amount` of tokens at the point of
   * making this call.
   *
   * - `id`: The identifier of the token.
   * - `delegate`: The account to delegate permission to transfer token.
   * - `amount`: The amount of token that may be transferred by `delegate`. If there is
   *    already an approval in place, then this acts additively.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} delegate The account to delegate permission to transfer token. 
   * @param {number} amount The amount of token that may be transferred by `delegate`. 
   * @returns {Promise} of transaction
   */
  async approveTokenTransfer (id, delegate, amount) {
    return await this.tokens.approveTokenTransfer(this.exec, this.keyring, id, delegate, amount)
  } 

  /**
   * Cancel all of some token approved for delegated transfer by a third-party account.
   *
   * Origin must be Signed and there must be an approval in place between signer and `delegate`.
   *
   * Unreserves any deposit previously reserved by `approve_transfer` for the approval.
   *
   * - `id`: The identifier of the token.
   * - `delegate`: The account delegated permission to transfer token.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} delegate The account delegated permission to transfer token. 
   * @returns {Promise} of transaction
   */
  async cancelApprovalTokenTransfer (id, delegate) {
    return await this.tokens.cancelApprovalTokenTransfer(this.exec, this.keyring, id, delegate)
  } 

  /**
   * Cancel all of some token approved for delegated transfer by a third-party account.
   * Origin must be either ForceOrigin or Signed origin with the signer being the Admin
   * account of the token `id`.
   *
   * Unreserves any deposit previously reserved by `approve_transfer` for the approval.
   *
   * - `id`: The identifier of the token.
   * - `delegate`: The account delegated permission to transfer token.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} owner The new Owner of this token. 
   * @param {object} delegate The account delegated permission to transfer token. 
   * @returns {Promise} of transaction
   */
  async forceCancelApprovalTokenTransfer (id, owner, delegate) {
    return await this.tokens.forceCancelApprovalTokenTransfer(this.exec, this.keyring, id, owner, delegate)
  } 

  /**
   * Transfer some token balance from a previously delegated account to some third-party
   * account.
   * Origin must be Signed and there must be an approval in place by the `owner` to the
   * signer.
   *
   * If the entire amount approved for transfer is transferred, then any deposit previously
   * reserved by `approve_transfer` is unreserved.
   *
   * - `id`: The identifier of the token.
   * - `owner`: The account which previously approved for a transfer of at least `amount` and
   *    from which the token balance will be withdrawn.
   * - `destination`: The account to which the token balance of `amount` will be transferred.
   * - `amount`: The amount of tokens to transfer.
   *
   * @param {number} id The identifier of the token. 
   * @param {object} owner The account which previously approved for a transfer of at least `amount`. 
   * @param {object} destination The account to which the token balance of `amount` will be transferred. 
   * @param {number} amount The amount of tokens to transfer. 
   * @returns {Promise} of transaction
   */
  async transferTokenApproval (id, owner, destination, amount) {
    return await this.tokens.transferTokenApproval(this.exec, this.keyring, id, owner, destination, amount)
  } 

  /**
   * Subscribe to register events
   *
   * @param {string} eventMethod Event to listen to
   * @returns {Promise} Result of the transaction
   */
  async wait4Event (eventMethod) {
    return this.exec.wait4Event(eventMethod)
  }
}
