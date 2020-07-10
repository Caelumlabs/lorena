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
    }
  }

  // Tests with User 1
  await m1.connect(u1, p1)
  const loopm1 = await m1.loop()
  loopm1('', m1.context).subscribe(async (msg) => {
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
  const loopm2 = await m2.loop()
  loopm2('', m2.context).subscribe(async (msg) => {
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
        expect(boxReceived.msg.recipe).toEqual('ping')
        expect(boxReceived.msg.recipeId).toEqual(10)
        await endTest(4, m1, m2)
        break
      case 'contact-accepted' :
        await endTest(5, m1, m2)
        break
    }
  })

  // Connect m1 and m2
  const roomName = m1.randomUsername()
  const newRoomId = await m1.createConnection(roomName, `@${u2}:${m2.context.serverName}`)
  expect(newRoomId).toBeDefined()

  // Sends a message to user2
  const box = await m1.boxMessage(sender.box.secretKey, sender.box.publicKey, receiver.box.publicKey, 'ping', 'Hello this is a test message...', 10)
  await m1.sendMessage(newRoomId, box)
})

test('should box and unbox the message', async () => { // eslint-disable-line jest/no-test-callback
  const sender = crypto.keyPair()
  const receiver = crypto.keyPair()
  const box = await m1.boxMessage(sender.box.secretKey, sender.box.publicKey, receiver.box.publicKey, 'ping', 'Hello this is a test message...', 10)
  const msgReceived1 = m2.unboxMessage(box, receiver.box.secretKey)
  expect(msgReceived1.msg.recipe).toEqual('ping')
  expect(msgReceived1.msg.recipeId).toEqual(10)
  const msgReceived2 = m2.unboxMessage(box, receiver.box.secretKey, sender.box.publicKey)
  expect(msgReceived2.msg.recipe).toEqual('ping')
  expect(msgReceived2.msg.recipeId).toEqual(10)
})
