'use strict'
const chai = require('chai')
const util = require('util')

// Configure chai
// chai.should()
const expect = chai.expect

describe('Test Blockchain Substrate Connection and functions', function () {
  const BlockchainSubstrate = require('../src/index.js')
  const Crypto = require('@caelumlabs/crypto')
  const Utils = require('../src/utils')

  const crypto = new Crypto(true)
  const GENESIS_SEED_FROM = '//Alice'

  // let alice, bob, charlie
  const blockchain = new BlockchainSubstrate('wss://labdev.substrate.lorena.tech')
  // Uncomment for testing in local blockchain and comment out the line before
  // to restore testing on cloud
  // const blockchain = new BlockchainSubstrate('ws://localhost:9944')
  let did, did2, did3
  let aliceAddr, tempWallet, tempWallet2, tempWallet3
  let cid1, cid2, cid3
  const diddocHash = 'bafyreiecd7bahhf6ohlzg5wu4eshn655kqhgaguurupwtbnantf54kloem'
  const storageAddress = 'bafyreiecd7bahhf6ohlzg5wu4eshn655kqhgaguurupwtbnantf54kloem'
  // const credential = 'bafyreiecd7bahhf6ohlzg5wu4eshn655kqhgaguurupwtbnantf54kloem'
  const zeldaMnemonic = 'gallery trim cycle bird green garbage city cable action steel giraffe oppose'

  before(async () => {
    await crypto.init()
    did = crypto.random(16)
    did2 = crypto.random(16)
    did3 = crypto.random(16)
    cid1 = crypto.random(16)
    cid2 = crypto.random(16)
    cid3 = crypto.random(16)
    aliceAddr = blockchain.setKeyring(GENESIS_SEED_FROM)
    blockchain.getAddress('//Alice')
    expect(aliceAddr).to.equal('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
    const zeldaKey = blockchain.getKeyring(zeldaMnemonic)
    expect(zeldaKey).to.not.be.undefined;
    tempWallet = crypto.keyPair()
    tempWallet2 = crypto.keyPair()
    tempWallet3 = crypto.keyPair()
  })

  it('should have good format conversion', () => {
    const base64 = 'Wldvd1pqVmZWbEoxYVdaWFdGOW5ja05I'
    const hex = '576c647664317071566d5a5762456f7859566461574664474f57356a61303549'
    const hexed = Utils.base64ToHex(base64)
    const based = Utils.hexToBase64(hex)
    expect(hexed).to.equal(hex);
    expect(based).to.equal(base64);
  })

  it('should Connect', async () => {
    await blockchain.connect()
    expect(blockchain).to.not.be.undefined;
  })

  it('Should send Tokens from Alice to tempWallet', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokens(tempWallet.address, 3000000000000000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.to.equal(amount2);
  })

  it('Should send Tokens from Alice to Zelda', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokens(blockchain.getAddress(zeldaMnemonic), 3000000000000000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.to.equal(amount2)
  })

  it('Should send Tokens from Alice to tempWallet without paying fee', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokensNoFees(tempWallet.address, 3000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.to.equal(amount2)
  })

  it('Should send Tokens from Alice to tempWallet2 without paying fee', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokensNoFees(tempWallet2.address, 3000000000000000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.to.equal(amount2)
  })

  it('Should send Tokens from Alice to tempWallet3 without paying fee', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokensNoFees(tempWallet3.address, 3000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.to.equal(amount2)
  })

  it('Should Save a DID to Blockchain', async () => {
    // Result should equal to true => No errors
    const result = await blockchain.registerDid(did, tempWallet.address, 2000)
    expect(result).to.equal(true)

    // Promoter Account from even data should be address Alice
    const registeredDidEvent = await blockchain.wait4Event('DidRegistered')
    expect(registeredDidEvent[1]).to.equal(aliceAddr)

    // DID Owner should be the address of tempWallet
    const didDataJson = await blockchain.getDidData(did)
    expect(didDataJson.owner).to.equal(tempWallet.address)

    // DID promoter should belong to Alice
    const promoter = await blockchain.getOwnerFromDid(didDataJson.did_promoter)
    expect(promoter.toString()).to.equal(aliceAddr)
  })

  it('Should try again to register the same DID and fail', async () => {
    const result = await blockchain.registerDid(did, tempWallet.address, 2000)
    expect(result).to.equal(false)
  })

  it('Should Save a DID to Blockchain with level 11 (1-1999) Organization account', async () => {
    // Result should equal to true => No errors
    const result = await blockchain.registerDid(did2, tempWallet2.address, 11)
    expect(result).to.equal(true)

    // Promoter Account from even data should be address Alice
    const registeredDidEvent = await blockchain.wait4Event('DidRegistered')
    expect(registeredDidEvent[1]).to.equal(aliceAddr)

    // DID Owner should be the address of tempWallet
    const didDataJson = await blockchain.getDidData(did2)
    expect(didDataJson.owner).to.equal(tempWallet2.address)

    // DID promoter should belong to Alice
    const promoter = await blockchain.getOwnerFromDid(didDataJson.did_promoter)
    expect(promoter.toString()).to.equal(aliceAddr)
  })

  it('Shoudl save a DID to the Blockchain with level 5000 (2000 ->) using Organization account', async () => {
    blockchain.setKeyring(tempWallet2.mnemonic)
    // Result should equal to true => No errors
    const result = await blockchain.registerDid(did3, tempWallet3.address, 5000)
    expect(result).to.equal(true)

    // Promoter Account from even data should be address tempWallet2
    const registeredDidEvent = await blockchain.wait4Event('DidRegistered')
    expect(registeredDidEvent[1]).to.equal(tempWallet2.address)

    // DID Owner should be the address of tempWallet3
    const didDataJson = await blockchain.getDidData(did3)
    expect(didDataJson.owner).to.equal(tempWallet3.address)

    // DID promoter should belong to tempWallet2
    const promoter = await blockchain.getOwnerFromDid(didDataJson.did_promoter)
    expect(promoter.toString()).to.equal(tempWallet2.address)
  })

  // Disabled: substrate library now enforces uniqueness of diddocHash
  it.skip('Register a Did Document', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    let result = await blockchain.registerDidDocument(did, diddocHash)
    expect(result).to.equal(true)
    const didData = await blockchain.getDidData(did)
    expect(didData.did_doc.toString().split('x')[1]).to.eql(Utils.base64ToHex(diddocHash))
    const registeredDocumentEvent = await blockchain.wait4Event('DidDocumentRegistered')
    // Result should equal to true => No errors
    expect(result).to.equal(true)
    // DID Document of event should be equal to entered
    expect(registeredDocumentEvent[2].split('x')[1]).to.eql(Utils.base64ToHex(diddocHash))
    // DID Document of DIDData record should be equal to entered
    result = await blockchain.getDidDocHash(did)
    if (result !== '') {
      expect(result).to.eql(diddocHash)
    }
  })

  it('Register a Storage Address', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    let result = await blockchain.setStorageAddress(did, storageAddress)
    expect(result).to.equal(true)
    const didData = await blockchain.getDidData(did)
    expect(didData.did_doc.toString().split('x')[1]).to.eql(Utils.base64ToHex(storageAddress))
    const registeredStorageAddress = await blockchain.wait4Event('DidDocumentRegistered')
    // Result should equal to true => No errors
    expect(result).to.equal(true)
    // DID Document of event should be equal to entered
    expect(registeredStorageAddress[2].split('x')[1]).to.eql(Utils.base64ToHex(storageAddress))
    // DID Document of DIDData record should be equal to entered
    result = await blockchain.getDidDocHash(did)
    if (result !== '') {
      expect(result).to.eql(storageAddress)
    }
  })

  it('Should Rotate a Key', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    const newKeyPair = await crypto.keyPair()
    const newPubKey = newKeyPair.box.publicKey
    await blockchain.rotateKey(did, newPubKey)
    const registeredRotateKeyEvent = await blockchain.wait4Event('KeyRotated')
    // DID Document of event should be equal to entered
    expect(registeredRotateKeyEvent[2].split('x')[1]).to.equal(Utils.base64ToHex(newPubKey))

    const key = await blockchain.getActualDidKey(did)
    expect(key).to.eql(newPubKey)
  })

  it('Should add a CID to Blockchain', async () => {
    // Result should equal to true => No errors
    const cid = crypto.random(16)
    const result = await blockchain.addCid(cid)
    expect(result).to.equal(true)

    // Promoter Account from even data should be address of tempwallet
    const registeredCidEvent = await blockchain.wait4Event('CIDCreated')
    expect(registeredCidEvent[1]).to.equal(tempWallet.address)

    // DID must be DID of the Owner
    const didPromoter = await blockchain.getDidFromOwner(tempWallet.address)
    expect(registeredCidEvent[2]).to.equal(didPromoter.toString())
  })

  it('Should add three new CIDs to Blockchain', async () => {
    // Result should equal to true => No errors
    const result1 = await blockchain.addCid(cid1)
    const result2 = await blockchain.addCid(cid2)
    const result3 = await blockchain.addCid(cid3)
    expect(result1).to.equal(true)
    expect(result2).to.equal(true)
    expect(result3).to.equal(true)
  })

  it('Should read all CIDs of a DID', async () => {
    const didPromoter = await blockchain.getDidFromOwner(tempWallet.address)
    const result = await blockchain.getCIDsByDID(didPromoter)
    expect(tempWallet.address).to.be.not.undefined
  })

  it('Should delete a CID into Blockchain', async () => {
    // Result should equal to true => No errors
    const result = await blockchain.deleteCid(cid3)
    expect(result).to.equal(true)

    // Promoter Account from even data should be address of tempwallet
    const registeredCidEvent = await blockchain.wait4Event('CIDDeleted')
    expect(registeredCidEvent[1]).to.equal(tempWallet.address)

    // DID must be DID of the Owner
    const didPromoter = await blockchain.getDidFromOwner(tempWallet.address)
    expect(registeredCidEvent[2]).to.equal(didPromoter.toString())
  })

  // The following tests will pass just once if the blockchain is
  // not reinitialized. That's because a credential assigned
  // iis not deleted but marked as deleted and can not
  // be reassigned
  /*
  it('Should Assign a Credential', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    const newKeyPair = await crypto.keyPair()
    const newPubKey = newKeyPair.box.publicKey
    await blockchain.assignCredential(did, credential)
    const registeredCredentialAssignedEvent = await blockchain.wait4Event('CredentialAssigned')
    // Credential of event should be equal to entered
    expect(registeredCredentialAssignedEvent[2].split('x')[1]).to.equal(Utils.base64ToHex(credential))
  })

  it('Should Remove a Credential', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    const newKeyPair = await crypto.keyPair()
    const newPubKey = newKeyPair.box.publicKey
    await blockchain.removeCredential(did, credential)
    const registeredCredentialRemovedEvent = await blockchain.wait4Event('CredentialRemoved')
    // Credential of event should be equal to entered
    expect(registeredCredentialRemovedEvent[2].split('x')[1]).to.equal(Utils.base64ToHex(credential))
  })
  */

  /*
  it('Trying to Change Owner not being the owner. Should fail', async () => {
    blockchain.setKeyring('//Alice')
    const result = await blockchain.changeDidOwner(did, charlie)
    // Result should equal to false => error
    expect(result).to.equal(false)
  })

  it('Should Change Owner', async () => {
    blockchain.setKeyring('//Bob')
    await blockchain.changeDidOwner(did, charlie)
    const subs = await blockchain.wait4Event('NewOwner')
    const registeredNewOwnerEvent = JSON.parse(subs)

    // New owner of event should be equal to entered
    expect(registeredNewOwnerEvent[2]).to.equal(charlie)
  })

  it('Try to remove DID not being the owner. Should fail', async () => {
    blockchain.setKeyring('//Bob')
    const result = await blockchain.removeDid(did, charlie)
    // Result should equal to false => error
    expect(result).to.equal(false)
  })

  it('Should Remove DID', async () => {
    blockchain.setKeyring('//Charlie')
    await blockchain.removeDid(did)
    const subs = await blockchain.wait4Event('DidRemoved')
    const didRemovedEvent = JSON.parse(subs)
    console.log('SUBS -> %O', subs)

    // New owner of event should be equal to entered
    expect(Utils.hexToBase64(didRemovedEvent[1].split('x')[1])).to.equal(Utils.base64ToHex(did))
  })
  */

  it.skip('Should sweep tokens from Zelda to Alice', async () => {
    const zeldaAddress = blockchain.getAddress(zeldaMnemonic)
    blockchain.setKeyring(zeldaMnemonic)
    const zeldaBalance1 = await blockchain.addrState(zeldaAddress)
    await blockchain.transferAllTokens(blockchain.getAddress('//Alice'))
    const zeldaBalance2 = await blockchain.addrState(zeldaAddress)
    expect(zeldaBalance2).not.to.equal(zeldaBalance1)
  })

  it('Creates a new process and get some paths', async () => {
    // Sets the keyring (so account address)
    blockchain.setKeyring(tempWallet.mnemonic)
    // Get DID for this account
    const did = await blockchain.getDidFromOwner()
    // Obtain a random hash mocking process hash
    const processHash= Utils.hexToBase64(crypto.random(16))
    // Starts process giving process hash
    await blockchain.startProcess(did, processHash)
    // Assert data is correctly written
    const processData = await blockchain.getProcessNode(processHash)
    expect(processData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash mocking subprocess hash
    const subProcessHash= Utils.hexToBase64(crypto.random(16))
    // Starts subprocess giving process hash
    await blockchain.startSubprocess(did, subProcessHash, processHash)
    // Assert data is correctly written
    const subProcessData = await blockchain.getProcessNode(subProcessHash)
    expect(subProcessData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash mocking first step hash
    const firstStepHash= Utils.hexToBase64(crypto.random(16))
    // Starts step giving on subprocess hash
    await blockchain.startStep(did, firstStepHash, subProcessHash)
    // Assert data is correctly written
    const firstStepData = await blockchain.getProcessNode(firstStepHash)
    expect(firstStepData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash mocking second step hash
    const secondStepHash= Utils.hexToBase64(crypto.random(16))
    // Starts step giving on the same subprocess hash
    await blockchain.startStep(did, secondStepHash, subProcessHash)
    // Assert data is correctly written
    const secondStepData = await blockchain.getProcessNode(secondStepHash)
    expect(secondStepData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash for a document and link to process
    const processDocumentHash= Utils.hexToBase64(crypto.random(16))
    // Link document to process
    await blockchain.addDocument(did, processDocumentHash, processHash)
    // Assert data is correctly written
    const processDocumentData = await blockchain.getProcessNode(processDocumentHash)
    expect(processDocumentData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash for a document and link to subprocess
    const subProcessDocumentHash= Utils.hexToBase64(crypto.random(16))
    // Link document to process
    await blockchain.addDocument(did, subProcessDocumentHash, subProcessHash)
    // Assert data is correctly written
    const subProcessDocumentData = await blockchain.getProcessNode(subProcessDocumentHash)
    expect(subProcessDocumentData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash for a document and link to first step
    const firstStepDocumentHash= Utils.hexToBase64(crypto.random(16))
    // Link document to first step
    await blockchain.addDocument(did, firstStepDocumentHash, firstStepHash)
    // Assert data is correctly written
    const firstStepDocumentData = await blockchain.getProcessNode(firstStepDocumentHash)
    expect(firstStepDocumentData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash for a document and link to second step
    const secondStepDocumentHash= Utils.hexToBase64(crypto.random(16))
    // Link document to second step
    await blockchain.addDocument(did, secondStepDocumentHash, secondStepHash)
    // Assert data is correctly written
    const secondStepDocumentData = await blockchain.getProcessNode(secondStepDocumentHash)
    expect(secondStepDocumentData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))
    // Obtain a random hash for a document attachment and link to document on the second step
    const attachmentToSecondStepDocumentHash= Utils.hexToBase64(crypto.random(16))
    // Link document to second step
    await blockchain.addAttachment(did, attachmentToSecondStepDocumentHash, secondStepDocumentHash)
    // Assert data is correctly written
    const attachmentToSecondStepDocumentData = await blockchain.getProcessNode(attachmentToSecondStepDocumentHash)
    expect(attachmentToSecondStepDocumentData.did.toString().split('x')[1]).to.eql(Utils.base64ToHex(did))

    // Obtain path to Attachment
    const pathToAttachment = await blockchain.pathTo(attachmentToSecondStepDocumentHash)
    console.log(util.inspect(pathToAttachment, {showHidden: false, depth: null}))

    // Obtain path to first step document
    const pathToDocument = await blockchain.pathTo(firstStepDocumentHash)
    console.log(util.inspect(pathToDocument, {showHidden: false, depth: null}))

    // Obtain degenrate path to process root
    const pathToProcessRoot = await blockchain.pathTo(processHash)
    console.log(util.inspect(pathToProcessRoot, {showHidden: false, depth: null}))

    // Giving any node (in that case the document of the second step) 
    // Obtain the full process tree
    const fullProcessTree = await blockchain.getFullProcessTree(secondStepDocumentHash)
    console.log(util.inspect(fullProcessTree, {showHidden: false, depth: null}))
  })

  it.skip('Should Create a new token, mint and transfer', async () => {
    // set account keyring
    const alice = blockchain.setKeyring(GENESIS_SEED_FROM)
    // Create token. Set Alice as Admin 
    let id = 0
    'Caelum'.split('').forEach(val => id += parseInt(val.charCodeAt()))
    // 
    const result = await blockchain.createNewToken(id, alice, 100)
    // Mint 1MM tokens to Alice account
//    await blockchain.mintToken (id, aliceAddr, 1000000)
// zeldaAddress
  })

  it('should clean up after itself', () => {
    blockchain.disconnect()
    expect(blockchain).to.not.be.undefined;
  })
})