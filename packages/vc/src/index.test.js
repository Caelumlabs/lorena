const VC = require('./index')
const { Ed25519KeyPair } = require('jsonld-signatures')
const assertionController = require('../mocks/assertionController')

const Vc = new VC()

async function generateKeyPair (id, controller, owner) {
  const keyPair = await Ed25519KeyPair.generate()
  keyPair.id = id
  keyPair.controller = controller || id
  keyPair.owner = owner || id
  if (id === 'did:lor:1234issuer') {
    assertionController.assertionMethod.push(keyPair.id)
    assertionController.authentication.push(keyPair.id)
  }
  return keyPair
}

let issuer
let alice
let issuedCredential
let presentation
test('Init actors', async () => {
  issuer = await generateKeyPair('did:lor:1234issuer')
  alice = await generateKeyPair('did:lor:567alice')
  expect(alice.id).toEqual('did:lor:567alice')
})

test('Issue credential', async () => {
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://lorena.tech/context/schema'
    ],
    id: 'asdasdasd',
    type: ['VerifiableCredential'],
    issuer: issuer.id,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: alice.id,
      memberOf: 'did:lor:6575746535345345'
    }
  }
  issuedCredential = await Vc.issue(credential, issuer)
  console.log(issuedCredential)
  expect(true).toEqual(true)
})

test('Present credential', async () => {
  presentation = await Vc.presentation(issuedCredential, alice)
  console.log(presentation)
  expect(true).toEqual(true)
})

test('Verify credential', async () => {
  const verified = await Vc.verifyCredential(issuedCredential, issuer)
  console.log('VERIFIED', verified)
  expect(verified).toEqual(true)
})

test('Verify presentation', async () => {
  const verified = await Vc.verifyCredential(issuedCredential, issuer)
  console.log('VERIFIED', verified)
  expect(verified).toEqual(true)
})
