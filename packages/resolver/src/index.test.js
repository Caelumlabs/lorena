const { Resolver } = require('did-resolver')
const LorenaDidResolver = require('..')

let resolver, lorResolver
const badDIDs = [
  'did:lor:labdev:TuNaFiShSaNdWiChAnDfRiEsPlEaSe5q',
  'did:lor:fake:TuNaFiShSaNdWiChAnDfRiEsPlEaSe5q'
]

test('should get the info for the "labdev" network', () => {
  const info = LorenaDidResolver.getInfoForNetwork('labdev')
  expect(info).toBeDefined()
  expect(info.type).toEqual('substrate')
  expect(info.blockchainEndpoint).toContain('labdev')
})

test('should get the info for a did on the "and" network', () => {
  const info = LorenaDidResolver.getInfoForDid('did:lor:and:UVRaa2VFOURZVjk0YkVsV1pGZHhhR3RU')
  expect(info).toBeDefined()
})

test('should get undefined for a did on the "xxx" network', () => {
  const info = LorenaDidResolver.getInfoForDid('did:lor:xxx:UVRaa2VFOURZVjk0YkVsV1pGZHhhR3RU')
  expect(info).toBeUndefined()
})

test('should get the lorena resolver', () => {
  lorResolver = LorenaDidResolver.getResolver()
  expect(lorResolver).toBeDefined()
})

test('should construct the resolver', () => {
  resolver = new Resolver(lorResolver)
  expect(resolver).toBeDefined()
  expect(resolver.resolve).toBeDefined()
})

test('should get an empty public key for a nonexistent DID', async () => {
  await badDIDs.forEach(async (did) => {
    // using a valid DID, retrieve public key
    const publicKey = await LorenaDidResolver.getPublicKeyForDid(did)
    expect(publicKey).toBe('')
  })
})

test('should get nothing for a nonexistent DID', async () => {
  await badDIDs.forEach(async (did) => {
    // using a invalid DID, empty did doc
    const doc = await resolver.resolve(did)
    expect(doc).toBeNull()
  })
})

const goodDIDs = [
  'did:lor:labdev:WjBSUVNIRjJhRFJoYjJsMU0wSnVka0Zz',
  'did:lor:labtest:VFhKQ2FsazVSM1pWY0VaWmJXVlpSVmRS'
]

test('should get the public key for a DID', async () => {
  await goodDIDs.forEach(async (did) => {
    jest.setTimeout(10000)
    // using a valid DID, retrieve public key
    const publicKey = await LorenaDidResolver.getPublicKeyForDid(did)
    expect(publicKey).toBeDefined()
  })
})

test.skip('should get the complete DID Document for a DID', async () => {
  jest.setTimeout(30000)
  console.log('111111111111111')
  await goodDIDs.forEach(async (did) => {
    console.log('2222222222222222')
    console.log('33333333333 - did: ', did)
    // using a valid DID, retrieve public key
    const doc = await resolver.resolve(did)
    console.log('44444444444 - doc: ', doc)
    expect(doc).toBeDefined()
    expect(doc.id).toEqual(did)
    expect(doc.authentication[0].id).to.contain(did)
    // the public key should be the same as the one in the blockchain
    // expect(doc.authentication[0].publicKey).toEqual(publicKey)
    // console.log('DOCCCCCCCCCCCCCCCCCC', doc.authentication[0].publicKey)
    // console.log(publicKey)
  })
})

test.skip('should get the fragment for a DID path', async () => {
  const did = 'did:lor:labdev:Wldvd1pqVmZWbEoxYVdaWFdGOW5ja05I/service/0#serviceEndpoint'
  await resolver.resolve(did)
  // console.log(doc)
  // TODO: using a valid DID path, retrieve valid did doc fragment
})

test('should get nothing for an unknown DID', async () => {
  const doc = await resolver.resolve('did:lor:xxx:324793842738472')
  expect(doc).toBeNull()
})

test('should disconnect cached connections for a clean shutdown', () => {
  LorenaDidResolver.disconnectAll()
})
