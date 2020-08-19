const VC = require('./index')
const { Ed25519KeyPair } = require('jsonld-signatures')
const assertionController = require('../mocks/assertionController')

const testLoader = async url => {
  if (url === 'https://example.edu/issuers/565049') {
    return {
      contextUrl: null,
      documentUrl: url,
      document: assertionController
    }
  }
}

const Vc = new VC()
Vc.addLoader(testLoader)

async function generateKeyPair (id, controller) {
  const keyPair = await Ed25519KeyPair.generate()
  keyPair.id = id
  keyPair.controller = controller || id
  if (id === 'https://example.edu/issuers/keys/1') {
    Vc.addLoader(async (url) => {
      if (url === 'https://example.edu/issuers/keys/1') return keyPair.publicNode()
    })
  }
  // keyPair.owner = owner || id
  // console.log('NODE', keyPair.publicNode())
  return keyPair
}

let issuer
let alice
let issuedCredential
let presentation
test('Init actors', async () => {
  issuer = await generateKeyPair('https://example.edu/issuers/keys/1', 'https://example.edu/issuers/565049')
  alice = await generateKeyPair('did:lor:567alice')
  expect(alice.id).toEqual('did:lor:567alice')
})

test('Issue credential', async () => {
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org'
    ],
    type: ['VerifiableCredential'],
    issuer: issuer.controller,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: alice.publicKeyBase58,
      memberOf: 'did:lor:989898989898',
      procedure: 'hire',
      scope: 'HR',
      threshold: 10000
    }
  }
  issuedCredential = await Vc.issue(credential, issuer)
  console.log(alice)
  console.log(issuedCredential)
  expect(true).toEqual(true)
})

test('Verify credential', async () => {
  const result = await Vc.verifyCredential(issuedCredential, issuer)
  expect(result.verified).toEqual(true)
})

test('Present credential', async () => {
  presentation = await Vc.presentation(issuedCredential, Buffer.alloc(16, 'random').toString(), alice, '12345', alice.id)
  // console.log(presentation)
  expect(presentation.id).toEqual('12345')
})

test('Verify presentation', async () => {
  const result = await Vc.verify(presentation, Buffer.alloc(16, 'random').toString(), issuer)
  expect(result.verified).toEqual(true)
})
