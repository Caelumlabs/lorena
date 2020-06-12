'use strict'
const BlockchainSubstrate = require('./index.js')
const Crypto = require('@caelumlabs/crypto')
const Utils = require('./utils')

const crypto = new Crypto(true)

let alice, bob
let blockchain
let did
const diddocHash = 'AQwafuaFswefuhsfAFAgsw'

test('init', async () => {
//  blockchain = new BlockchainSubstrate('wss://labdev.substrate.lorena.tech')
  blockchain = new BlockchainSubstrate('ws://127.0.0.1:9944/')
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

test.skip('Should send Tokens from Alice to Bob', async () => {
  jest.setTimeout(30000)
  bob = blockchain.getAddress('//Bob')
  expect(bob).toEqual('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty')
  const amount1 = await blockchain.addrState(alice)
  await blockchain.transferTokens('5Epmnp6ts1r3qRFEv9di7wxMNnihd1hXDCPp49GUeUqapSz1', 3000000000000000)
  const amount2 = await blockchain.addrState(alice)
  expect(amount1).not.toEqual(amount2)
})

test('Should Save a DID to Blockchain', async () => {
  alice = blockchain.setKeyring('//Alice')
  bob = blockchain.getAddress('//Bob')

  await blockchain.registerDid(did, bob, 2)
  const subs = await blockchain.subscribe2RegisterEvents(blockchain.api, 'DidRegistered')
  const registeredDidEvent = JSON.parse(subs)
  const didData = await blockchain.getDidData(did)
  const didDataJson = JSON.parse(didData)

  // DID Owner should be address BOB
  expect(didDataJson.owner).toEqual(bob)
  // DID promoter should belong to Alice
  const promoter = await blockchain.getOwnerFromDid(didData.did_promoter)
  expect(promoter.toString()).toEqual(alice)
})

test.skip('Register a Did Document', async () => {
  await blockchain.registerDidDocument(did, diddocHash)
})

test.skip('Check registration event', async () => {
  const subs = await blockchain.subscribe2RegisterEvents(blockchain.api, 'DidDocumentRegistered')
  const registeredDidDocument = JSON.parse(subs)
  // Diddoc hash should change from empty to the matrix `mediaId` url represented by a `Vec<u8>`
  const regDidDoc = registeredDidDocument[2].replace(/0+$/g, '')
  expect(Utils.hexToBase64(regDidDoc.split('x')[1])).toEqual(diddocHash)
})

test.skip('Check a Did Document', async () => {
  const result = await blockchain.getDidDocHash(did)
  if (result !== '') {
    expect(result).toEqual(diddocHash)
  }
})

test.skip('GetKey from a DID', async () => {
  const result = await blockchain.getActualDidKey(did)
  console.log('RESULT -> %O', result)
  if (result !== '') {
    expect(result).toEqual(Utils.hexToBase64(blockchain.keypair.publicKey))
  }
})

test.skip('Should Rotate a Key', async () => {
  const newKeyPair = await crypto.keyPair()
  const newPubKey = newKeyPair.keyPair.publicKey
  await blockchain.rotateKey(did, newPubKey)
  const subs = await blockchain.subscribe2RegisterEvents(blockchain.api, 'KeyRotated')
  const keyRotated = JSON.parse(subs)
  expect(keyRotated[2].split('x')[1]).toEqual(Utils.base64ToHex(newPubKey))
  const key = await blockchain.getActualDidKey(did)
  expect(Utils.hexToBase64(key)).toEqual(Utils.hexToBase64(newPubKey))
})

test('should clean up after itself', () => {
  blockchain.disconnect()
})
