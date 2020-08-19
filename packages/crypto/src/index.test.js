const LorenaCrypto = require('./index')
const crypto = new LorenaCrypto()

let alice
let rnd = false
const message = 'Hello World'
const password = 'password random'

test('Init Crypto', async () => {
  await crypto.init()
  expect(crypto).toBeDefined()
})

test('KeyPair generation', async () => {
  alice = crypto.keyPair()
  expect(alice.mnemonic).toBeDefined()
  const mnemonicArray = alice.mnemonic.split(' ')
  expect(mnemonicArray).toHaveLength(12)
  expect(alice.publicKey).toBeDefined()
  expect(alice.publicKey).toHaveLength(66)
  expect(alice.address).toBeDefined()
  expect(alice.address).toHaveLength(48)
  expect(alice.box).toBeDefined()
  expect(alice.box.publicKey).toBeDefined()
  expect(alice.box.secretKey).toBeDefined()

  const pubKey = crypto.u8aToBase58(alice.box.publicKey)
  expect(pubKey).toBeDefined()
  expect(alice.box.publicKey).toEqual(crypto.base58ToU8a(pubKey))
})

test('KeyPair generation from mnemonic', async () => {
  const alice2 = crypto.keyPair(alice.mnemonic)
  expect(alice.mnemonic).toBeDefined()
  expect(alice.pubKey).toEqual(alice2.pubKey)
})

test('Should hash a String: ', () => {
  const result = crypto.blake2('Hello world')
  expect(result).toBeDefined()
})

test('Should create a random String', () => {
  rnd = crypto.random()
  expect(rnd).toBeDefined()
  expect(rnd).toHaveLength(32)
  rnd = crypto.random(16)
  expect(rnd).toHaveLength(16)
  rnd = crypto.random(8)
  expect(rnd).toHaveLength(8)
})

test('Should create a random PIN', () => {
  rnd = crypto.randomPin()
  expect(rnd).toBeDefined()
  expect(rnd).toHaveLength(6)
  rnd = crypto.randomPin(4)
  expect(rnd).toHaveLength(4)
})

test('Should create a new Signature: ', async () => {
  const signature = crypto.signMessage(message, alice.keyPair)
  expect(signature).toBeDefined()
  const check = crypto.checkSignature(message, signature, alice.address)
  expect(check).toEqual(true)
})

// Encryption.
test('Should encrypt & decrypt a message', () => {
  const msgEncrypted = crypto.encrypt(password, message)
  expect(msgEncrypted.encrypted).toBeDefined()
  expect(msgEncrypted.nonce).toBeDefined()
  const msg = crypto.decrypt(password, msgEncrypted)
  expect(msg).toEqual(message)
})

// Encryption.
test('Should encrypt & decrypt an object', () => {
  const msgEncrypted = crypto.encryptObj(password, { msg: message, test: 'áà # test' })
  const testMessage = JSON.parse(msgEncrypted)
  expect(testMessage.e).toBeDefined()
  expect(testMessage.n).toBeDefined()

  const result = crypto.decryptObj(password, msgEncrypted)
  expect(result.msg).toEqual(message)
  expect(result.test).toEqual('áà # test')
})

test('nacl encryption', () => {
  const receiver = crypto.keyPair()
  const msgEncrypted = crypto.box(message, alice.box.secretKey, receiver.box.publicKey)
  const msg = crypto.unbox(msgEncrypted, alice.box.publicKey, receiver.box.secretKey)
  expect(msg).toEqual(message)
  const objEncrypted = crypto.boxObj({ msg: message }, alice.box.secretKey, receiver.box.publicKey)
  const obj = crypto.unboxObj(objEncrypted, alice.box.publicKey, receiver.box.secretKey)
  expect(obj).toEqual({ msg: message })
})
