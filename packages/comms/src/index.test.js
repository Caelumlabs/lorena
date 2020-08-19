/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable key-spacing */
const Comms = require('./index')
const LorenaCrypto = require('@caelumlabs/crypto')
const crypto = new LorenaCrypto()

const testMatrixServer = 'https://labdev.matrix.lorena.tech'
const m1 = new Comms(testMatrixServer)
const m2 = new Comms(testMatrixServer)
const u1 = m1.randomUsername()
const u2 = m1.randomUsername()
const p1 = 'rndPass'
const p2 = 'rndPass'
let roomId
const credential = {
  "@context" : "credentials/v1",
  "credentialSubject" : {
    "id": "did:lor:101",
    "reoleName": "admin"
  }
}

test('Init Crypto', async () => {
  const result = await crypto.init()
  expect(result).toEqual(true)
})

test('Should register users', async () => {
  await m1.init()
  expect(await m1.available(u1)).toEqual(true)
  expect(await m1.register(u1, p1)).toEqual(u1)
  expect(await m1.available(u1)).toEqual(false)
  await m2.init()
  expect(await m2.register(u2, p2)).toEqual(u2)
  expect(await m2.available(u2)).toEqual(false)

  try {
    await m1.register(u1, p1)
    throw (new Error())
  } catch (e) {
    expect(e.message).toBe('Request failed with status code 400') // eslint-disable-line jest/no-try-expect
  }
})

test('should not connect with an invalid username and password', async () => {
  await expect(m1.connect(u2, u2)).rejects.toEqual(new Error('Could not connect to Matrix'))
})

test('should not be able to create a room without a connection', async () => {
  await expect(m1.createConnection(undefined, undefined)).rejects.toEqual(new Error('Could not create room'))
})

test('should not be able to a connection without a connection', async () => {
  await expect(m1.acceptConnection(undefined)).rejects.toEqual(new Error('Could not accept invitation'))
})

test('should not be able to list rooms without a connection', async () => {
  await expect(m1.joinedRooms()).rejects.toEqual(new Error('Could not list joined rooms'))
})

test('should not be able to leave a bogus room without a connection', async () => {
  await expect(m1.leaveRoom(undefined)).rejects.toEqual(new Error('Could not leave room'))
})

test('should not be able to send a message without a connection', async () => {
  await expect(m1.sendMessage(undefined, undefined)).rejects.toEqual(new Error('Could not send message'))
})

test('should use matrix as a comms interface to Lorena', async done => { // eslint-disable-line jest/no-test-callback
  const sender = crypto.keyPair()
  const receiver = crypto.keyPair()
  let boxReceived
  const tests = [false, false, false, false, false, false]
  const endTest = async (id, m1, m2) => {
    tests[id] = true
    if (!tests.includes(false)) {
      await m1.disconnect()
      await m2.disconnect()
      done()
      return true
    }
    return false
  }

  // Tests with User 1
  await m1.connect(u1, p1)

  const loopm1 = await m1.loop('', m1.context)
  loopm1.on('message', async (msg) => {
    switch (msg.type) {
      case 'next_batch' :
        expect(msg.value.length).toBeGreaterThan(10)
        await endTest(0, m1, m2)
        break
      case 'contact-accepted' :
        await endTest(3, m1, m2)
        break
    }
  })

  await m2.connect(u2, p2)
  const loopm2 = await m2.loop('', m2.context)
  loopm2.on('message', async (msg) => {
    switch (msg.type) {
      case 'next_batch' :
        expect(msg.value.length).toBeGreaterThan(10)
        await endTest(1, m1, m2)
        break
      case 'contact-incoming' :
        await endTest(2, m1, m2)
        await m2.acceptConnection(msg.value.roomId)
        break
      case 'contact-message' :
        boxReceived = m2.unboxMessage(msg.value.msg, receiver.box.secretKey)
        expect(boxReceived.msg.recipeId).toEqual('ping')
        expect(boxReceived.msg.stateId).toEqual(10)
        expect(boxReceived.msg.credentials).toEqual(credential)
        await endTest(4, m1, m2)
        break
      case 'contact-accepted' :
        await endTest(5, m1, m2)
        break
    }
  })

  // Connect m1 and m2
  const roomName = m1.randomUsername()
  roomId = await m1.createConnection(roomName, `@${u2}:${m2.context.serverName}`)
  expect(roomId).toBeDefined()

  // Sends a message to user2
  const box = await m1.boxMessage(sender.box.secretKey, sender.box.publicKey, receiver.box.publicKey, 'ping', 'Hello this is a test message...', credential, 10)
  await m1.sendMessage(roomId, box)
})

test('should box and unbox the message', async () => { // eslint-disable-line jest/no-test-callback
  const sender = crypto.keyPair()
  const receiver = crypto.keyPair()
  const box = await m1.boxMessage(sender.box.secretKey, sender.box.publicKey, receiver.box.publicKey, 'ping', 'Hello this is a test message...', credential, 10)
  const msgReceived1 = m2.unboxMessage(box, receiver.box.secretKey)
  expect(msgReceived1.msg.recipeId).toEqual('ping')
  expect(msgReceived1.msg.stateId).toEqual(10)
  const msgReceived2 = m2.unboxMessage(box, receiver.box.secretKey, sender.box.publicKey)
  expect(msgReceived2.msg.recipeId).toEqual('ping')
  expect(msgReceived2.msg.stateId).toEqual(10)
})

test('should list rooms', async () => {
  let result = await m1.joinedRooms()
  expect(result[0]).toMatch(/!.*:labdev.matrix.lorena.tech/)
  // do it a bunch of times to trigger rate limiting, as otherwise it sometimes happens, sometimes not
  for (let i = 0; i < 25; i++) {
    result = await m2.joinedRooms()
    expect(result[0]).toMatch(/!.*:labdev.matrix.lorena.tech/)
  }
})

test('should leave a room', async () => {
  let result = await m1.leaveRoom(roomId)
  expect(result.status).toBe(200)
  result = await m2.leaveRoom(roomId)
  expect(result.status).toBe(200)
})
