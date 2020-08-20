const EventEmitter = require('events')
const axios = require('axios')

/**
 * Extract Invitations from the API Call to matrix server - events
 *
 * @param {object} emitter of events
 * @param {object} rooms Array of events related to rooms
 * @param {string} matrixUser Actual matrixUser
 */
function getIncomingInvitations (emitter, rooms, matrixUser) {
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
        } else if (element.type === 'm.room.name') {
          invitation = {
            ...invitation,
            name: element.content.name
          }
        }
      })

      // If it's not me sending the invitation.
      if (invitation.sender !== matrixUser) {
        emitter.emit('message', {
          type: 'contact-incoming',
          value: {
            roomId,
            sender: invitation.sender,
            roomName: invitation.name,
            payload: ''
          }
        })
      }
    }
  }
}

/**
 * Extract Accepted Invitations from the API Call to matrix server - events
 *
 * @param {object} emitter of events
 * @param {object} rooms Array of events related to rooms
 * @param {string} matrixUser Actual matrixUser
 */
function getUpdatedInvitations (emitter, rooms, matrixUser) {
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
          if (element.type === 'm.room.member' && element.sender !== matrixUser) {
            if (element.content.membership === 'join' || element.content.membership === 'leave') {
              emitter.emit('message', {
                type: 'contact-accepted',
                value: {
                  roomId: roomId,
                  sender: element.sender,
                  payload: element.content.membership
                }
              })
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
 * @param {object} emitter of events
 * @param {object} rooms Array of events related to rooms
 * @param {string} matrixUser Actual matrixUser
 */
function getMessages (emitter, rooms, matrixUser) {
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
          if (element.type === 'm.room.message' && element.sender !== matrixUser && element.content.msgtype === 'm.recipe') {
            const payload = {
              msg: element.content.body,
              roomId: roomId
            }
            emitter.emit('message', {
              type: 'contact-message',
              value: payload
            })
          }
        }
      }
    }
  }
}

/**
 * Delay
 *
 * @param {number} ms milliseconds
 * @returns {Promise} delay promise
 */
// function delay (ms) {
//   return new Promise(resolve => setTimeout(resolve, ms))
// }

module.exports = class Loop extends EventEmitter {
  constructor (nextBatch = '', context) {
    super()
    this.nextBatch = nextBatch
    this.context = context
    this._terminated = false
    this.count = 0
    this.execute()
  }

  async terminate () {
    this._terminated = true
    this.removeAllListeners()
    return true
  }

  async execute () {
    // console.log('COUNT', this.count++)
    const apiCall = this.context.api + 'sync?timeout=20000' + '&access_token=' + this.context.accessToken + (this.nextBatch === '' ? '' : '&since=' + this.nextBatch)
    const res = await axios.get(apiCall)
    // incoming invitations.
    getIncomingInvitations(this, res.data.rooms.invite, this.context.matrixUser)

    // Accepted invitations
    getUpdatedInvitations(this, res.data.rooms.join, this.context.matrixUser)

    // Get Messages
    getMessages(this, res.data.rooms.join, this.context.matrixUser)

    this.emit('message', {
      type: 'next_batch',
      value: res.data.next_batch
    })
    this.nextBatch = res.data.next_batch
    // await delay(3000)

    if (!this._terminated) { await this.execute() }
    return true
  }
}
