'use strict'
const BlockchainSubstrate = require('./index.js')
const Crypto = require('@caelumlabs/crypto')
const Utils = require('./utils')

const crypto = new Crypto(true)

let alice
let blockchain
let did
const diddocHash = 'zdpuAqghmmBxwiS7byTRoqd2ZbhHbzcAf6AnxYPK7yeicEjDv'

test('init', async () => {
  blockchain = new BlockchainSubstrate('wss://labdev.substrate.lorena.tech')
  //  blockchain = new BlockchainSubstrate('ws://127.0.0.1:9944/')
  expect(blockchain).toBeDefined()
  await crypto.init()
  did = crypto.random(16)
  expect(did).not.toEqual('')
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
  expect(blockchain).toBeDefined()
})

test('Should use a SURI as a key', async () => {
  alice = blockchain.setKeyring('//Alice')
  expect(alice).toEqual('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
})

const zeldaAmount = 3000000000000000
let zeldaAddress
const zeldaMnemonic = 'upset tip zone bid verb problem despair clean basic carpet fuel feature'

test('Should send Tokens from Alice to a new address', async () => {
  jest.setTimeout(30000)
  const zeldaAddress = blockchain.getAddress(zeldaMnemonic)
  expect(zeldaAddress).toEqual('5H42K5LNPmBKsVnTXTLtmjib7VfVbGVG92nTwNPbAs4AZQP5')
  const amount1 = await blockchain.addrState(alice)
  await blockchain.transferTokens(zeldaAddress, zeldaAmount)
  const amount2 = await blockchain.addrState(alice)
  expect(amount1).not.toEqual(amount2)
})

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000))
test('Should sweep tokens from Zelda to Alice', async () => {
  jest.setTimeout(90000)
  blockchain.setKeyring(zeldaMnemonic)
  const zeldaBalance1 = await blockchain.addrState(zeldaAddress)
  // expect(zeldaBalance1.balance.free).toEqual(zeldaAmount)
  await blockchain.transferAllTokens(blockchain.getAddress('//Alice'))
  sleep(10)
  const zeldaBalance2 = await blockchain.addrState(zeldaAddress)
  expect(zeldaBalance2.balance.free.toHuman()).toEqual('0')
  expect(zeldaBalance2).not.toEqual(zeldaBalance1)
})

test.skip('Should Save a DID to Blockchain', async () => {
  alice = blockchain.setKeyring('//Alice')
  await blockchain.registerDid(did, alice, 2)
  const subs = await blockchain.wait4Event('DidRegistered')
  const registeredDid = JSON.parse(subs)
  const didData = await blockchain.api.query.lorenaDids.didData(Utils.base64ToHex(did))
  const didDataJson = JSON.parse(didData)
  // Identity `owner` should be address Alice
  expect(didDataJson.owner).toEqual(blockchain.keypair.address)
  // Identity `owner` from RegisteredEvent should be address Alice
  expect(registeredDid[1]).toEqual(blockchain.keypair.address)
})

test.skip('Register a Did Document', async () => {
  await blockchain.registerDidDocument(did, diddocHash)
})

// Disabled test due to CI failure
test.skip('Check registration event', async () => {
  jest.setTimeout(30000)
  const subs = await blockchain.wait4Event('DidDocumentRegistered')
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
  const subs = await blockchain.wait4Event('KeyRotated')
  const keyRotated = JSON.parse(subs)
  expect(keyRotated[2].split('x')[1]).toEqual(Utils.base64ToHex(newPubKey))
  const key = await blockchain.getActualDidKey(did)
  expect(Utils.hexToBase64(key)).toEqual(Utils.hexToBase64(newPubKey))
})

test('should clean up after itself', () => {
  blockchain.disconnect()
  expect(blockchain).toBeDefined()
})
