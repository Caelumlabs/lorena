const LorenaCrypto = require('./index')
const message = 'Hello World'
const password = 'password random'

let alice
let signature = false
let rnd = false
const crypto = new LorenaCrypto(true)

test('KeyPair generation: ', () => {
  alice = crypto.newKeyPair()
  expect(alice.mnemonic).not.toBeUndefined()
  const mnemonicArray = alice.mnemonic.split(' ')
  expect(mnemonicArray.length).toEqual(12)
  expect(alice.keyPair.publicKey).not.toBeUndefined()
  expect(alice.keyPair.publicKey.length).toEqual(32)
  expect(alice.keyPair.secretKey).not.toBeUndefined()
  expect(alice.keyPair.secretKey.length).toEqual(64)
})

test('Should create a KeyPair from a Seed', () => {
  const bob = crypto.keyPairFromSeed(alice.mnemonic)
  expect(alice.keyPair.secretKey.toString).toEqual(bob.keyPair.secretKey.toString)
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

test('Should create a new Signature: ', () => {
  signature = crypto.signMessage(message, alice.keyPair)
  expect(signature).not.toBeUndefined()
})

test('Should Check the Signature', () => {
  const check = crypto.checkSignature(message, signature, alice.keyPair.publicKey)
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
