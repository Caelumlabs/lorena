const Comms = require('./index')
const uuidv4 = require('uuid/v4')

let token = ''
let roomId
var matrix = new Comms('https://labdev.matrix.lorena.tech')
const matrixUser = uuidv4()
const password = uuidv4()
const matrixUser2 = uuidv4()
const password2 = uuidv4()

test('should not recognize a nonexistent user as existing', async () => {
  expect(await matrix.available(matrixUser)).toEqual(true)
})

test('should register a new user', async () => {
  expect(await matrix.register(matrixUser, password)).toEqual(matrixUser)
  expect(await matrix.register(matrixUser2, password2)).toEqual(matrixUser2)
})

test('should recognize a user as already existing', async () => {
  expect(await matrix.available(matrixUser)).toEqual(false)
  expect(await matrix.available(matrixUser2)).toEqual(false)
})

test('should not register an already-existing user', async () => {
  try {
    await matrix.register(matrixUser, password)
    throw (new Error())
  } catch (e) {
    expect(e.message).toBe('Request failed with status code 400')
  }
})

test('should connect to matrix', async () => {
  token = await matrix.connect(matrixUser, password)
  expect(token.length).toBeGreaterThan(10)
})

test('should return all matrix events in an array', async () => {
  const events = await matrix.events('')
  expect(events.nextBatch.length).toBeGreaterThan(8)
  expect(events.events).toBeDefined()
})

test('should create connection with another user', async () => {
  const name = (Math.floor(Math.random() * 9999)).toString()
  const newRoomId = await matrix.createConnection(
    name, // Room name (can be any)
    `@${matrixUser2}:${matrix.serverName}` // User to connect with
  )
  expect(newRoomId).toBeDefined()
  roomId = newRoomId
})

test('should sendMessage', async () => {
  const response = await matrix.sendMessage(
    roomId, // roomId (in this case from `randomRoomName`)
    'm.text', // type
    'Hello this is a test message...' // body
  )
  expect(response).toBeDefined()
  expect(response.status).toBeDefined()
  expect(response.status).toBe(200)
})

test('should extractDid', () => {
  const did = matrix.extractDid('!asdf:matrix.caelumlabs.com')
  expect(did.matrixUser).toBe('asdf')
  expect(did.matrixFederation).toBe('matrix.caelumlabs.com')
})

test('should return all matrix rooms', async () => {
  const rooms = await matrix.joinedRooms()
  expect(rooms).toBeDefined()
  expect(rooms.length).toBe(1)
  expect(rooms[0]).toEqual(roomId)
})

test('should leave a room', async () => {
  const response = await matrix.leaveRoom(roomId)
  expect(response).toBeDefined()
  expect(response.status).toBeDefined()
  expect(response.status).toBe(200)
})
