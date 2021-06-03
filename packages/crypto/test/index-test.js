'use strict'
const fs = require('fs')
const path = require('path')
const LorenaCrypto = require('../src/index')
const crypto = new LorenaCrypto()
const chai = require('chai')

// Configure chai
// chai.should()
const expect = chai.expect

describe('Test CaelumLabs Crypto Utilities', function () {
  let alice
  let rnd = false
  const message = 'Hello World'
  const password = 'password random'

  before(async () => {
    await crypto.init()
    expect(crypto).to.not.be.undefined;
  })

  it('KeyPair generation', async () => {
    alice = crypto.keyPair()
    expect(alice.mnemonic).to.not.be.undefined;
    const mnemonicArray = alice.mnemonic.split(' ')
    expect(mnemonicArray).to.have.lengthOf(12);
    expect(alice.publicKey).to.not.be.undefined;
    expect(alice.publicKey).to.have.lengthOf(66);
    expect(alice.address).to.not.be.undefined;
    expect(alice.address).to.have.lengthOf(48);
    expect(alice.box).to.not.be.undefined;
    expect(alice.box.publicKey).to.not.be.undefined;
    expect(alice.box.secretKey).to.not.be.undefined;
  })

  it('Base58 Encode/decode', async () => {
    const pubKey = crypto.u8aToBase58(alice.box.publicKey)
    expect(pubKey).to.not.be.undefined;
    expect(alice.box.publicKey).to.eql(crypto.base58ToU8a(pubKey))
  })

  it('KeyPair generation from mnemonic', async () => {
    const alice2 = crypto.keyPair(alice.mnemonic)
    expect(alice.mnemonic).to.not.be.undefined;
    expect(alice.pubKey).to.eql(alice2.pubKey)
  })

  it('Should hash a String: ', () => {
    const result = crypto.blake2('Hello world')
    expect(result).to.not.be.undefined;

    const result1 = crypto.hash('Hello world')
    expect(result1).to.not.be.undefined;
    expect(result1).to.eql('0xa21cf4b3604cf4b2bc53e6f88f6a4d75ef5ff4ab415f3e99aea6b61c8249c4d0')

    const result2 = crypto.hash({ test: 'Hello world' })
    expect(result2).to.not.be.undefined;
    expect(result2).to.eql('0x9ebc09154518985254db0d83558368bbf6144e7caf8c1c05bbae250a44342573')

    const result3 = crypto.hash({ test: 'Hello world', id: 2 })
    expect(result3).to.not.be.undefined;
  })

  it('Should create a random String', () => {
    rnd = crypto.random()
    expect(rnd).to.not.be.undefined;
    expect(rnd).to.have.lengthOf(32);
    rnd = crypto.random(16)
    expect(rnd).to.have.lengthOf(16);
    rnd = crypto.random(8)
    expect(rnd).to.have.lengthOf(8);
  })

  it('Should create a random PIN', () => {
    rnd = crypto.randomPin()
    expect(rnd).to.not.be.undefined;
    expect(rnd).to.have.lengthOf(6);
    rnd = crypto.randomPin(4)
    expect(rnd).to.have.lengthOf(4);
  })

  it('Should create a new Signature: ', async () => {
    const signature = crypto.signMessage(message, alice.keyPair)
    expect(signature).to.not.be.undefined;
    const check = crypto.checkSignature(message, signature, alice.address)
    expect(check).to.eql(true)
  })

  // Encryption.
  it('Should encrypt & decrypt a message', () => {
    const msgEncrypted = crypto.encrypt(password, message)
    expect(msgEncrypted.encrypted).to.not.be.undefined;
    expect(msgEncrypted.nonce).to.not.be.undefined;
    const msg = crypto.decrypt(password, msgEncrypted)
    expect(msg).to.eql(message)
  })

  // Encryption.
  it('Should encrypt & decrypt a buffer', () => {
    const buffer = fs.readFileSync(path.resolve(__dirname, '../Dramatic-Prairie-Dog.gif'))
    const msgEncrypted = crypto.encryptBuffer(password, buffer)
    expect(msgEncrypted.encrypted).to.not.be.undefined;
    expect(msgEncrypted.nonce).to.not.be.undefined;
    const msg = crypto.decryptBuffer(password, msgEncrypted)
    expect(msg).to.eql(buffer)
  })

  // Encryption.
  it('Should encrypt & decrypt an object', () => {
    const msgEncrypted = crypto.encryptObj(password, { msg: message, test: 'áà # test' })
    const testMessage = JSON.parse(msgEncrypted)
    expect(testMessage.e).to.not.be.undefined;
    expect(testMessage.n).to.not.be.undefined;

    const result = crypto.decryptObj(password, msgEncrypted)
    expect(result.msg).to.eql(message)
    expect(result.test).to.eql('áà # test')
  })

  it('nacl encryption', () => {
    const receiver = crypto.keyPair()
    const msgEncrypted = crypto.box(message, alice.box.secretKey, receiver.box.publicKey)
    const msg = crypto.unbox(msgEncrypted, alice.box.publicKey, receiver.box.secretKey)
    expect(msg).to.eql(message)
    const objEncrypted = crypto.boxObj({ msg: message }, alice.box.secretKey, receiver.box.publicKey)
    const obj = crypto.unboxObj(objEncrypted, alice.box.publicKey, receiver.box.secretKey)
    expect(obj).to.eql({ msg: message })
  })
})