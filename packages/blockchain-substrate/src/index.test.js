/* eslint-disable jest/no-commented-out-tests */
/* eslint-disable jest/no-disabled-tests */
'use strict'
const BlockchainSubstrate = require('./index.js')
const Crypto = require('@caelumlabs/crypto')
const Utils = require('./utils')

const crypto = new Crypto(true)
const GENESIS_SEED_FROM = '//Alice'

// let alice, bob, charlie
const blockchain = new BlockchainSubstrate('wss://labdev.substrate.lorena.tech')
let did, tempWallet, aliceAddr
// const diddocHash = 'bafyreiecd7bahhf6ohlzg5wu4eshn655kqhgaguurupwtbnantf54kloem'
const zeldaMnemonic = 'gallery trim cycle bird green garbage city cable action steel giraffe oppose'

test('init', async () => {
  // blockchain = new BlockchainSubstrate('ws://127.0.0.1:9944/')
  await crypto.init()
  did = crypto.random(16)
  aliceAddr = blockchain.setKeyring(GENESIS_SEED_FROM)
  blockchain.getAddress('//Alice')
  expect(aliceAddr).toEqual('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
  const zeldaKey = blockchain.getKeyring(zeldaMnemonic)
  expect(zeldaKey).toBeDefined()
  tempWallet = crypto.keyPair()
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
  await blockchain.connect()
  expect(blockchain).toBeDefined()
})

test('Should send Tokens from Alice to tempWallet', async () => {
  const amount1 = await blockchain.addrState(aliceAddr)
  await blockchain.transferTokens(tempWallet.address, 3000000000000000)
  const amount2 = await blockchain.addrState(aliceAddr)
  expect(amount1).not.toEqual(amount2)
})

test('Should send Tokens from Alice to Zelda', async () => {
  const amount1 = await blockchain.addrState(aliceAddr)
  await blockchain.transferTokens(blockchain.getAddress(zeldaMnemonic), 3000000000000000)
  const amount2 = await blockchain.addrState(aliceAddr)
  expect(amount1).not.toEqual(amount2)
})

test('Should Save a DID to Blockchain', async () => {
  // Result should equal to true => No errors
  const result = await blockchain.registerDid(did, tempWallet.address, 2)
  expect(result).toEqual(true)

  // Promoter Account from even data should be address Alice
  const registeredDidEvent = await blockchain.wait4Event('DidRegistered')
  expect(registeredDidEvent[1]).toEqual(aliceAddr)

  // DID Owner should be the address of tempWallet
  const didDataJson = await blockchain.getDidData(did)
  expect(didDataJson.owner).toEqual(tempWallet.address)

  // DID promoter should belong to Alice
  const promoter = await blockchain.getOwnerFromDid(didDataJson.did_promoter)
  expect(promoter.toString()).toEqual(aliceAddr)
})

test('Should try again to register the same DID and fail', async () => {
  const result = await blockchain.registerDid(did, tempWallet.address, 2)
  expect(result).toEqual(false)
})

/*
test('Register a Did Document', async () => {
  console.log(tempWallet.address)
  blockchain.setKeyring(tempWallet.mnemonic)
  let result = await blockchain.registerDidDocument(did, diddocHash)
  expect(result).toEqual(true)
  const didData = await blockchain.getDidData(did)
  expect(didData.did_doc.toString().split('x')[1]).toEqual(Utils.base64ToHex(diddocHash))
  const registeredDocumentEvent = await blockchain.wait4Event('DidDocumentRegistered')
  // Result should equal to true => No errors
  expect(result).toEqual(true)
  // DID Document of event should be equal to entered
  expect(registeredDocumentEvent[2].split('x')[1]).toEqual(Utils.base64ToHex(diddocHash))
  // DID Document of DIDData record should be equal to entered
  result = await blockchain.getDidDocHash(did)
  if (result !== '') {
    expect(result).toEqual(diddocHash)
  }
})
*/

test('Should Rotate a Key', async () => {
  blockchain.setKeyring(tempWallet.mnemonic)
  const newKeyPair = await crypto.keyPair()
  const newPubKey = newKeyPair.keyPair.publicKey
  await blockchain.rotateKey(did, newPubKey)
  const registeredRotateKeyEvent = await blockchain.wait4Event('KeyRotated')
  // DID Document of event should be equal to entered
  expect(registeredRotateKeyEvent[2].split('x')[1]).toEqual(Utils.base64ToHex(newPubKey))

  const key = await blockchain.getActualDidKey(did)
  expect(Utils.toUTF8Array(key)).toEqual(Utils.toUTF8Array(newPubKey))
})

/*
test('Trying to Change Owner not being the owner. Should fail', async () => {
  blockchain.setKeyring('//Alice')
  const result = await blockchain.changeDidOwner(did, charlie)
  // Result should equal to false => error
  expect(result).toEqual(false)
})

test('Should Change Owner', async () => {
  blockchain.setKeyring('//Bob')
  await blockchain.changeDidOwner(did, charlie)
  const subs = await blockchain.wait4Event('NewOwner')
  const registeredNewOwnerEvent = JSON.parse(subs)

  // New owner of event should be equal to entered
  expect(registeredNewOwnerEvent[2]).toEqual(charlie)
})

test('Try to remove DID not being the owner. Should fail', async () => {
  blockchain.setKeyring('//Bob')
  const result = await blockchain.removeDid(did, charlie)
  // Result should equal to false => error
  expect(result).toEqual(false)
})

test('Should Remove DID', async () => {
  jest.setTimeout(80000)
  blockchain.setKeyring('//Charlie')
  await blockchain.removeDid(did)
  const subs = await blockchain.wait4Event('DidRemoved')
  const didRemovedEvent = JSON.parse(subs)
  console.log('SUBS -> %O', subs)

  // New owner of event should be equal to entered
  expect(Utils.hexToBase64(didRemovedEvent[1].split('x')[1])).toEqual(Utils.base64ToHex(did))
})

test('Should sweep tokens from Zelda to Alice', async () => {
  const zeldaAddress = blockchain.getAddress(zeldaMnemonic)
  jest.setTimeout(90000)
  blockchain.setKeyring(zeldaMnemonic)
  const zeldaBalance1 = await blockchain.addrState(zeldaAddress)
  await blockchain.transferAllTokens(blockchain.getAddress('//Alice'))
  const zeldaBalance2 = await blockchain.addrState(zeldaAddress)
  expect(zeldaBalance2.balance.free.toHuman()).toEqual('0')
  expect(zeldaBalance2).not.toEqual(zeldaBalance1)
})
*/
test('should clean up after itself', () => {
  blockchain.disconnect()
  expect(blockchain).toBeDefined()
})
