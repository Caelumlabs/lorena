const manageWallet = require('./manageWallet')
const path = require('path')

test('should import wallet', async () => {
  const result = await manageWallet.importWallet(path.join(__dirname, '../../sdk/src/__fixtures__/exampleWallet.json'))
  expect(result.zeevee.info).toBeDefined()
})

test('should export wallet', async () => {
  const result = await manageWallet.exportWallet('/tmp/exampleWallet.json', { key: 'value' })
  expect(result).toBe(true)
})
