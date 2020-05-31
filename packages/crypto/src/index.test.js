const LorenaCrypto = require('./index')
const crypto = new LorenaCrypto()

let alice
let rnd = false
const message = 'Hello World'
const password = 'password random'

test('Init Crypto', async () => {
  await crypto.init()
})

test('KeyPair generation', async () => {
  alice = crypto.keyPair()
  expect(alice.mnemonic).not.toBeUndefined()
  const mnemonicArray = alice.mnemonic.split(' ')
  expect(mnemonicArray.length).toEqual(12)
  expect(alice.publicKey).not.toBeUndefined()
  expect(alice.publicKey.length).toEqual(66)
  expect(alice.address).not.toBeUndefined()
  expect(alice.address.length).toEqual(48)
})

test('KeyPair generation from mnemonic', async () => {
  const alice2 = await crypto.keyPair(alice.mnemonic)
  expect(alice.mnemonic).not.toBeUndefined()
  expect(alice.pubKey).toEqual(alice2.pubKey)
})

test('Should hash a String: ', () => {
  const result = crypto.blake2('Hello world')
  expect(result).not.toBeUndefined()
})

test('Should create a random String', () => {
  rnd = crypto.random()
  expect(rnd).not.toBeUndefined()
  expect(rnd.length).toEqual(32)
  rnd = crypto.random(16)
  expect(rnd.length).toEqual(16)
  rnd = crypto.random(8)
  expect(rnd.length).toEqual(8)
})

test('Should create a random PIN', () => {
  rnd = crypto.randomPin()
  expect(rnd).not.toBeUndefined()
  expect(rnd.length).toEqual(6)
  rnd = crypto.randomPin(4)
  expect(rnd.length).toEqual(4)
})

test('Should create a new Signature: ', async () => {
  const signature = crypto.signMessage(message, alice.keyPair)
  expect(signature).not.toBeUndefined()
  const check = crypto.checkSignature(message, signature, alice.address)
  expect(check).toEqual(true)
})

// Encryption.
test('Should encrypt & decrypt a message', () => {
  const msgEncrypted = crypto.encrypt(password, message)
  expect(msgEncrypted.encrypted).not.toBeUndefined()
  expect(msgEncrypted.nonce).not.toBeUndefined()
  const msg = crypto.decrypt(password, msgEncrypted)
  expect(msg).toEqual(message)
})

// Encryption.
test('Should encrypt & decrypt an object', () => {
  const msgEncrypted = crypto.encryptObj(password, { msg: message, test: 'áà # test' })
  const testMesg = JSON.parse(msgEncrypted)
  expect(testMesg.e).not.toBeUndefined()
  expect(testMesg.n).not.toBeUndefined()

  const result = crypto.decryptObj(password, msgEncrypted)
  expect(result.msg).toEqual(message)
  expect(result.test).toEqual('áà # test')
})

// Multiaddress.
test('USing multiaddresses', () => {
  const a1 = crypto.keyPair()
  const a2 = crypto.keyPair()
  const a3 = crypto.keyPair()
  const a4 = crypto.keyPair()
  const a5 = crypto.keyPair()

  const addresses = [a1.address, a2.address, a3.address, a4.address, a5.address]
  const multiAddress = crypto.multiAddress(addresses)
  expect(multiAddress).not.toBeUndefined()

  const signature = crypto.signMessage(message, a1.keyPair)
  expect(signature).not.toBeUndefined()
  const check = crypto.checkSignature(message, signature, multiAddress)
  expect(check).toEqual(true)
})
