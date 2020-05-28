const LorenaCrypto = require('./index')
const message = 'Hello World'
const password = 'password random'

let alice
let signature = false
let msgEncrypted = false
let rnd = false
const crypto = new LorenaCrypto(true)

test('KeyPair generation: ', () => {
  alice = crypto.newKeyPair()
  expect(alice.mnemonic).not.toBeUndefined()
  const mnemArray = alice.mnemonic.split(' ')
  expect(mnemArray.length).toEqual(12)
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
test('Should encrypt (symmetric) a message', async () => {
  msgEncrypted = await crypto.encryptSymmetric(password, message)
  expect(msgEncrypted.encrypted).not.toBeUndefined()
  expect(msgEncrypted.nonce).not.toBeUndefined()
})

test('Should decrypt (symmetric) a message', async () => {
  const msg = await crypto.decryptSymmetric(password, msgEncrypted)
  expect(msg).toEqual(message)
})
