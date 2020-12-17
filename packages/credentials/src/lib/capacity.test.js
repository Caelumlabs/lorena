const cred = require('../index')
const Crypto = require('@caelumlabs/crypto')
const crypto = new Crypto(true)

test('Achievement: should add Admin Capacity', async () => {
  const capacity = new cred.Capacity(1)

  // Create a new Credential for Achievement
  capacity.peerDid('12345test')
  capacity.capacity('Admin')
  expect(capacity.subject['@type']).toEqual('Capacity')
  expect(capacity.subject.id).toEqual(1)
  expect(capacity.subject.capacity).toEqual('Admin')

  await crypto.init()
  const issuer = 'did:caelum:10000'
  const signer = crypto.keyPair()
  const signedCredential = await capacity.sign(signer, issuer)
  expect(signedCredential.credentialSubject.sphere).toEqual('Professional')

  const result = cred.verifyCredential(signedCredential, signer.address)
  expect(result.check).toEqual(true)
  expect(result.credential.issuer).toEqual(issuer)
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.proof.signature).toBeDefined()
})

test('Achievement: should Over18', async () => {
  const capacity = new cred.Capacity(1)

  // Create a new Credential for Achievement
  capacity.peerDid('12345test')
  capacity.capacity('Over18')
  expect(capacity.subject['@type']).toEqual('Capacity')
  expect(capacity.subject.id).toEqual(1)
  expect(capacity.subject.capacity).toEqual('Over18')

  await crypto.init()
  const issuer = 'did:caelum:10000'
  const signer = crypto.keyPair()
  const signedCredential = await capacity.sign(signer, issuer)
  expect(signedCredential.credentialSubject.sphere).toEqual('Personal')
})

test('Achievement: should add an MemberOf Capacity', async () => {
  const capacity = new cred.Capacity(1)
  capacity.peerDid('12345test')
  capacity.capacity('MemberOf')
  capacity.department('Technology')
  capacity.location('Barcelona')
  expect(capacity.subject['@type']).toEqual('Capacity')
  expect(capacity.subject.id).toEqual(1)
  expect(capacity.subject.capacity).toEqual('MemberOf')
  expect(capacity.subject.department).toEqual('Technology')
  expect(capacity.subject.location).toEqual('Barcelona')
})

test('Achievement: should add an IssuerOf Capacity', async () => {
  const capacity = new cred.Capacity(1)
  capacity.peerDid('12345test')
  capacity.capacity('IssuerOf')
  capacity.certificate('did:caelum:cid', 'Cert#1')
  expect(capacity.subject['@type']).toEqual('Capacity')
  expect(capacity.subject.id).toEqual(1)
  expect(capacity.subject.capacity).toEqual('IssuerOf')
  expect(capacity.subject.did).toEqual('did:caelum:cid')
  expect(capacity.subject.name).toEqual('Cert#1')
})
