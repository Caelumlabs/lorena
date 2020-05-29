/* eslint-disable no-async-promise-executor */
'use strict'
const axios = require('axios')
const EventEmitter = require('events')
const Crypto = require('@lorena/crypto')

// Debug
var debug = require('debug')('did:debug:matrix')
// var error = require('debug')('did:error:matrix')

/**
 * Javascript Class to interact with Matrix.
 */
module.exports = class Comms {
  constructor (homeserver = process.env.SERVER_MATRIX) {
    this.crypto = new Crypto()
    this.serverName = homeserver.split('//')[1]
    this.api = homeserver + '/_matrix/client/r0/'
    this.media = homeserver + '/_matrix/media/r0/'
    this.connection = {}
    this.txnId = 1
    this.matrixUser = ''
    this.connected = false
  }

  emit (type, ...args) {
    super.emit('*', ...args)
    return super.emit(type, ...args) || super.emit('', ...args)
  }

  /**
   * Connects to a matrix server.
   *
   * @param {string} username Matrix username
   * @param {string} password Matrix password
   * @returns {Promise} Return a promise with the connection when it's done.
   */
  async connect (username, password, batch = '') {
    return new Promise((resolve, reject) => {
      axios.get(this.api + 'login')
        .then(async () => {
          const result = await axios.post(this.api + 'login', {
            type: 'm.login.password',
            user: username,
            password: password
          })
          this.connection = result.data
          this.matrixUser = '@' + username + ':' + this.serverName
          const emitter = new EventEmitter()
          this.events(emitter, batch)
          resolve(emitter)
        })
        .catch((error) => {
          reject(new Error('Could not connect to Matrix'), error)
        })
    })
  }

  /**
   * Stop calling Matrix API
   */
  disconnect () {
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
      axios.post(this.api + 'register', {
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
   * Listen to events.
   *
   * @param {string} nextBatch next batch of events to be asked to the matrix server.
   * @returns {Promise} Return a promise with the Name of the user.
   */
  async events (emitter, nextBatch) {
    let res
    let batch = nextBatch
    this.connected = true
    return new Promise(async (resolve) => {
      while (this.connected) {
        const apiCall = this.api +
          'sync?timeout=20000' +
          '&access_token=' + this.connection.access_token +
          (batch === '' ? '' : '&since=' + batch)

        // Sync with the server
        res = await axios.get(apiCall)

        // incoming invitations.
        this.getIncomingInvitations(emitter, res.data.rooms.invite)

        // Accepted invitations
        this.getUpdatedInvitations(emitter, res.data.rooms.join)

        // Get Messages
        this.getMessages(emitter, res.data.rooms.join)

        // Emit next Batch.
        batch = res.data.next_batch
        emitter.emit('next_batch', batch)
      }
      resolve()
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
      axios.get(this.api + 'register/available?username=' + username)
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
      axios.get(this.api + 'joined_rooms?access_token=' + this.connection.access_token)
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
      axios.post(this.api + 'rooms/' + escape(roomId) + '/leave?access_token=' + this.connection.access_token)
        .then((res) => {
          return axios.post(this.api + 'rooms/' + escape(roomId) + '/forget?access_token=' + this.connection.access_token)
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
      const apiCreate = this.api + 'createRoom?access_token=' + this.connection.access_token
      axios.post(apiCreate, { name: roomName, visibility: 'private' })
        .then((res, err) => {
          // Invite user to connect
          roomId = res.data.room_id
          const apiInvite = this.api + 'rooms/' + escape(roomId) + '/invite?access_token=' + this.connection.access_token
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
      const apiAccept = this.api + 'rooms/' + roomId + '/join?access_token=' + this.connection.access_token
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
   * Extract Invitations from the API Call to matrix server - events
   *
   * @param {object} rooms Array of events related to rooms
   * @returns {object} array of invitations
   */
  getIncomingInvitations (emitter, rooms) {
    const roomEmpty = !Object.keys(rooms).length === 0 && rooms.constructor === Object
    if (!roomEmpty) {
      for (const roomId in rooms) {
        let invitation = {
          roomId
        }
        rooms[roomId].invite_state.events.forEach(element => {
          if (element.type === 'm.room.join_rules') {
            invitation = {
              ...invitation,
              sender: element.sender,
              join_rule: element.content.join_rule
            }
          } else if (element.type === 'm.room.member') {
            if (element.state_key === element.sender) {
              invitation = {
                ...invitation,
                membership: element.content.membership
              }
            } else {
              invitation = {
                ...invitation,
                origin_server_ts: element.origin_server_ts,
                event_id: element.event_id
              }
            }
          }
        })

        // If it's not me sending the invitation.
        if (invitation.sender !== this.matrixUser) {
          emitter.emit('contact-incoming', { type: 'contact-incoming', roomId, sender: invitation.sender, payload: '' })
        }
      }
    }
  }

  /**
   * Extract Accepted Invitations from the API Call to matrix server - events
   *
   * @param {object} rooms Array of events related to rooms
   */
  getUpdatedInvitations (emitter, rooms) {
    // Check if rooms is empty
    const roomEmpty = !Object.keys(rooms).length === 0 && rooms.constructor === Object
    if (!roomEmpty) {
      for (const roomId in rooms) {
        // Get the events in the Timeline.
        const events = rooms[roomId].timeline.events
        if (events.length > 0) {
          for (let i = 0; i < events.length; i++) {
            const element = events[i]
            // Get events for type m.room.member with membership join or leave.
            if (element.type === 'm.room.member' && element.sender !== this.matrixUser) {
              if (element.content.membership === 'join' || element.content.membership === 'leave') {
                emitter.emit('contact-accepted', { type: 'contact-add', roomId: roomId, sender: element.sender, payload: element.content.membership })
              }
            }
          }
        }
      }
    }
  }

  /**
   * Extract Messages from events
   *
   * @param {object} rooms Array of events related to rooms
   */
  getMessages (emitter, rooms) {
    // Check if rooms is empty
    const roomEmpty = !Object.keys(rooms).length === 0 && rooms.constructor === Object
    if (!roomEmpty) {
      for (const roomId in rooms) {
        // Get the events in the Timeline for a room.
        const events = rooms[roomId].timeline.events
        if (events.length > 0) {
          for (let i = 0; i < events.length; i++) {
            const element = events[i]
            // Get messages.
            if (element.type === 'm.room.message' && element.sender !== this.matrixUser && element.content.msgtype === 'm.lorena') {
              const payload = JSON.parse(element.content.body)
              payload.roomId = roomId
              console.log(payload)
              emitter.emit('contact-message-' + payload['@type'], payload)
            }
          }
        }
      }
    }
  }

  /**
   * Sends a Message.
   *
   * @param {string} roomId Room to send the message to.
   * @param {string} body Body of the message.
   * @returns {Promise} Result of sending a message
   */
  sendMessage (roomId, recipe, payload, recipeId = 0, thread = '', threadId = 0) {
    return new Promise((resolve, reject) => {
      const apiSendMessage = this.api + 'rooms/' + escape(roomId) + '/send/m.room.message/' + this.txnId + '?access_token=' + this.connection.access_token
      const body = JSON.stringify({ '@type': 'recipe', encrypted: false, msg: { recipe, recipeId, thread, threadId, payload } })
      axios.put(apiSendMessage, { msgtype: 'm.lorena', body })
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
   * Upload a file
   *
   * @param {string} file contents
   * @param {string} filename filename
   * @param {string=} type mime-type
   * @returns {Promise} result of Matrix call
   */
  uploadFile (file, filename, type = 'application/text') {
    return new Promise(async (resolve, reject) => {
      // TODO: Check if file name follows MXC syntax
      // mxc://<server-name>/<media-id>
      //    <server-name> : The name of the homeserver where this content originated, e.g. matrix.org
      //    <media-id> : An opaque ID which identifies the content.`

      // Constructing route
      const apiCall = this.media +
        'upload?filename=' + filename +
        '&access_token=' + this.connection.access_token

      // Calling Matrix API
      axios.post(apiCall, file, { headers: { 'Content-type': type } })
        .then((res) => {
          resolve(res)
        })
        .catch((error) => {
          reject(new Error('Could not upload File', error))
        })
    })
  }

  /**
   * Download file from Matrix
   *
   * @param {string} mediaId media ID
   * @param {string} filename file name
   * @param {string=} serverName server name
   * @returns {Promise} result of Matrix call
   */
  downloadFile (mediaId, filename, serverName = this.serverName) {
    return new Promise(async (resolve, reject) => {
      const apiCall = this.media + 'download/' + serverName + '/' + mediaId + '/' + filename
      axios.get(apiCall)
        .then((res) => {
          resolve(res)
        })
        .catch((error) => {
          reject(new Error('Could not download file', error))
        })
    })
  }
}
