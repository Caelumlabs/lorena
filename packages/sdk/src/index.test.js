const Lorena = require('./index')
const Wallet = require('@caelumlabs/wallet')
const fsPromises = require('fs').promises
const path = require('path')

let lorena, wallet
const password = 'test'

test('should prepare the wallet', async () => {
  wallet = new Wallet('lorena-sdk-test')
  await wallet.delete()
  const result = await wallet.unlock(password)
  expect(result).toBe(false)
  await wallet.lock(password)
})

test('should construct a Lorena class', async () => {
  lorena = new Lorena(wallet)
  expect(lorena).not.toBeUndefined()
})

test('should construct a Lorena class with debug', async () => {
  lorena = new Lorena(wallet, { debug: true, silent: true })
  expect(lorena).not.toBeUndefined()
})

test('getLinkId passing a RoomID', () => {
  const roomId = '!bXwVAPtFvrDcauxIna:labtest.matrix.lorena.tech'
  const result = lorena.getLinkId(roomId)
  expect(result).toBeUndefined()
  // this is success because wallet doesn't have this link and no throw
})

test('getLinkId passing a LinkID', () => {
  const linkId = '123e4567-e89b-12d3-a456-426614174000'
  const result = lorena.getLinkId(linkId)
  expect(result).toBe(linkId)
})

test('getLinkId passing an invalid format ID', () => {
  expect(() => {
    lorena.getLinkId('!^&***badJab')
  }).toThrow(Error)
})

test('getLinkId passing an undefined', () => {
  expect(() => {
    lorena.getLinkId(undefined)
  }).toThrow(Error)
})

test('use an old legacy wallet and upgrade it', async () => {
  // Load example wallet Json
  const data = await fsPromises.readFile(path.join(__dirname, './__fixtures__/exampleWallet.json'), 'utf-8')
  const walletObject = JSON.parse(data)
  const username = Object.keys(walletObject)[0]
  const zPassword = 'zeevee'
  const exampleWallet = new Wallet(username)
  await exampleWallet.write('info', walletObject[username].info)
  await exampleWallet.write('data', walletObject[username].data)

  // Create a Test Wallet
  const mockLorena = new Lorena(exampleWallet)

  // Create one link Item to add to links array
  const link = {
    roomId: 'roomId',
    alias: '',
    did: '',
    matrixUser: 'element.sender',
    status: 'incoming'
  }

  expect(mockLorena.wallet.data.links[0]).toBeUndefined()
  mockLorena.wallet.add('links', link)
  expect(mockLorena.wallet.data.links[0].linkId).toBeUndefined()

  // Unlock Wallet
  await mockLorena.unlock(zPassword)
  // valid guid
  expect(mockLorena.wallet.data.links[0].linkId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  mockLorena.disconnect()
})

test('should not init wallet for an invalid network', async () => {
  await expect(lorena.initWallet('xxx')).rejects.toThrow()
})

test('should init wallet for a valid network', async () => {
  const result = await lorena.initWallet('labdev')
  expect(result.matrixServer).toMatch(/labdev/)
})

test('should connect', async () => {
  const result = await lorena.connect()
  expect(result).toBe(true)
})

test('should unlock wallet', done => { // eslint-disable-line jest/no-test-callback
  lorena.on('unlocked', () => {
    expect(true).toBe(true)
    done()
  })
  lorena.unlock(password)
})

test('should lock wallet', done => { // eslint-disable-line jest/no-test-callback
  lorena.on('locked', () => {
    expect(true).toBe(true)
    done()
  })
  lorena.lock(password)
})

test('should close connections', () => {
  lorena.disconnect()
  expect(true).toBe(true)
})

test.skip('should verify a Credential', done => { // eslint-disable-line jest/no-test-callback
  const lorenaSessionless = new Lorena()
  const json = '{"@context":["https://www.w3.org/2018/credentials/v1"],"type":["VerifiableCredential","Achievement"],"issuer":"did:lor:labtest:TjFkVWNrbFFjMmRDUVhsYU9YWlZVbTA1","issuanceDate":"2020-05-21T14:59:00.690Z","credentialSubject":{"@type":"Achievement","id":"did:lor:labtest:bafyreicnpref2qytclwsopuxc2huuf4q2vxjryj2oavnckvv3orpqkuvvq;id:1","course":{"id":"did:lor:labtest:bafyreicnpref2qytclwsopuxc2huuf4q2vxjryj2oavnckvv3orpqkuvvq"},"agent":{"@type":"Person","id":"","name":"diego torres","email":"diego@caelumlabs.com"},"expirationDate":""},"proof":{"type":"Curve448-Goldilocks","proofPurpose":"assertionMethod","verificationMethod":"","signature":{"did:lor:labtest:TjFkVWNrbFFjMmRDUVhsYU9YWlZVbTA1":{"draft":"dW5kZWZpbmVk","signature":{"r":"ExOo2egwpPWgoqwgexjaRDnlgqoZS3Doy_HPZsBTuBd_hQOvjrNVZuUBdSz14KU8YxAp8Upx5fY","s":"BOJSSU25bO8MK4pOT-Lfh_CYQ0F72VF24mLWrqnn0ci_YXPm3_fyp9H8e2dAl4Eee04PK4mQ5Jg"}}}}}'
  lorenaSessionless.verifyCredential(json)
    .then((res) => {
      expect(typeof res).toBe('object')
      expect(typeof res.verified).toBe('object')
      expect(res.success).toBe(true)
      expect(res.verified.network).toBe('labtest')
      expect(typeof res.verified).toBe('object')
      expect(typeof res.verified.certificate.credentialSubject.agent.name).toBe('string')

      lorenaSessionless.disconnect()
      done()
    })
})
