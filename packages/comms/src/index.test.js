const Comms = require('./index')

const m1 = new Comms('https://labdev.matrix.lorena.tech')
const m2 = new Comms('https://labdev.matrix.lorena.tech')
const u1 = m1.randomUsername()
const u2 = m1.randomUsername()
const p1 = 'rndPass'
const p2 = 'rndPass'

test('Should register users', async () => {
  expect(await m1.available(u1)).toEqual(true)
  expect(await m1.register(u1, p1)).toEqual(u1)
  expect(await m2.register(u2, p2)).toEqual(u2)
  expect(await m1.available(u1)).toEqual(false)
  expect(await m2.available(u2)).toEqual(false)
  try {
    await m1.register(u1, p1)
    throw (new Error())
  } catch (e) {
    expect(e.message).toBe('Request failed with status code 400')
  }
})

test('should use matrix as a comms interface to Lorena', async done => {
  const tests = [false, false, false, false, false]

  const endTest = (id) => {
    console.log('TEST OK ' + id)
    tests[id] = true
    if (!tests.includes(false)) {
      console.log('END TESTS')
      done()
    }
  }

  // Tests with User 1
  let events = await m1.connect(u1, p1)
  expect(typeof events).toBe('object')
  events.once('next_batch', (msg) => {
    expect(msg.length).toBeGreaterThan(10)
    endTest(0)
  })

  // Create connection to user2
  const newRoomId = await m1.createConnection((Math.floor(Math.random() * 9999)).toString(), `@${u2}:${m2.serverName}`)
  expect(newRoomId).toBeDefined()

  // Sends a message to user2
  const response = await m1.sendMessage(newRoomId, 'ping', 'Hello this is a test message...', 10)
  expect(response).toBeDefined()
  expect(response.status).toBeDefined()
  expect(response.status).toBe(200)

  events.once('next_batch', (msg) => {
    expect(msg.length).toBeGreaterThan(10)
    endTest(0)
  })
  m1.disconnect(u1, p1)

  // Tests with User 2
  events = await m2.connect(u2, p2)
  events.once('next_batch', (msg) => {
    expect(msg.length).toBeGreaterThan(10)
    endTest(1)
  })

  // Accept connection
  const accept = await m2.acceptConnection(newRoomId)
  expect(accept).toBeDefined()
  expect(accept.status).toBeDefined()
  expect(accept.status).toBe(200)

  events.once('contact-incoming', (msg) => {
    endTest(2)
  })

  events.once('contact-message-recipe', (msg) => {
    console.log('contact-message', msg)
    endTest(4)
  })

  const rooms = await m2.joinedRooms()
  expect(rooms).toBeDefined()
  expect(rooms.length).toBe(1)
  expect(rooms[0]).toEqual(newRoomId)
  m2.disconnect(u1, p1)

  events = await m1.connect(u1, p1)
  events.once('contact-accepted', (msg) => {
    endTest(3)
  })

  m1.disconnect(u1, p1)
})

/*
test('should return all matrix rooms', async () => {
  
})

test('should leave a room', async () => {
  const response = await matrix.leaveRoom(roomId)
  expect(response).toBeDefined()
  expect(response.status).toBeDefined()
  expect(response.status).toBe(200)
})

})*/
