/* eslint-disable jest/no-disabled-tests */
'use strict'
const chai = require('chai')
const util = require('util')
const { bufferToU8a, stringToU8a, u8aConcat, u8aToHex, hexToU8a, hexToString, stringToHex } = require('@polkadot/util')

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
  // const blockchain = new BlockchainSubstrate('wss://labdev.substrate.lorena.tech')
  // Uncomment for testing in local blockchain and comment out the line before
  // to restore testing on cloud
  const blockchain = new BlockchainSubstrate('ws://localhost:9944')
  let did, did2, did3
  let aliceAddr, tempWallet, tempWallet2, tempWallet3, tempWallet4
  let cid1, cid2, cid3
  let tokenid
  const diddocHash = 'bafyreiecd7bahhf6ohlzg5wu4eshn655kqhgaguurupwtbnantf54kloem'
  const storageAddress = 'bafyreiecd7bahhf6ohlzg5wu4eshn655kqhgaguurupwtbnantf54kloem'
  const credential = 'bafyreiecd7bahhf6ohlzg5wu4eshn655kqhgaguurupwtbnantf54kloem'
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
    expect(aliceAddr).equal('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
    const zeldaKey = blockchain.getKeyring(zeldaMnemonic)
    expect(zeldaKey).to.not.be.undefined;
    tempWallet = crypto.keyPair()
    tempWallet2 = crypto.keyPair()
    tempWallet3 = crypto.keyPair()
    tempWallet4 = crypto.keyPair()

    tokenid = 0
  })

  it('should have good format conversion', () => {
    const base64 = 'Wldvd1pqVmZWbEoxYVdaWFdGOW5ja05I'
    const hex = '576c647664317071566d5a5762456f7859566461574664474f57356a61303549'
    const hexed = Utils.base64ToHex(base64)
    const based = Utils.hexToBase64(hex)
    expect(hexed).equal(hex);
    expect(based).equal(base64);
  })

  it('should Connect', async () => {
    await blockchain.connect()
    expect(blockchain).not.be.undefined;
  })

  it('Should send Tokens from Alice to tempWallet', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokens(tempWallet.address, 3000000000000000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.equal(amount2);
  })

  it('Should send Tokens from Alice to Zelda', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokens(blockchain.getAddress(zeldaMnemonic), 3000000000000000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.equal(amount2)
  })

  it('Should send Tokens from Alice to tempWallet without paying fee', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokensNoFees(tempWallet.address, 3000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.equal(amount2)
  })

  it('Should send Tokens from Alice to tempWallet2 without paying fee', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokensNoFees(tempWallet2.address, 3000000000000000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.equal(amount2)
  })

  it('Should send Tokens from Alice to tempWallet3 and tempWallet4 without paying fee', async () => {
    const amount1 = await blockchain.addrState(aliceAddr)
    await blockchain.transferTokensNoFees(tempWallet3.address, 30000000)
    const amount2 = await blockchain.addrState(aliceAddr)
    expect(amount1).not.equal(amount2)
    await blockchain.transferTokensNoFees(tempWallet4.address, 3000000000000000)
    const amount3 = await blockchain.addrState(aliceAddr)
    expect(amount2).not.equal(amount3)
  })

  it('Should Create a new token, mint and transfer', async () => {
    // set account keyring
    const alice = blockchain.setKeyring(GENESIS_SEED_FROM)
    // Create token. Set Alice as Admin 
    // Token name is a trick for demo. Can be any number u32
    'Caelum'.split('').forEach(val => tokenid += parseInt(val.charCodeAt()))
    // Create a new token
    let result = await blockchain.createToken(tokenid, alice, 100)
    expect(result).equal(true)
    // Get the token details so far
    let tokenDetails = await blockchain.getTokenDetails(tokenid)
    expect(tokenDetails.owner).eql(alice)
    // Set Token metadata that identifies it
    result = await blockchain.setTokenMetadata(tokenid, 'Caelum', 'Caeli', 0)
    expect(result).equal(true)
    // Get the token metadata
    const tokenMetadata = await blockchain.getTokenMetadata(tokenid)
    // Mint 1MM tokens to Alice account
    result = await blockchain.mintToken(tokenid, aliceAddr, 1000000)
    expect(result).equal(true)
    tokenDetails = await blockchain.getTokenDetails(tokenid)
    expect(tokenDetails.supply).eql(1000000)
    // Transfer 1000 from Alice to tempWallet
    result = await blockchain.transferToken(tokenid, tempWallet3.address, 1000)
    expect(result).equal(true)
    // Get the account token data
    const tokenAccountData = await blockchain.getAccountTokenData(tokenid, tempWallet3.address)
    expect(tokenAccountData.balance).eql(1000)
  })

  it('Should Save a DID to Blockchain', async () => {
    // Result should equal to true => No errors
    const result = await blockchain.registerDid(tempWallet.address, 2000, 2, 'Legal Name', 'Tax Id')
    expect(result).equal(true)

    // Promoter Account from even data should be address Alice
    const registeredDidEvent = await blockchain.wait4Event('DidRegistered')
    expect(registeredDidEvent[1]).equal(aliceAddr)

    // DID Owner should be the address of tempWallet
    const didDataJson = await blockchain.getDidData(registeredDidEvent[0])
    expect(didDataJson.owner).equal(tempWallet.address)

    // DID promoter should belong to Alice
    const promoter = await blockchain.getOwnerFromDid(didDataJson.did_promoter)
    expect(promoter.toString()).equal(aliceAddr)
  })

  it('Should try again to register the same DID and fail', async () => {
    const result = await blockchain.registerDid(tempWallet.address, 2000, 2, 'Legal Name', 'Tax Id')
    expect(result).equal(false)
  })

  it('Should Save a DID to Blockchain with level 11 (1-1999) Organization account', async () => {
    // Result should equal to true => No errors
    const result = await blockchain.registerDid(tempWallet2.address, 11, 1, 'Legal name 2', 'Tax Id 2')
    expect(result).equal(true)

    // Promoter Account from even data should be address Alice
    const registeredDidEvent = await blockchain.wait4Event('DidRegistered')
    expect(registeredDidEvent[1]).equal(aliceAddr)

    // DID Owner should be the address of tempWallet
    const didDataJson = await blockchain.getDidData(registeredDidEvent[0])
    expect(didDataJson.owner).equal(tempWallet2.address)

    // DID promoter should belong to Alice
    const promoter = await blockchain.getOwnerFromDid(didDataJson.did_promoter)
    expect(promoter.toString()).equal(aliceAddr)
  })

  it('Should save a DID to the Blockchain with level 5000 (2000 ->) using Organization account', async () => {
    blockchain.setKeyring(tempWallet2.mnemonic)
    // Result should equal to true => No errors
    const result = await blockchain.registerDid(tempWallet3.address, 5000, 3, 'Legal name 3', 'Tax id 3')
    expect(result).equal(true)

    // Promoter Account from even data should be address tempWallet2
    const registeredDidEvent = await blockchain.wait4Event('DidRegistered')
    expect(registeredDidEvent[1]).equal(tempWallet2.address)

    // DID Owner should be the address of tempWallet3
    const didDataJson = await blockchain.getDidData(registeredDidEvent[0])
    expect(didDataJson.owner).equal(tempWallet3.address)

    // DID promoter should belong to tempWallet2
    const promoter = await blockchain.getOwnerFromDid(didDataJson.did_promoter)
    expect(promoter.toString()).equal(tempWallet2.address)
  })

  it('Should change Legal Name and Tax Id', async () => {
    blockchain.setKeyring(tempWallet2.mnemonic)
    // Get the DID for tempWallet3
    const tempWalletDid3 = await blockchain.getDidFromOwner(tempWallet3.address)

    // Change only Legal Name
    let result = await blockchain.changeLegalNameOrTaxId(tempWalletDid3, 'New Legal Name for DID3', null)
    expect(result).equal(true)
    let didData = await blockchain.getDidData(tempWalletDid3)
    expect(hexToString(didData.legal_name)).equal('New Legal Name for DID3')
    // Change only tax id
    result = await blockchain.changeLegalNameOrTaxId(tempWalletDid3, null, 'New Tax ID for DID3')
    expect(result).equal(true)
    didData = await blockchain.getDidData(tempWalletDid3)
    expect(hexToString(didData.tax_id)).equal('New Tax ID for DID3')
    // Change both 
    result = await blockchain.changeLegalNameOrTaxId(tempWalletDid3, 'New change of Legal Name for DID3', 'New change of Tax ID for DID3')
    expect(result).equal(true)
    didData = await blockchain.getDidData(tempWalletDid3)
    expect(hexToString(didData.legal_name)).equal('New change of Legal Name for DID3')
    expect(hexToString(didData.tax_id)).equal('New change of Tax ID for DID3')
  })

  it('Should change Info data', async () => {
    blockchain.setKeyring(tempWallet2.mnemonic)
    // Get the DID for tempWallet3
    const tempWalletDid2 = await blockchain.getDidFromOwner(tempWallet2.address)

    // Change only Name
    let result = await blockchain.changeInfo(tempWalletDid2, 'New Name', null, null, null, null, null, null, null)
    expect(result).equal(true)
    let didData = await blockchain.getDidData(tempWalletDid2)
    expect(hexToString(didData.info.name)).equal('New Name')
  })

  // Disabled: substrate library now enforces uniqueness of diddocHash
  it.skip('Register a Did Document', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    // Get the DID for tempWallet
    const tempWalletDid = await blockchain.getDidFromOwner()
    let result = await blockchain.registerDidDocument(tempWalletDid, diddocHash)
    expect(result).equal(true)
    const didData = await blockchain.getDidData(tempWalletDid)
    expect(didData.did_doc).eql(u8aToHex(diddocHash))
    const registeredDocumentEvent = await blockchain.wait4Event('DidDocumentRegistered')
    // DID Document of event should be equal to entered
    expect(registeredDocumentEvent[2]).eql(u8aToHex(diddocHash))
    // DID Document of DIDData record should be equal to entered
    result = u8aToHex(await blockchain.getDidDocHash(tempWalletDid))
    if (result !== '') {
      expect(result).eql(u8aToHex(diddocHash))
    } else {
      console.log('Did Document empty')
    }
  })

  it('Register a Storage Address', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    // Get the DID for tempWallet
    const tempWalletDid = await blockchain.getDidFromOwner()
    let result = await blockchain.setStorageAddress(tempWalletDid, storageAddress)
    expect(result).equal(true)
    const didData = await blockchain.getDidData(tempWalletDid)
    expect(didData.did_doc).eql(u8aToHex(storageAddress))
    const registeredStorageAddress = await blockchain.wait4Event('DidDocumentRegistered')
    // DID Document of event should be equal to entered
    expect(registeredStorageAddress[2]).eql(u8aToHex(storageAddress))
    // DID Document of DIDData record should be equal to entered
    result = u8aToHex(await blockchain.getDidDocHash(tempWalletDid))
    if (result !== '') {
      expect(result).eql(u8aToHex(storageAddress))
    } else {
      console.log('Did Document empty')
    }
  })

  it('Should Rotate a Key', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    const newKeyPair = await crypto.keyPair()
    const newPubKey = newKeyPair.box.publicKey
    // Get the DID for tempWallet
    const tempWalletDid = await blockchain.getDidFromOwner()
    await blockchain.rotateKey(tempWalletDid, newPubKey)
    const registeredRotateKeyEvent = await blockchain.wait4Event('KeyRotated')
    // DID Document of event should be equal to entered
    expect(registeredRotateKeyEvent[2].split('x')[1]).equal(Utils.base64ToHex(newPubKey))

    const key = await blockchain.getActualDidKey(tempWalletDid)
    expect(key).eql(newPubKey)
  })

  it('Should add a CID to Blockchain', async () => {
    // Result should equal to true => No errors
    const cid = crypto.random(16)
    // Vec<u8> parameters must be entered as hex strings (e.g.: format 0xab67c8ff...)
    const result = await blockchain.addCid(stringToHex(cid))
    expect(result).equal(true)

    // Promoter Account from even data should be address of tempwallet
    const registeredCidEvent = await blockchain.wait4Event('CIDCreated')
    expect(registeredCidEvent[1]).equal(tempWallet.address)

    // DID must be DID of the Owner because has not been provided
    const didPromoter = await blockchain.getDidFromOwner(tempWallet.address)
    expect(registeredCidEvent[2]).equal(didPromoter.toString())
  })

  it('Should add three new CIDs to Blockchain', async () => {
    // Result should equal to true => No errors
    // Vec<u8> parameters must be entered as hex strings (e.g.: format 0xab67c8ff...)
    const result1 = await blockchain.addCid(stringToHex(cid1))
    const result2 = await blockchain.addCid(stringToHex(cid2))
    const result3 = await blockchain.addCid(stringToHex(cid3))
    expect(result1).equal(true)
    expect(result2).equal(true)
    expect(result3).equal(true)
  })

  it('Should read all CIDs of a DID', async () => {
    const didPromoter = await blockchain.getDidFromOwner(tempWallet.address)
    const result = await blockchain.getCIDsByDID(didPromoter)
    expect(tempWallet.address).to.be.not.undefined
  })

  it('Should delete a CID into Blockchain', async () => {
    // Result should equal to true => No errors
    const result = await blockchain.deleteCid(stringToHex(cid3))
    expect(result).equal(true)

    // Promoter Account from even data should be address of tempwallet
    const registeredCidEvent = await blockchain.wait4Event('CIDDeleted')
    expect(registeredCidEvent[1]).equal(tempWallet.address)

    // DID must be DID of the Owner
    const didPromoter = await blockchain.getDidFromOwner(tempWallet.address)
    expect(registeredCidEvent[2]).equal(didPromoter.toString())
    // See result
    const res = await blockchain.getCIDsByDID(didPromoter)
  })

  // The following tests will pass just once if the blockchain is
  // not reinitialized. That's because a credential assigned
  // is not deleted but marked as deleted and can not
  // be reassigned
  it.skip('Should Assign a Credential', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    // Get the DID for tempWallet
    const tempWalletDid = await blockchain.getDidFromOwner()
    await blockchain.assignCredential(tempWalletDid, credential)
    const registeredCredentialAssignedEvent = await blockchain.wait4Event('CredentialAssigned')
    // Credential of event should be equal to entered
    expect(registeredCredentialAssignedEvent[2]).equal(stringToHex(credential))
  })

  it.skip('Should Remove a Credential', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    // Get the DID for tempWallet
    const tempWalletDid = await blockchain.getDidFromOwner()
    await blockchain.removeCredential(tempWalletDid, credential)
    const registeredCredentialRemovedEvent = await blockchain.wait4Event('CredentialRemoved')
    // Credential of event should be equal to entered
    expect(registeredCredentialRemovedEvent[2]).equal(stringToHex(credential))
  })

  it.skip('Trying to Change Owner not being the owner. Should fail', async () => {
    // Create a new accopunt without DID assigned
    const tempWallet4 = crypto.keyPair()
    blockchain.setKeyring(tempWallet2.mnemonic)
    // Get the DID for tempWallet
    const tempWalletDid = await blockchain.getDidFromOwner(tempWallet.address)
    const result = await blockchain.changeOwner(tempWalletDid, tempWallet4.address)
    // Result should equal to false => error
    expect(result).equal(false)
  })

  it.skip('Should Change Owner', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    // Get the DID for tempWallet
    const tempWalletDid = await blockchain.getDidFromOwner()
    await blockchain.changeOwner(tempWalletDid, tempWallet4.address)
    const registeredNewOwnerEvent = await blockchain.wait4Event('NewOwner')
    // New owner of event should be equal to entered
    expect(registeredNewOwnerEvent[2]).equal(tempWallet4.address)
  })

  it.skip('Try to remove DID not being the owner. Should fail', async () => {
    blockchain.setKeyring(tempWallet3.mnemonic)
    // Get the DID for tempWallet4
    const tempWallet4Did = await blockchain.getDidFromOwner(tempWallet4.address)
    const result = await blockchain.removeDid(tempWallet4Did)
    // Result should equal to false => error
    expect(result).equal(false)
  })

  it.skip('Should Remove DID', async () => {
    blockchain.setKeyring(tempWallet.mnemonic)
    // Get the DID for tempWallet4
    const tempWalletDid = await blockchain.getDidFromOwner(tempWallet.address)
    await blockchain.removeDid(tempWalletDid)
    const subs = await blockchain.wait4Event('DidRemoved')
    const didRemovedEvent = JSON.parse(subs)
    console.log('SUBS -> %O', subs)

    // New owner of event should be equal to entered
    expect(Utils.hexToBase64(didRemovedEvent[1].split('x')[1])).equal(Utils.base64ToHex(did))
  })

  it.skip('Should sweep tokens from Zelda to Alice', async () => {
    const zeldaAddress = blockchain.getAddress(zeldaMnemonic)
    blockchain.setKeyring(zeldaMnemonic)
    const zeldaBalance1 = await blockchain.addrState(zeldaAddress)
    await blockchain.transferAllTokens(blockchain.getAddress('//Alice'))
    const zeldaBalance2 = await blockchain.addrState(zeldaAddress)
    expect(zeldaBalance2).not.equal(zeldaBalance1)
  })

  it.skip('Creates a new process and get some paths', async () => {
    // Sets the keyring (so account address)
    const alice = blockchain.setKeyring(GENESIS_SEED_FROM)
    // Get DID for this account
    const did = await blockchain.getDidFromOwner(alice)
    // Set the token and cost for processes
    // This can be done solely by root that in this case is Alice
    await blockchain.setTokenAndCostForProcess(tokenid, 30)
    const tc = await blockchain.getTokenIdAndCostProcessData()
    // Get the account token data
    let tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    let AliceOldBalance = tokenAccountData.balance
 
    // Obtain a random hash mocking process hash
    const processHash = Utils.hexToBase64(crypto.random(16))
    // Starts process giving process hash
    await blockchain.startProcess(did, processHash)
    // Assert data is correctly written
    const processData = await blockchain.getProcessNode(processHash)
    expect(u8aToHex(processData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    let AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash mocking subprocess hash
    const subProcessHash = Utils.hexToBase64(crypto.random(16))
    // Starts subprocess giving process hash
    await blockchain.startSubprocess(did, subProcessHash, processHash)
    // Assert data is correctly written
    const subProcessData = await blockchain.getProcessNode(subProcessHash)
    expect(u8aToHex(subProcessData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash mocking first step hash
    const firstStepHash = Utils.hexToBase64(crypto.random(16))
    // Starts step giving on subprocess hash
    await blockchain.startStep(did, firstStepHash, subProcessHash)
    // Assert data is correctly written
    const firstStepData = await blockchain.getProcessNode(firstStepHash)
    expect(u8aToHex(firstStepData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash mocking second step hash
    const secondStepHash = Utils.hexToBase64(crypto.random(16))
    // Starts step giving on the same subprocess hash
    await blockchain.startStep(did, secondStepHash, subProcessHash)
    // Assert data is correctly written
    const secondStepData = await blockchain.getProcessNode(secondStepHash)
    expect(u8aToHex(secondStepData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash for a document and link to process
    const processDocumentHash = Utils.hexToBase64(crypto.random(16))
    // Link document to process
    await blockchain.addDocument(did, processDocumentHash, processHash)
    // Assert data is correctly written
    const processDocumentData = await blockchain.getProcessNode(processDocumentHash)
    expect(u8aToHex(processDocumentData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash for a document and link to subprocess
    const subProcessDocumentHash = Utils.hexToBase64(crypto.random(16))
    // Link document to process
    await blockchain.addDocument(did, subProcessDocumentHash, subProcessHash)
    // Assert data is correctly written
    const subProcessDocumentData = await blockchain.getProcessNode(subProcessDocumentHash)
    expect(u8aToHex(subProcessDocumentData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash for a document and link to first step
    const firstStepDocumentHash= Utils.hexToBase64(crypto.random(16))
    // Link document to first step
    await blockchain.addDocument(did, firstStepDocumentHash, firstStepHash)
    // Assert data is correctly written
    const firstStepDocumentData = await blockchain.getProcessNode(firstStepDocumentHash)
    expect(u8aToHex(firstStepDocumentData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash for a document and link to second step
    const secondStepDocumentHash = Utils.hexToBase64(crypto.random(16))
    // Link document to second step
    await blockchain.addDocument(did, secondStepDocumentHash, secondStepHash)
    // Assert data is correctly written
    const secondStepDocumentData = await blockchain.getProcessNode(secondStepDocumentHash)
    expect(u8aToHex(secondStepDocumentData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

    // Obtain a random hash for a document attachment and link to document on the second step
    const attachmentToSecondStepDocumentHash = Utils.hexToBase64(crypto.random(16))
    // Link document to second step
    await blockchain.addAttachment(did, attachmentToSecondStepDocumentHash, secondStepDocumentHash)
    // Assert data is correctly written
    const attachmentToSecondStepDocumentData = await blockchain.getProcessNode(attachmentToSecondStepDocumentHash)
    expect(u8aToHex(attachmentToSecondStepDocumentData.did)).eql(did)
    // Get the account token data
    tokenAccountData = await blockchain.getAccountTokenData(tokenid, alice)
    // Keep the old balance
    AliceNewBalance = tokenAccountData.balance
    expect(AliceOldBalance - AliceNewBalance).eql(30)
    AliceOldBalance = AliceNewBalance

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
    let fullProcessTree = await blockchain.getFullProcessTree(secondStepDocumentHash)
    console.log(util.inspect(fullProcessTree, { showHidden: false, depth: null }))

    // Revoke from second step
    await blockchain.revoke(secondStepHash)

    // Obtain again the full process tree to check for revoked
    // Remember that the full process tree can be obtained from any
    // member of the process tree (in our case secondStepDocumentHash)
    fullProcessTree = await blockchain.getFullProcessTree(secondStepDocumentHash)
    console.log(util.inspect(fullProcessTree, {showHidden: false, depth: null}))

    // Now revoke the whole process
    await blockchain.revoke(processHash)

    // And obtain again the full process tree to check for revoked
    fullProcessTree = await blockchain.getFullProcessTree(processHash)
    console.log(util.inspect(fullProcessTree, {showHidden: false, depth: null}))
  })

  it.skip('Creates some NFTs classes and instances and transfer ownership', async () => {
    // Sets the keyring (so account address)
    const alice = blockchain.setKeyring(GENESIS_SEED_FROM)
    // Get DID for this account
    const did = await blockchain.getDidFromOwner(alice)
    // Create random number for a class
    const classid = crypto.random(16)
    console.log('classid ', classid)
    // Creates an NFT Class 
    await blockchain.createNFTClass (classid, alice)
    // Obtains result data
    const nftClassDetails = await blockchain.getNFTClassDetails()
    console.log('nftClassDetails ', nftClassDetails)
  })

  it('should clean up after itself', () => {
    blockchain.disconnect()
    expect(blockchain).to.not.be.undefined
  })
})