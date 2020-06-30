// workers/counter.js
const { Observable } = require('observable-fns')
const { expose } = require('threads/worker')
const axios = require('axios')

/**
 * Extract Invitations from the API Call to matrix server - events
 *
 * @param {object} observer of events
 * @param {object} rooms Array of events related to rooms
 * @param {string} matrixUser Actual matrixUser
 */
function getIncomingInvitations (observer, rooms, matrixUser) {
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
      if (invitation.sender !== matrixUser) {
        observer.next({
          type: 'contact-incoming',
          value: {
            roomId,
            sender: invitation.sender,
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
 * @param {object} observer of events
 * @param {object} rooms Array of events related to rooms
 * @param {string} matrixUser Actual matrixUser
 */
function getUpdatedInvitations (observer, rooms, matrixUser) {
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
              observer.next({
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
 * @param {object} observer of events
 * @param {object} rooms Array of events related to rooms
 * @param {string} matrixUser Actual matrixUser
 */
function getMessages (observer, rooms, matrixUser) {
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
            observer.next({
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
 * Loop function
 *
 * @param {string} nextBatch Batch
 * @param {object} context Context information
 * @returns {Promise} Thread promise
 */
function loop (nextBatch = '', context) {
  return new Observable(async (observer) => {
    let res
    let batch = nextBatch
    while (true) {
      // Sync with the server
      const apiCall = context.api + 'sync?timeout=20000' + '&access_token=' + context.accessToken + (batch === '' ? '' : '&since=' + batch)
      res = await axios.get(apiCall)

      // incoming invitations.
      getIncomingInvitations(observer, res.data.rooms.invite, context.matrixUser)

      // Accepted invitations
      getUpdatedInvitations(observer, res.data.rooms.join, context.matrixUser)

      // Get Messages
      getMessages(observer, res.data.rooms.join, context.matrixUser)

      // Emit next Batch.
      batch = res.data.next_batch
      // emitter.emit('next_batch', batch)
      observer.next({
        type: 'next_batch',
        value: batch
      })
    }
  })
}

expose(loop)
