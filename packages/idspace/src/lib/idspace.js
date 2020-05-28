// Librtaries
const { start, stop } = require('nact')
var path = require('path')

// Lorena Components
const Comms = require('@lorena/comms')
const Storage = require('@lorena/storage')
const Crypto = require('@lorena/crypto')
const Blockchain = require('@lorena/blockchain-substrate')
const Credential = require('@lorena/credentials')
const didResolver = require('@lorena/resolver')

// Local Components
const DB = require('./db/lorena-db-sqlite')
const DBM = require('./db/lorena-migrate-db')
const MAIL = require('./utils/sendgrid')
const ContactsApi = require('../api/contacts')
// const Register = require('./lorena-register')
// const Recipe = require('./lorena-recipe')

// Debug
var debug = require('debug')('idspace:debug:main')
var error = require('debug')('idspace:error:main')

/**
 * Javascript Class to interact with Lorena.
 */
module.exports = class IDSpace {
  /**
   * Builds an IDSpace Class.
   *
   * @param {object} options Options for the IDSpace.
   * @returns {IDSpace} a new Instance of IDSpace
   */
  static async build (options) {
    // Servers.
    const substrateServer = didResolver.getInfoForNetwork(options.network).blockchainEndpoint
    const matrixServer = didResolver.getInfoForNetwork(options.network).matrixEndpoint

    // Context.
    const context = {
      blockchain: new Blockchain(substrateServer),
      database: await new DB(options.did, path.join(options.dataPath, options.did + '.db')),
      comms: await new Comms(matrixServer),
      crypto: new Crypto(true),
      storage: new Storage(),
      mail: new MAIL(),
      info: options,
      nextBatch: ''
    }
    // New IDSpace.
    if (options.newIDSpace) {
      await context.database.init()
    } else {
      // Migration available?
      const dbm = new DBM(options.did, options.dataPath)
      const result = await dbm.doMigration()
      debug('DB Migration: ' + result)
    }
    await context.blockchain.connect()
    return new IDSpace(context)
  }

  /**
   * Creates a DID Object
   *
   * @param {*} options for creation
   */
  constructor (context) {
    this.actors = []
    this.context = context
    this.system = start()
  }

  /**
   * Initializes a new IDSpace.
   *
   * @param {string} did DID to use
   * @param {string} password Did Password
   * @returns {*} this
   */
  async init () {
    // Create DID
    await this.initCrypto()

    // Comms : MATRIX.
    debug('Init Matrix')
    const matrixUser = this.context.info.matrixUser
    if (await this.context.comms.available(matrixUser)) {
      await this.context.comms.register(matrixUser, this.context.info.password)
    } else throw (new Error('Could not create a new Matrix user'))
    await this.context.comms.connect(this.context.info.matrixUser, this.context.info.password)

    // DIDDOC
    const didDocument = new Credential.DidDoc(this.context.info.w3cDID)
    this.context.info.diddoc = await this.context.storage.put(didDocument.subject)

    // Blockchain.
    // await this.context.blockchain.setKeyring(this.context.info.tempSeed)
    // const newAccount = this.context.blockchain.getAddress(this.context.info.wallet.mnemonic)
    // await this.context.blockchain.changeOwner(this.context.info.did, newAccount)
    // await this.context.blockchain.transferAllTokens(newAccount)
    await this.context.blockchain.setKeyring(this.context.info.wallet.mnemonic)
    // await this.context.blockchain.registerDidDocument(this.context.info.did, this.context.info.diddoc)
    // await this.context.blockchain.rotateKey(this.context.info.did, this.context.info.wallet.keyPair.publicKey)

    // Blockchain.
    await this.saveBasicSettings()

    // Set the first admin
    const secretCode = await this.context.crypto.random(32)
    await this.context.database.set('first_admin', secretCode)
    debug(`First Admin secret code: ${secretCode}`)

    // Send EMAIL to the first admin with : DID, DIDDOC, secretCode
  }

  /**
   * Init Crypto
   */
  async initCrypto (did) {
    debug('Crypto : new Matrix user & Wallet')
    // Get matrix user
    const matrixUser = this.context.crypto.random(12)
    this.context.info.matrixUser = matrixUser.toLowerCase()
    this.context.info.wallet = this.context.crypto.newKeyPair()
    this.context.info.w3cDID = 'did:lor:' + this.context.info.network + ':' + this.context.info.did
  }

  /**
   * Saves basic information about the DID
   *
   * @param {string} alias Name for the subject
   */
  async saveBasicSettings () {
    const info = this.context.info
    await ContactsApi.insertContact(this.context, {
      did: info.did,
      diddoc: info.diddoc,
      matrixUser: info.matrixUser,
      network: info.network,
      type: 'me',
      status: 'accepted'
    })
    await ContactsApi.addKey(this.context, info.did, 'crypto:keypair', info.wallet, 1)
    await this.context.database.set('next_batch', '')
  }

  /**
   * Open
   */
  async open () {
    // await this.initRegister()
    const contact = await ContactsApi.getContact(this.context, this.context.info.did)
    this.context.info.diddoc = contact.diddoc
    this.context.info.matrixUser = contact.matrixUser
    this.context.info.wallet = await ContactsApi.getKey(this.context, this.context.info.did, 'crypto:keypair', 1)
    await this.context.comms.connect(this.context.info.matrixUser, this.context.info.password)
    await this.context.blockchain.setKeyring(this.context.info.wallet.mnemonic)
    this.nextBatch = await this.context.database.get('next_batch')
  }

  /**
   * Loads initial Recipes.
   */
  async initRegister () {
    this.context.register = new Register(this.system, this.context.database, true)
    // first load system recipes
    await this.loadActors(path.join(__dirname, '../recipes_installed'))
    await this.loadActors(path.join(__dirname, '../recipes'))
  }

  /**
   * Load all available recipes.
   *
   * @param {string} actorsPath Where recipes live.
   */
  async loadActors (actorsPath) {
    debug('Recipes : ' + actorsPath)
    await this.context.register.loadActors(actorsPath)
  }

  /**
   * Close everything
   */
  close () {
    stop(this.system)
    this.context.blockchain.disconnect()
    this.context.blockchain = false
    this.context.database.close()
    this.context.database = false
  }

  /**
   * Listen to events.
   */
  async listen () {
    let contact, service, recipeService, recipeInfo
    const batch = await this.context.comms.events(this.nextBatch)
    this.nextBatch = batch.nextBatch
    batch.events.forEach(async (event) => {
      contact = await this.context.database.getContactByRoomId(event.roomId)
      if (contact !== false) {
        debug('Incoming event : ' + event.type)
        switch (event.type) {
          case 'msg-text':
            if (contact.status === 'accepted' & contact.type === 'client') {
              this.parseCommand(event, contact)
            }
            break
          case 'msg-action':
            this.parseAction(event, contact)
            break
          case 'contact-add':
            if (contact.status === 'invited' && contact.recipeId === 0) {
              debug('Added : ' + contact.type)
              await this.context.database.updateContact(contact.roomId, 'join')
            } else if (contact.status === 'invited' && contact.recipeId !== 0 && contact.type === 'contact') {
              debug('Added : contact')
              recipeInfo = await this.context.database.getRecipe(contact.recipeId)
              if (recipeInfo && recipeInfo.status === 'open') {
                service = this.context.register.resolveAction('contact-add')
                recipeService = new Recipe(event, this.context.info, contact, service, this.context, this.context.info.kZpair)
                await recipeService.load(recipeInfo, {})
                await this.context.database.updateContact(contact.roomId, 'join')
              }
            }
            break
          case 'contact-incoming':
            await this.context.comms.acceptConnection(event.roomId)
            break
        }
      } else if (event.type === 'contact-incoming') {
        // TODO: check type. Not accepting when leaving
        const m = this.context.comms.extractDid(event.sender)
        this.context.comms.acceptConnection(event.roomId)
          .then(async (res) => {
            await this.context.database.insertContact({
              room_id: event.roomId,
              did: 'unknown',
              matrixUser: m.matrixUser,
              network: m.network,
              createdBy: event.sender,
              type: 'contact',
              name: '',
              alias: '',
              recipeId: 0
            })
          })
          .catch((e) => {
            debug(e)
            error('Invalid incoming connection')
          })
      } else {
      }
    })
    if (this.context.database) {
      await this.context.database.set('next_batch', this.nextBatch)
    } else {
      // debug('shutting down...')
    }
  }

  /**
   * Parse a text command and process the answer
   *
   * @param {object} event Event being processed
   * @param {object} contact Contact sending the event
   * @returns {boolean} success
   */
  async parseAction (event, contact) {
    const action = JSON.parse(event.payload.body)
    const recipeId = parseInt(action.recipeId)
    return this.runRecipe(action, recipeId, event, contact, 'm.action')
  }

  /**
   * Parse a text command and process the answer
   *
   * @param {object} event Event being processed
   * @param {object} contact Contact sending the event
   * @returns {boolean} success
   */
  async parseCommand (event, contact) {
    const command = event.payload.body.split(' ')
    const recipe = command[0].toLowerCase()
    command.shift()

    // check if recipe is versioned
    let name = recipe
    let version
    if (name.indexOf(':') !== -1) {
      [name, version] = recipe.split(':', 2)
    }

    let recipeId
    if (command[0] === 'recipe') {
      recipeId = parseInt(command[1])
      command.shift()
      command.shift()
    }

    const action = {
      recipe: name,
      version: version,
      payload: command
    }

    return this.runRecipe(action, recipeId, event, contact, 'm.text')
  }

  /**
   * runs the Recipe
   *
   * @param {string} action action to be executed
   * @param {number} recipeId recipe ID
   * @param {object} event recipe info
   * @param {object} contact contact for this recipe
   * @param {string} type Type of recipe
   * @returns {boolean} success
   */
  async runRecipe (action, recipeId, event, contact, type) {
    let recipe = action.recipe
    if (action.version) {
      recipe = recipe + ':' + action.version
    }

    // Does the service exist?
    const service = this.context.register.resolveAction(action.recipe, action.version)
    if (!service) {
      error(`Recipe not found ${recipe}`)
      return
    }
    const access = await this.context.auth.checkAccess(contact, service.name, service.version)
    if (!access) {
      error(`Access not permitted to ${recipe}`)
      return
    }

    const recipeService = new Recipe(event, this.context.info, contact, service, this.context, this.context.info.kZpair)
    // Continue an existing Recipe.
    if (recipeId) {
      const recipeInfo = await this.context.database.getRecipe(recipeId)
      if (recipeInfo && recipeInfo.status === 'open') {
        try {
          debug('Run recipe : ' + action.recipe + '(' + recipeId + ')')
          await recipeService.load(recipeInfo, action.payload)
        } catch (err) {
          error(`Error processing recipe ${recipe} step`)
          error(err)
          return true
        }
      }
    } else {
      recipeService.start(action.recipe, contact, action.payload, type, action.threadId, action.threadRef)
        .then((recipeId) => {
          debug(`Recipe ${recipe} started ${recipeId}`)
        })
        .catch((e) => {
          debug(e)
          error(`Error processing recipe ${recipe}`)
          return true
        })
    }
  }
}
