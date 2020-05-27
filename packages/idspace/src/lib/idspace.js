// Librtaries
const { start, stop } = require('nact')
var path = require('path')
const fs = require('fs')

// Lorena Components
const Comms = require('@lorena/comms')
const Storage = require('@lorena/storage')
const Crypto = require('@lorena/crypto')
const Blockchain = require('@lorena/blockchain-substrate')
const Credential = require('@lorena/credentials')

// Blockchains supported
const didResolver = require('@lorena-ssi/did-resolver')

// Local Components
const DB = require('./db/lorena-db-sqlite')
const DBM = require('./db/lorena-migrate-db')
const MAIL = require('./utils/sendgrid')
const Register = require('./lorena-register')
const Recipe = require('./lorena-recipe')

// Debug
var debug = require('debug')('did:debug:did')
var error = require('debug')('did:error:did')

/**
 * Javascript Class to interact with Lorena.
 */
module.exports = class IDSpace {
  /**
   * Creates a DID Object
   *
   * @param {*} options for creation
   */
  constructor (options) {
    this.actors = []
    this.options = options
    this.context = {
      database: false,
      blockchain: false,
      crypto: false,
      info: {
        name: '',
        did: '',
        domain: options.domain,
        matrixUser: '',
        network: options.network,
        kZpair: false,
        ...options
      }
    }

    // choose the blockchain based on the DID method
    this.context.blockchain = new Blockchain(this.substrateServer(this.context.info.network))

    // Zenroom for this DID
    this.context.crypto = new Crypto(true)
    // Init Actors in the system.
    this.system = start()
  }

  matrixServer (network = this.context.info.network) {
    return didResolver.getInfoForNetwork(network).matrixEndpoint
  }

  matrixFederation (network = this.context.info.network) {
    return `:${this.matrixServer(network).split('://')[1]}`
  }

  substrateServer (network = this.context.info.network) {
    return didResolver.getInfoForNetwork(network).blockchainEndpoint
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
   * Database - Open sqlite3 ID database
   *
   * @param {string} did did to open
   * @param {boolean} init Create new Database
   */
  async openDB (did = this.context.info.did, init = false) {
    debug('Sqlite : Open DB')
    if (init === true) {
      // Make sure directory data/ exists
      await fs.promises.mkdir(this.options.dataPath, { recursive: true })
    }
    const databasePath = path.join(this.options.dataPath, did + '.db')
    this.context.database = await new DB(did, databasePath)
    if (init === true) {
      // Create tables
      await this.context.database.init()
    } else {
      // check if DB migration must be done
      const dbm = new DBM(did, this.options.dataPath)
      const result = await dbm.doMigration()
      if (result) {
        debug('DB: Migration done')
      } else {
        debug('DB: No migration needed')
      }
    }
  }

  /**
   * Open Blockchain connection
   */
  async openBlockchain () {
    debug('Blockchain : Open Connection')
    await this.context.blockchain.connect()
  }

  /**
   * Set keyring for database
   */
  async setKeyring () {
    debug('Blockchain : Set Keyring')
    await this.context.blockchain.setKeyring(this.options.seed)
  }

  /**
   * Inits Matrix user.
   *
   * @param {string=} matrixServer Matrix server URL
   */
  async initComms (matrixServer = this.matrixServer()) {
    debug('Matrix : Connect User to ' + matrixServer)
    this.context.comms = await new Comms(matrixServer)
  }

  /**
   * Adds a Matrix user.
   *
   * @param {string} matrixUser User handler
   * @param {string} password Did Password
   * @returns {boolean} success
   */
  async newCommsUser (matrixUser, password) {
    debug(`New matrix user: ${matrixUser}`)
    // Check if user already exist, if not create it.
    if (await this.context.comms.available(matrixUser)) {
      debug(`Registering matrix user: ${matrixUser}`)
      await this.context.comms.register(matrixUser, password)
      debug(`Registered matrix user: ${matrixUser}`)
      return (true)
    } else {
      debug(`Matrix user ${matrixUser} not available`)
      return (false)
    }
  }

  /**
   * Logins a Matrix user.
   *
   * @param {string} matrixUser Matrix user ID
   * @param {string} password password
   * @returns {string} Matrix access token
   */
  async loginCommsUser (matrixUser, password) {
    debug(`Login matrix user : ${matrixUser}`)
    return this.context.comms.connect(matrixUser, password)
  }

  /**
   * Init Crypto
   */
  async initCrypto (did) {
    debug('Zenroom : new DID & keypair')
    // Get matrix user
    const matrixUser = await this.context.zenroom.random(12)
    this.context.info.matrixUser = matrixUser.toLowerCase()
    this.context.info.kZpair = this.context.crypto.newKeyPair()
    this.context.info.did = 'did:lor:' + this.context.info.network + ':' + did
    debug('kZpub : ' + this.context.info.kZpair[did].keypair.public_key)
  }

  /**
   * SaveDIDObject
   *
   * @returns {*} new diddoc or error
   **/
  async saveDIDObject () {
    debug('DIDDocument to Matrix : Connect')
    const didDocument = new Credential.DidDoc('did:lor:lab:1001')
    const didDocHash = await this.context.storage.put(didDocument.subject)
    // Returns the hash of the diddoc
    return (didDocHash)
  }

  /**
   * Creates a DID
   *
   * @param {string} did DID to use
   * @param {string} password Did Password
   * @returns {*} this
   */
  async new (did, password) {
    // Create DID
    await this.initCrypto(did)
    // Create & Open Database.
    await this.openDB(did, true)
    // Init IPFS/MAIL
    this.context.storage = new Storage()
    this.context.mail = new MAIL()

    // Init Comms and create Matrix User.
    await this.initComms()
    await this.newCommsUser(this.context.info.matrixUser, password)
    await this.loginCommsUser(this.context.info.matrixUser, password)
    // Create Did Document; TODO: save to Matrix
    const diddocHash = await this.saveDIDObject()
    await this.openBlockchain()
    await this.setKeyring()
    const didParts = this.context.info.did.split(':')

    // TODO: Change DID owner
    // Move funds to new wallet
    // Add first publicKey
    debug(`Register DID in the Blockchain: ${didParts[3]}`)
    // await this.context.blockchain.registerDid(didParts[3], this.context.info.kZpair[this.context.info.did].keypair.public_key)

    debug(`Register DIDDoc in the Blockchain: ${didParts[3]}, diddocHash`)
    // await this.context.blockchain.registerDidDocument(didParts[3], diddocHash)

    await this.saveBasicSettings(alias)

    // Set the first admin
    const secretCode = await this.context.zenroom.random(32)
    await this.context.database.set('first_admin', secretCode)
    debug(`First Admin secret code: ${secretCode}`)
    this.nextBatch = ''

    // Key info for the end of the log
    debug(`Matrix user: ${this.context.comms.matrixUser}`)
    debug(`Created DID: ${this.context.info.did}`)

    return this
  }

  /**
   * Saves basic information about the DID
   *
   * @param {string} alias Name for the subject
   */
  async saveBasicSettings () {
    debug('DID : Basic Settings')
    const contactId = await this.context.database.insertContact({
      did: this.context.info.did,
      matrixUser: this.context.info.matrixUser,
      network: this.context.info.network,
      didType: this.options.didType,
      type: 'me'
    })

    // choose the blockchain based on the DID method
    await this.context.database.addKey(contactId, 'substrate', this.options.seed, 1)
    // await this.context.database.addKey(contactId, 'maxonrow', this.options.seed, 1)
    await this.context.database.addKey(contactId, 'crypto:keypair', this.context.info.kZpair, 1)
    await this.context.database.set('next_batch', '')
  }

  /**
   * Deletes all information for a DID
   *
   * @param {string} did Did
   * @param {string} password Did Password
   */
  async delete (did, password) {
    debug(`DID : Deleting ${did}`)
    await this.openDB(did)
    this.context.info = await this.context.database.getContact()
    await this.initComms()
    debug(`Matrix user: ${this.context.info.matrixUser}`)
    await this.loginCommsUser(this.context.info.matrixUser, password)
    debug('DID : Delete rooms')
    const rooms = await this.context.comms.joinedRooms()
    rooms.forEach(async (roomId) => {
      await this.context.comms.leaveRoom(roomId)
      debug('Leave room : ' + roomId)
    })
    this.context.database.delete()
    debug(`DID : Deleted ${did}`)
  }

  /**
   * Open
   *
   * @param {string} did for matrix
   * @param {string} password for matrix
   */
  async open (did, password) {
    await this.openDB(did)
    await this.initRegister()
    await this.initAuth()

    this.context.ipfs = new Storage()
    this.context.mail = new MAIL()
    this.context.info = await this.context.database.getContact()
    this.context.info.did = did

    // choose the blockchain based on the DID method
    this.options.seed = await this.context.database.getKey(this.context.info.id, 'substrate', 1)
    this.context.info.kZpair = await this.context.database.getKey(this.context.info.id, 'crypto:keypair', 1)
    // this.options.seed = await this.context.database.getKey(this.context.info.id, 'maxonrow', 1)
    this.nextBatch = await this.context.database.get('next_batch')
    await this.initComms()
    await this.loginCommsUser(this.context.info.matrixUser, password)
    await this.openBlockchain()
    await this.setKeyring()

    // report the secret code if still unclaimed
    const secretCode = await this.context.database.get('first_admin')
    if (secretCode) {
      debug(`First Admin secret code: ${secretCode}`)
    }
    debug(`${did} - Listening...`)
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
