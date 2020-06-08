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
        if (event.section === 'lorenaDids' && event.method === eventMethod) {
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

test('before all', async () => {
  await crypto.init()
  blockchain = new BlockchainSubstrate('wss://labdev.substrate.lorena.tech')
  // blockchain = new BlockchainSubstrate('ws://127.0.0.1:9944/')
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
  await blockchain.registerDid(did, blockchain.keypair.address, 2)
  const subs = await subscribe2RegisterEvents(blockchain.api, 'DidRegistered')
  const registeredDid = JSON.parse(subs)
  const didData = await blockchain.api.query.lorenaDids.didData(Utils.base64ToHex(did))
  const didDataJson = JSON.parse(didData)
  // DID `owner` should be address Alice
  expect(didDataJson.owner).toEqual(blockchain.keypair.address)
  // DID `owner` from RegisteredEvent should be address Alice
  expect(registeredDid[1]).toEqual(blockchain.keypair.address)

  // Check if storage is build correctly
  const account = await blockchain.api.query.lorenaDids.ownerFromDid(Utils.base64ToHex(did))
  // Account should be the same as the one read from Substrate Events
  expect(account.toString()).toEqual(registeredDid[2])
})

let subs

test('Register a Did Document and check registration event', async () => {
  jest.setTimeout(30000)
  await blockchain.registerDidDocument(did, diddocHash)
  subs = await subscribe2RegisterEvents(blockchain.api, 'DidDocumentRegistered')
  const registeredDidDocument = JSON.parse(subs)
  // Diddoc hash should change from empty to the matrix `mediaId` url represented by a `Vec<u8>`
  expect(Utils.hexToBase64(registeredDidDocument[2].split('x')[1])).toEqual(diddocHash)
})

test('Check a Did Document', async () => {
  const result = await blockchain.didDocumentFromDid(did)
  expect(result).toEqual(diddocHash)
})

test('GetKey from a DID', async () => {
  const result = await blockchain.publicKeyFromDid(did)
  expect(result).toEqual(Utils.hexToBase64(blockchain.keypair.publicKey))
})

test('Should Rotate a Key', async () => {
  const newKeyPair = await crypto.keyPair()
  const newPubKey = newKeyPair.keyPair.publicKey
  await blockchain.rotateKey(did, newPubKey)
  const subs = await subscribe2RegisterEvents(blockchain.api, 'KeyRotated')
  const keyRotated = JSON.parse(subs)
  expect(keyRotated[2].split('x')[1]).toEqual(Utils.base64ToHex(newPubKey))
  const key = await blockchain.publicKeyFromDid(did)
  expect(key).toEqual(Utils.hexToBase64(newPubKey))
})

test('should clean up after itself', () => {
  blockchain.disconnect()
})
