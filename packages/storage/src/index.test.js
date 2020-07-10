const LorenaStorage = require('./index')
const uuid = require('uuid/v4')

const undefinedCid = 'bafyreifqwkmiw256ojf2zws6tzjeonw6bpd5vza4i22ccpcq4hjv2ts7cm'
let storage, newUuid, newUuidCid

test('Init Storage', async () => {
  storage = new LorenaStorage({ host: 'labdev.ipfs.lorena.tech', port: '5001' })
  expect(storage).toBeDefined()
})

test('Storage put undefined', async () => {
  const result = await storage.put(undefined)
  expect(result).toEqual(undefinedCid)
})

test('Storage put new uuid', async () => {
  newUuid = uuid()
  newUuidCid = await storage.put(newUuid)
  expect(newUuidCid).toBeDefined()
})

test('Storage cid', () => {
  const result = storage.cid(newUuidCid)
  expect(result.string).toEqual(newUuidCid)
  expect(result.codec).toBeDefined()
})

test('Storage get undefined: ', async () => {
  const result = await storage.get(undefinedCid)
  expect(result.value).toBeNull()
})

test('Storage get new uuid: ', async () => {
  const result = await storage.get(newUuidCid)
  expect(result.value).toEqual(newUuid)
})
