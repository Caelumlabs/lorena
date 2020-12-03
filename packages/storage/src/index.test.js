const LorenaStorage = require('./index')
let storage, cid
const didDoc = { id: 1, name: 'test' }

test('Init Storage', async () => {
  storage = new LorenaStorage('Qs1xtyiXF8JGDTOO67HdWw==', 'iQIE4iYzWUfttLb6vfz2Qt8D/eC1prlq7SvdtBtuNo4=')
  expect(storage).toBeDefined()
})

test('Storage add a file to IPFS', async () => {
  cid = await storage.add('caelumlabs', didDoc)
  expect(cid).toBeDefined()
})

test('Storage get : ', async () => {
  const result = await storage.get(cid)
  expect(result).toBeDefined()
  expect(result).toEqual(didDoc)
})

test('Add second Storage with different hash', async () => {
  didDoc.id = 2
  cid = await storage.add('dcs', didDoc)
  expect(cid).toBeDefined()
  const result = await storage.get(cid)
  expect(result).toBeDefined()
  expect(result).toEqual(didDoc)
})
