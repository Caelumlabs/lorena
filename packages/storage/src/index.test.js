const LorenaStorage = require('./index')
let storage, cid
const didDoc = { id: 1, name: 'test' }

test('Init Storage', async () => {
  storage = new LorenaStorage()
  expect(storage).toBeDefined()
})

test('Storage add a file to IPFS', async () => {
  cid = await storage.add('did', didDoc)
  expect(cid).toBeDefined()
})

test('Storage get undefined: ', async () => {
  const result = await storage.get(cid)
  expect(result).toBeDefined()
  expect(result).toEqual(didDoc)
})
