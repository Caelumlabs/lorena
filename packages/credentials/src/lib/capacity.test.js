const cred = require('../index')
const Crypto = require('@caelumlabs/crypto')
const crypto = new Crypto(true)

test('Achievement: should add a Capacity', async () => {
  const capacity = new cred.Capacity(1)

  // Create a new Credential for Achievement
  capacity.peerDid('12345test')
  capacity.capacity('Admin')
  capacity.department('Technology')
  capacity.location('Barcelona')

  expect(capacity.subject['@type']).toEqual('Capacity')
  expect(capacity.subject.id).toEqual(1)
  expect(capacity.subject.department).toEqual('Technology')
  expect(capacity.subject.location).toEqual('Barcelona')

  await crypto.init()
  const issuer = 'did:caelum:10000'
  const signer = crypto.keyPair()
  const signedCredential = await capacity.sign(signer, issuer)
  const result = cred.verifyCredential(signedCredential, signer.address)
  expect(result.check).toEqual(true)
  expect(result.credential.issuer).toEqual(issuer)
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.proof.signature).toBeDefined()
})
