'use strict'
const BlockchainSubstrate = require('./index.js')
const Crypto = require('@caelumlabs/crypto')
const Utils = require('./utils')

const crypto = new Crypto(true)

const subscribe2RegisterEvents = (api, eventMethod) => {
  return new Promise(resolve => {
    api.query.system.events(events => {
      events.forEach(record => {
        const { event } = record
        const types = event.typeDef
        if (event.section === 'lorenaModule' && event.method === eventMethod) {
          for (let i = 0; i < event.data.length; i++) {
            // All events have a a type 'AccountId'
            if (types[i].type === 'AccountId') {
              resolve(event.data.toString())
            }
          }
          resolve([])
        }
      })
    })
  })
}

let alice, bob
let blockchain
let did
const diddocHash = 'AQwafuaFswefuhsfAFAgsw'

test('blah', async () => {
  blockchain = new BlockchainSubstrate('wss://labdev.substrate.lorena.tech')
  await crypto.init()
  did = crypto.random(16)
})

test('should have good format conversion', () => {
  const base64 = 'Wldvd1pqVmZWbEoxYVdaWFdGOW5ja05I'
  const hex = '576c647664317071566d5a5762456f7859566461574664474f57356a61303549'
  const hexed = Utils.base64ToHex(base64)
  const based = Utils.hexToBase64(hex)
  expect(hexed).toEqual(hex)
  expect(based).toEqual(base64)
})

test('should Connect', async () => {
  jest.setTimeout(50000)
  await blockchain.connect()
})

test('Should use a SURI as a key', async () => {
  alice = blockchain.setKeyring('//Alice')
  expect(alice).toEqual('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
})

test('Should send Tokens from Alice to Bob', async () => {
  jest.setTimeout(30000)
  bob = blockchain.getAddress('//Bob')
  expect(bob).toEqual('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty')
  const amount1 = await blockchain.addrState(alice)
  await blockchain.transferTokens('5Epmnp6ts1r3qRFEv9di7wxMNnihd1hXDCPp49GUeUqapSz1', 3000000000000000)
  const amount2 = await blockchain.addrState(alice)
  expect(amount1).not.toEqual(amount2)
})

test('Should Save a DID to Blockchain', async () => {
  await blockchain.registerDid(did, blockchain.keypair.publicKey)
  const subs = await subscribe2RegisterEvents(blockchain.api, 'DidRegistered')
  const registeredDid = JSON.parse(subs)
  const identity = await blockchain.api.query.lorenaModule.identities(Utils.base64ToHex(did))
  const identityJson = JSON.parse(identity)
  // Identity `owner` should be address Alice
  expect(identityJson.owner).toEqual(blockchain.keypair.address)
  // Identity `owner` from RegisteredEvent should be address Alice
  expect(registeredDid[0]).toEqual(blockchain.keypair.address)
  // Check of object `Identity` was created as expected
  expect(identityJson.owner).toEqual(blockchain.keypair.address)
  // Identity `owner` from RegisteredEvent should be address Alice
  expect(registeredDid[0]).toEqual(blockchain.keypair.address)
  // Identity `key_index` should be 1
  expect(identityJson.key_index).toEqual(1)

  // Check if object `Key` was created as expected
  const keyRegister = await blockchain.getActualKey(did)
  // Key `key` should be the same as the one read from Substrate Events
  expect(keyRegister.key.toString()).toEqual(registeredDid[2])
  // Key `key` should de publicKey converted from bytes to utf8
  expect(keyRegister.key.toString().split('x')[1]).toEqual(Utils.base64ToHex(blockchain.keypair.publicKey))
  // Key `diddoc` should be Empty
  expect(keyRegister.diddoc.isEmpty).toEqual(true)
  // Key `valid_from` should be a valid timestamp (less than a minute ago)
  expect(keyRegister.valid_from.isEmpty).toEqual(false)
  // Key `valid_to` should be 0 representing an empty value
  expect(keyRegister.valid_to.isEmpty).toEqual(true)
})

test('Register a Did Document', async () => {
  await blockchain.registerDidDocument(did, diddocHash)
})

test('Check registration event', async () => {
  const subs = await subscribe2RegisterEvents(blockchain.api, 'DidDocumentRegistered')
  const registeredDidDocument = JSON.parse(subs)
  // Diddoc hash should change from empty to the matrix `mediaId` url represented by a `Vec<u8>`
  expect(Utils.hexToBase64(registeredDidDocument[2].split('x')[1])).toEqual(diddocHash)
})

test('Check a Did Document', async () => {
  const result = await blockchain.getDidDocHash(did)
  expect(result).toEqual(diddocHash)
})

test('GetKey from a DID', async () => {
  const result = await blockchain.getActualDidKey(did)
  expect(result).toEqual(Utils.hexToBase64(blockchain.keypair.publicKey))
})

test('Should Rotate a Key', async () => {
  const newKeyPair = await crypto.keyPair()
  const newPubKey = newKeyPair.keyPair.publicKey
  await blockchain.rotateKey(did, newPubKey)
  const subs = await subscribe2RegisterEvents(blockchain.api, 'KeyRotated')
  const keyRotated = JSON.parse(subs)
  expect(keyRotated[2].split('x')[1]).toEqual(Utils.base64ToHex(newPubKey))
  const key = await blockchain.getActualDidKey(did)
  expect(key).toEqual(Utils.hexToBase64(newPubKey))
})

test('should clean up after itself', () => {
  blockchain.disconnect()
})
