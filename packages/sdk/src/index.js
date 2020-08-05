const Comms = require('@caelumlabs/comms')
const Crypto = require('@caelumlabs/crypto')
const Credential = require('@caelumlabs/credentials')
const Storage = require('@caelumlabs/storage')
const Blockchain = require('@caelumlabs/blockchain-substrate')
const { EventEmitter } = require('events')
const debug = require('debug')('did:debug:sdk')
const uuid = require('uuid/v4')

/**
 * Lorena SDK - Class
 */
module.exports = class Lorena extends EventEmitter {
  /**
   * @param {object} walletHandler walletHandler
   * @param {object} opts opts
   */
  constructor (walletHandler, opts = {}) {
    super()
    this.opts = opts
    if (opts.debug) debug.enabled = true
    this.wallet = walletHandler
    this.comms = false
    this.crypto = new Crypto()
    this.recipeId = 0
    this.queue = []
    this.processing = false
    this.ready = false
    this.nextBatch = ''
    this.disconnecting = false
    this.threadId = 0
    this.storage = new Storage()
  }

  /**
   * First time. Init a wallet.
   *
   * @param {string} network Network the wallet is talking to.
   * @returns {Promise} of initialized wallet
   */
  async initWallet (network) {
    debug('Init Wallet')
    return new Promise((resolve, reject) => {
      // TODO: Move to a .json file
      const info = {
        network: network,
        type: 'substrate',
        blockchainEndpoint: 'wss://labdev.substrate.lorena.tech',
        matrixEndpoint: 'https://labdev.matrix.lorena.tech',
        ipfsEndpoint: {
          host: 'labtest.ipfs.lorena.tech',
          port: '443',
          protocol: 'https:'
        }
      }

      // Wallet info.
      this.wallet.info.type = info.type
      this.wallet.info.blockchainServer = info.blockchainEndpoint
      this.wallet.info.matrixServer = info.matrixEndpoint
      this.comms = new Comms(this.wallet.info.matrixServer)
      this.wallet.info.matrixUser = this.comms.randomUsername()
      this.wallet.info.matrixPass = this.crypto.random(16)

      // Check username.
      this.comms.available(this.wallet.info.matrixUser).then((available) => {
        if (available) {
          return this.comms.register(this.wallet.info.matrixUser, this.wallet.info.matrixPass)
        } else {
          reject(new Error('Could not init wallet'))
        }
      }).then(() => {
        resolve(this.wallet.info)
      }).catch(() => {
        reject(new Error('Could not init wallet'))
      })
    })
  }

  /**
   * Locks (saves and encrypts) the wallet
   *
   * @param {string} password Wallet password
   * @returns {boolean} success
   */
  async lock (password) {
    const result = await this.wallet.lock(password)
    if (result) {
      this.emit('locked', password)
    }
    return result
  }

  /**
   * UnLocks (open and decrypts) the wallet
   *
   * @param {string} password Wallet password
   * @returns {boolean} success
   */
  async unlock (password) {
    const result = await this.wallet.unlock(password)
    if (result) {
      this.emit('unlocked', password)
    }

    // Upgrade Wallet if it's necessary
    const packageJSON = require('../package.json')
    if (!this.wallet.info.version || this.wallet.info.version === undefined || this.wallet.info.version === '') {
      this.wallet.data.links.forEach(element => {
        element.linkId = uuid()
      })
      this.wallet.info.version = packageJSON.version
      this.emit('change')
    }

    return result
  }

  /**
   * saves a Schema.org valid Person
   *
   * @param {object} person Owner of the wallet (Person).
   */
  personalData (person) {
    this.wallet.info.person = person.subject
  }

  async signCredential (subject) {
    return new Promise((resolve) => {
      // Sign the persona
      Credential.signCredential(this.zenroom, subject, this.wallet.info.keyPair, this.wallet.info.did)
        .then((signCredential) => {
          this.wallet.add('credentials', {
            type: 'Persona',
            issuer: this.wallet.info.did,
            id: this.wallet.info.did,
            credential: signCredential
          })
          this.emit('change')
          resolve(signCredential)
        })
    })
  }

  getContact (roomId) {
    return this.wallet.get('links', { roomId: roomId })
  }

  /*
  *  an ID (roomId or LinkId) and returns the corresponding Link ID
  */
  getLinkId (anyId) {
    const UUIDv4 = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$')
    const ROOMID = new RegExp('^![a-zA-Z]+:[a-zA-Z]+.[a-zA-Z]+.[a-zA-Z]+.[a-zA-Z]+.[a-zA-Z]+$')

    // It is a matrix room ID
    if (ROOMID.test(anyId)) {
      const link = this.wallet.get('links', { roomId: anyId })
      return link.linkId
    } else if (UUIDv4.test(anyId)) { // it is a linkID (unique number)
      return anyId
    } else {
      throw new Error('Unsupported ID to getLink')
    }
  }

  /**
   * Listen to events
   *
   * @returns {Promise} endless execution
   */
  async listen () {
    let batch = this.wallet.getBatch()
    return new Promise(() => {
      this.comms.connect(this.wallet.info.matrixUser, this.wallet.info.matrixPass)
        .then(() => {
          return this.comms.loop()
        })
        .then((loop) => {
          loop(batch, this.comms.context).subscribe(async (msg) => {
            try {
              switch (msg.type) {
                case 'next_batch' :
                  this.wallet.setBatch(msg.value)
                  // UPDATE batch
                  batch = msg.value
                  break
                case 'contact-incoming' :
                  debug('Contact Incoming')
                  // By default, accept all incoming contacts.
                  this.onContactIncoming(msg.value)
                  break
                case 'contact-accepted' :
                  // Connection has been accepted.
                  this.onContactAdd(msg.value)
                  break
                case 'contact-message' :
                  // console.log('contact-message!', msg)
                  var thread = this.wallet.get('threads', { localRecipeId: 'member-admin' }) // need the type
                  if (!thread) {
                    console.log('contact-message member-admin, maybe terminal was closed without saving next_batch. Or thread not saved.')
                  } else {
                    var msgReceived = this.comms.unboxMessage(msg.value.msg, thread.sender.box.secretKey, thread.publicKey)
                    console.log('RECEIVED', msgReceived.msg.payload)
                    this.wallet.add('credentials', {
                      ...msgReceived.msg.payload[0].signedCredential
                    })
                  }
                  // this.onMsgNotify(msg.value)
                  break
              }
            } catch (error) {
              console.log('SWITCH ERROR', error)
            }
          })
        })
    })
  }

  /**
   * Connect to Lorena IDspace.
   *
   * @returns {boolean} success (or errors thrown)
   */
  async connect () {
    if (this.ready === true) return true
    else if (this.wallet.info.matrixUser) {
      try {
        // Connect to Blockchain
        this.blockchain = new Blockchain(this.wallet.info.blockchainServer)
        await this.blockchain.connect()
        // Connect to Matrix.
        this.comms = new Comms(this.wallet.info.matrixServer)
        this.listen()
        this.ready = true
        this.processQueue()
        this.emit('ready')
        return true
      } catch (error) {
        debug('%O', error)
        this.emit('error', error)
        throw error
      }
    }
  }

  /**
   * Disconnect for clean shutdown
   */
  disconnect () {
    this.emit('disconnecting')
    this.disconnecting = true
    if (this.comms) {
      this.comms.disconnect()
    }
  }

  onContactIncoming (element) {
    debug('onContactIncoming')
    // 'contact-incoming':
    this.wallet.add('links', {
      linkId: element.linkId,
      roomId: element.roomId,
      alias: '',
      did: '',
      matrixUser: element.sender,
      status: 'incoming'
    })
    this.comms.acceptConnection(element.roomId)
    this.emit('contact-incoming', element.sender)
    this.emit('change')
  }

  onContactAdd (element) {
    const linkId = this.getLinkId(element.roomId)
    this.wallet.update('links', { linkId: linkId }, {
      status: 'connected'
    })
    this.emit('link-added', element.sender)
    this.emit('change')
  }

  onMsgNotify (element) {
    const parsedElement = JSON.parse(element.payload.body)
    parsedElement.linkId = element.linkId
    this.emit(`message:${parsedElement.recipe}`, parsedElement)
    this.emit('message', parsedElement)
    if (parsedElement.recipe === 'member-notify') {
      this.handleMemberNotify(parsedElement)
    }
  }

  /**
   * handle member-update-notify message
   *
   * @param {*} element event to process
   */
  handleMemberNotify (element) {
    debug('handleMemberNotify: ', element)
    this.wallet.data.credentials[0] = element.payload.credential
    // TODO: Update credential based on credential ID
    // const where = { 'credentialSubject["@type"]': element.payload.credential.issuer }
    // this.wallet.update('credentials', where, element.payload.credential)
    this.emit('change')
  }

  /**
   * get All messages
   *
   * @returns {*} events
   */
  async getMessages () {
    try {
      const result = await this.comms.events(this.nextBatch)
      this.nextBatch = result.nextBatch
      return (result.events)
    } catch (e) {
      // If there was an error, log it and return empty events for continuation
      debug(e)
      return []
    }
  }

  /**
   * process Outgoing queue of messages
   */
  async processQueue () {
    try {
      if (this.queue.length > 0) {
        const sendPayload = JSON.stringify(this.queue.pop())
        await this.comms.sendMessage(this.wallet.info.roomId, 'm.action', sendPayload)
      }
      if (this.queue.length === 0) {
        this.processing = false
      }
    } catch (e) {
      debug(e)
    }
  }

  /**
   * Waits for something to happen only once
   *
   * @param {string} msg Message to be listened to
   * @param {number} timeout for the call
   * @returns {Promise} Promise with the result
   */
  oneMsg (msg, timeout = 10000) {
    return Promise.race(
      [
        new Promise((resolve) => {
          this.once(msg, (data) => {
            resolve(data)
          })
        }),
        new Promise((resolve) => setTimeout(() => resolve(false), timeout))
      ]
    )
  }

  /**
   * Sends an action to another DID
   *
   * @param {string} recipe Remote recipe name
   * @param {number} recipeId Remote recipe Id
   * @param {string} threadRef Local Recipe name
   * @param {number} threadId Local recipe Id
   * @param {object} payload Information to send
   * @param {string} linkId Connection through which to send recipe
   * @returns {number} recipeId
   */
  async sendAction (recipe, recipeId, threadRef, threadId, payload, linkId) {
    const action = {
      recipe,
      recipeId,
      threadRef,
      threadId,
      payload
    }
    if (!this.processing && this.ready) { // execute just in time
      this.processing = true
      // const sendPayload = JSON.stringify(action)
      const link = this.wallet.get('links', { linkId })
      console.log('Room ID:' + link.roomId)
      console.log('DID:' + link.linkDid)
      // const  = await this.blockchain.getDidDocHash(did)
      // const pubKey = await this.blockchain.getActualDidKey(link.linkDid)
      // await this.comms.sendMessage(link.roomId, 'm.action', sendPayload)
    } else {
      this.queue.push(action)
    }
    return this.recipeId
  }

  /**
   * Call a recipe, using the intrinsic threadId adn get back the single message
   *
   * @param {string} linkId Connection to use
   * @param {string} recipeId Recipe name
   * @param {string} stateId Recipe state id
   * @param {*} payload to send with recipe
   * @param {string} localRecipeId thread ID (if not provided use intrinsic thread ID management)
   * @param {number} localStateId local state Id
   * @returns {Promise} of message returned
   */
  async callRecipe (linkId, recipeId, stateId, payload = {}, localRecipeId, localStateId) {
    return new Promise((resolve, reject) => {
      const link = this.wallet.get('links', { linkId })
      if (!link) {
        debug(`memberAdmin: ${linkId} is not in links`)
        resolve(false)
      } else {
        this.blockchain.getActualDidKey(link.linkDid)
          .then((publicKey) => {
            const sender = this.crypto.keyPair()
            this.wallet.add('threads', {
              publicKey,
              sender,
              stateId,
              recipeId,
              localRecipeId,
              localStateId
            })
            return this.comms.boxMessage(
              sender.box.secretKey,
              sender.box.publicKey,
              publicKey,
              recipeId,
              payload,
              stateId,
              localRecipeId,
              localStateId)
          })
          .then((box) => {
            return this.comms.sendMessage(link.roomId, box)
          })
          .then(() => {
            resolve('Member-of Sent')
          })
          .catch((e) => {
            console.log(e)
            reject(new Error('BAD'))
          })
      }
    })
  }

  /**
   * Open Connection with another user.
   *
   * @param {string} did DID
   * @param {object} options Object with other options like `alias`
   * @returns {Promise} linkId created, or false
   */
  async createConnection (did, options = {}) {
    const didDocHash = await this.blockchain.getDidDocHash(did)
    const didDoc = await this.storage.get(didDocHash)
    const matrixUserID = didDoc.value.service[0].serviceEndpoint
    const link = {
      linkId: uuid(),
      did: false,
      linkDid: did,
      roomId: '',
      roomName: this.comms.randomUsername(),
      keyPair: false,
      matrixUser: matrixUserID,
      status: 'invited',
      alias: '',
      ...options
    }
    return new Promise((resolve, reject) => {
      this.comms.createConnection(link.roomName, matrixUserID)
        .then((roomId) => {
          link.roomId = roomId
          this.wallet.add('links', link)
          this.emit('change')
          resolve(link.linkId)
        })
        .catch((e) => {
          debug(`createConnection ${e}`)
          resolve(false)
        })
    })
  }

  /**
   * memberOf
   *
   * @param {string} linkId Connection to use
   * @param {string} secretCode Secret Code to become admin
   * @returns {Promise} Result of calling recipe member-of
   */
  async memberAdmin (linkId, secretCode) {
    return new Promise((resolve, reject) => {
      const link = this.wallet.get('links', { linkId })
      if (!link) {
        debug(`memberAdmin: ${linkId} is not in links`)
        resolve(false)
      } else {
        this.blockchain.getActualDidKey(link.linkDid)
          .then((publicKey) => {
            const sender = this.crypto.keyPair()
            const stateId = 1
            const recipeId = 'member-admin'
            const localRecipeId = 'member-admin'
            const localStateId = 1
            this.wallet.add('threads', {
              publicKey,
              sender,
              stateId,
              recipeId,
              localRecipeId,
              localStateId
            })
            return this.comms.boxMessage(
              sender.box.secretKey,
              sender.box.publicKey,
              publicKey,
              recipeId,
              [secretCode],
              [this.wallet.info.person],
              stateId,
              localRecipeId,
              localStateId)
          })
          .then((box) => {
            return this.comms.sendMessage(link.roomId, box)
          })
          .then(() => {
            resolve('Member-of Sent')
          })
          .catch((e) => {
            console.log(e)
            reject(new Error('BAD'))
          })
      }
    })
  }

  /**
   * Ask to a link for a credential.
   *
   * @param {string} linkId Connection identifier
   * @param {string} credentialType Credential we ask for.
   * @param {number=} threadId thread ID (if not provided use intrinsic thread ID management)
   * @returns {boolean} result
   */
  async askCredential (linkId, credentialType, threadId = undefined) {
    // use the threadId if provided, otherwise use the common one
    if (threadId === undefined) {
      threadId = this.threadId++
    }
    return new Promise((resolve) => {
      const payload = {
        credentialType: credentialType
      }
      this.sendAction('credential-get', 0, 'credential-ask', threadId, payload, linkId)
        .then(() => {
          resolve(true)
        })
    })
  }

  /**
   * Delete a link and leave the room for that link.
   *
   * @param {string} linkId Connection to be removed
   * @returns {Promise} of removing the link and leaving the room
   */
  async deleteLink (linkId) {
    return new Promise((resolve) => {
      const link = this.wallet.get('links', { linkId })
      this.comms.leaveRoom(link.roomId)
        .then(() => {
          this.wallet.remove('links', { linkId })
          this.emit('change')
          resolve(true)
        }).catch((_e) => {
          resolve(false)
        })
    })
  }

  /**
   * Verify a credential (deprecated: use `verifyCredential()`)
   *
   * @param {*} json of credential to verify
   * @returns {Promise} of success (JSON) or failure (false)
   */
  /* istanbul ignore next */
  async validateCertificate (json) {
    debug('validateCertificate() deprecated: use verifyCredential()')
    return this.verifyCredential(json)
  }

  /**
   * Verify a credential
   *
   * @param {*} json of credential to verify
   * @returns {Promise} of success (JSON) or failure (false)
   */
  async verifyCredential (json) {
    return new Promise((resolve) => {
      try {
        const credential = JSON.parse(json)
        const verified = {
          certificate: credential,
          issuer: credential.issuer
        }
        resolve(verified)

        // get Public Key -> Resolve from Blockchain & Check credential signature
        /*
        this.getResolver().resolve(verified.issuer)
          .then((diddoc) => {
            if (!diddoc) {
              throw new Error(`No DID Document for ${verified.issuer}`)
            }
            verified.network = verified.issuer.split(':')[2]
            verified.pubKey = diddoc.authentication[0].publicKey
            verified.checkIssuer = (verified.issuer === diddoc.id)
            return Credential.verifyCredential(this.zenroom, credential, verified.pubKey, verified.issuer)
          })
          .then((result) => {
            verified.checkCertificateSignature = result
            // IPFS DAG : Load Credential from IPFS
            const ipfs = new IpfsClient(LorenaDidResolver.getInfoForNetwork(verified.network).ipfsEndpoint)
            const did = credential.credentialSubject.course.id
            const cid = did.split(':')[3]
            return ipfs.dag.get(cid)
          })
          .then((result) => {
            verified.credential = result.value
            // Verify Credential -> The credential is signed by the Issuer
            return Credential.verifyCredential(this.zenroom, verified.credential, verified.pubKey, verified.issuer)
          })
          .then((result) => {
            verified.checkCredentialSignature = result
            const valid = verified.checkIssuer && verified.checkCertificateSignature && verified.checkCredentialSignature
            resolve({ success: valid, verified })
          })
          .catch((e) => {
            debug(e)
            resolve(false)
          })
      */
      } catch (e) {
        debug(e)
        resolve(false)
      }
    })
  }

  /**
   * Overrides `on` from EventEmitter to dispatch ready if this.ready.
   *
   * @param {string} event Event name
   * @param {Function} cb Callback function
   * @returns {void}
   */
  on (event, cb) {
    if (event === 'ready' && this.ready) return cb()
    return super.on(event, cb)
  }
}
