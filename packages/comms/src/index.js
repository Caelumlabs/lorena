/* eslint-disable no-async-promise-executor */
'use strict'
const axios = require('axios')
const axiosRetry = require('axios-retry')
const Crypto = require('@caelumlabs/crypto')
const { spawn, Thread, Worker } = require('threads')

// Debug
var debug = require('debug')('did:debug:matrix')
// var error = require('debug')('did:error:matrix')

// Retry with step-back to solve rate limiting problem
axiosRetry(axios, {
  retries: 5,
  retryAfterMs: 0,
  retryDelay: () => {
    return this.retryAfterMs
  },
  retryCondition: (e) => {
    if (e.response.status === 429) {
      debug('retrying due to rate limiting', e)
      this.retryAfterMs = e.response.data.retry_after_ms
      return true
    } else {
      return false
    }
  }
})

/**
 * Javascript Class to interact with Matrix.
 */
module.exports = class Comms {
  constructor (homeserver = process.env.SERVER_MATRIX) {
    this.txnId = 1
    this.connection = {}
    this.connected = false
    this.crypto = new Crypto()
    this.context = {
      serverName: homeserver.split('//')[1],
      api: homeserver + '/_matrix/client/r0/',
      matrixUser: '',
      tokenAccess: ''
    }
  }

  /**
   * Init Crypto library
   */
  async init () {
    await this.crypto.init()
  }

  /**
   * Connects to a matrix server.
   *
   * @param {string} username Matrix username
   * @param {string} password Matrix password
   * @returns {Promise} Return a promise with the connection when it's done.
   */
  async connect (username, password) {
    return new Promise((resolve, reject) => {
      axios.get(this.context.api + 'login')
        .then(async () => {
          const result = await axios.post(this.context.api + 'login', {
            type: 'm.login.password',
            user: username,
            password: password
          })
          this.connection = result.data
          this.context.matrixUser = '@' + username + ':' + this.context.serverName
          this.context.accessToken = this.connection.access_token
          resolve()
        })
        .catch((error) => {
          console.log(error)
          reject(new Error('Could not connect to Matrix'), error)
        })
    })
  }

  async loop () {
    this.loopThread = await spawn(new Worker('./loop'))
    return this.loopThread
  }

  /**
   * Stop calling Matrix API
   */
  async disconnect () {
    await Thread.terminate(this.loopThread)
    this.connected = false
  }

  /**
   * Random Username
   *
   * @returns {string} Random 12 chars string
   */
  randomUsername () {
    const matrixUser = this.crypto.random(12)
    return matrixUser.toLowerCase()
  }

  /**
   * Register user
   *
   * @param {string} username Matrix username
   * @param {string} password Matrix password
   * @returns {Promise} username (if successful)
   */
  async register (username, password) {
    return new Promise((resolve, reject) => {
      axios.post(this.context.api + 'register', {
        auth: { type: 'm.login.dummy' },
        username: username,
        password: password
      })
        .then(async (res) => {
          resolve(username)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  /**
   * Checks if the username is available
   *
   * @param {string} username to check
   * @returns {Promise} of true if username is available
   */
  async available (username) {
    return new Promise((resolve, reject) => {
      axios.get(this.context.api + 'register/available?username=' + username)
        .then(async (res) => {
          resolve(true)
        })
        .catch(() => {
          resolve(false)
        })
    })
  }

  /**
   * Returns an array of rooms where the user is currently a member
   *
   * @returns {Promise} array of rooms currently joined
   */
  async joinedRooms () {
    return new Promise((resolve, reject) => {
      axios.get(this.context.api + 'joined_rooms?access_token=' + this.connection.access_token)
        .then(async (res) => {
          resolve(res.data.joined_rooms)
        })
        .catch((error) => {
          reject(new Error('Could not list joined rooms', error))
        })
    })
  }

  /**
   * Leave the specified room
   *
   * @param {string} roomId Room to leave
   * @returns {Promise} of true if success
   */
  async leaveRoom (roomId) {
    return new Promise((resolve, reject) => {
      axios.post(this.context.api + 'rooms/' + escape(roomId) + '/leave?access_token=' + this.connection.access_token)
        .then((res) => {
          return axios.post(this.context.api + 'rooms/' + escape(roomId) + '/forget?access_token=' + this.connection.access_token)
        })
        .then((res) => {
          resolve(res)
        })
        .catch((error) => {
          reject(new Error('Could not leave room', error))
        })
    })
  }

  /**
   * Opens a connection to another user.
   *
   * @param {string} roomName Name of new room to create
   * @param {string} userId User name to connect to (in format @username:home.server)
   * @returns {Promise} Return a promise with the string roomId (in format !random:home.server)
   */
  createConnection (roomName, userId) {
    let roomId = ''
    debug('Create connection to ' + userId)
    return new Promise((resolve, reject) => {
      const apiCreate = this.context.api + 'createRoom?access_token=' + this.context.accessToken
      axios.post(apiCreate, { name: roomName, visibility: 'private' })
        .then((res, err) => {
          // Invite user to connect
          roomId = res.data.room_id
          const apiInvite = this.context.api + 'rooms/' + escape(roomId) + '/invite?access_token=' + this.connection.access_token
          return axios.post(apiInvite, { user_id: userId })
        })
        .then((res) => {
          resolve(roomId)
        })
        .catch((error) => {
          reject(new Error('Could not create room', error))
        })
    })
  }

  /**
   * Accepts invitation to join a room.
   *
   * @param {string} roomId RoomID
   * @returns {Promise} Result of the Matrix call
   */
  acceptConnection (roomId) {
    return new Promise((resolve, reject) => {
      const apiAccept = this.context.api + 'rooms/' + roomId + '/join?access_token=' + this.connection.access_token
      axios.post(apiAccept, {})
        .then((res) => {
          resolve(res)
        })
        .catch((error) => {
          reject(new Error('Could not accept invitation', error))
        })
    })
  }

  /**
   * Sends a Message.
   *
   * @param {string} roomId Room to send the message to.
   * @param {string} body Message to be sent
   * @returns {Promise} Result of sending a message
   */
  sendMessage (roomId, body) {
    return new Promise((resolve, reject) => {
      const apiSendMessage = this.context.api + 'rooms/' + escape(roomId) + '/send/m.room.message/' + this.txnId + '?access_token=' + this.connection.access_token
      axios.put(apiSendMessage, { msgtype: 'm.recipe', body })
        .then((res, err) => {
          this.txnId++
          resolve(res)
        })
        .catch((error) => {
          reject(new Error('Could not send message', error))
        })
    })
  }

  /**
   * Sends a Message.
   *
   * @param {object} senderSecretKey  to sign the message
   * @param {object} senderPublicKey  to sign the message
   * @param {object} receiverPublicKey to encrypt the message
   * @param {string} recipe to call
   * @param {*} payload to send
   * @param {number} recipeId called
   * @param {number} thread of call
   * @param {number} threadId of call
   * @returns {string} Boxed message
   */
  boxMessage (senderSecretKey, senderPublicKey, receiverPublicKey, recipe, payload, recipeId = 0, thread = '', threadId = 0) {
    const preMessage = { recipe, recipeId, thread, threadId, payload }
    const encryptedMessage = this.crypto.boxObj(preMessage, senderSecretKey, receiverPublicKey)
    console.log(receiverPublicKey)
    const message = {
      version: 1,
      publicKey: this.crypto.u8aToHex(senderPublicKey),
      msg: encryptedMessage
    }
    return (this.crypto.stringToHex(JSON.stringify(message)))
  }

  /**
   * Unbox the message
   *
   * @param {string} objEncrypted Encrypted message
   * @param {object} receiverSecretKey secret key of the receiver
   * @param {object} boxPublicKey Public Key from the sender
   * @returns {object} Original object
   */
  unboxMessage (objEncrypted, receiverSecretKey, boxPublicKey = false) {
    const box = JSON.parse(this.crypto.hexToString(objEncrypted))
    box.publicKey = (boxPublicKey === false) ? this.crypto.hexToU8a(box.publicKey) : boxPublicKey
    console.log(box.publicKey)
    box.msg = this.crypto.unboxObj(box.msg, box.publicKey, receiverSecretKey)
    return box
  }
}
