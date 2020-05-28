// Init your Fruit Vault (Identity Container)
// const Index = require('./lib/lorena-index')

const Credential = require('@lorena/credentials')
const Crypto = require('@lorena/crypto')
const Blockchain = require('@lorena/blockchain-substrate')
const IPFS = require('@lorena/storage')

const crypto = new Crypto(true)
const SEED_FROM = '//Alice'

// Debug
var debug = require('debug')('did:debug:idx')
var error = require('debug')('did:error:idx')

/**
 * Runs the default existing IDspace, or initializing it if none exists
 *
 * @param {object} options Input parameters.
 */
const genesis = async (options) => {
  debug('Start Genesis')
  const ipfs = new IPFS()
  const blockchain = new Blockchain('wss://labtest.substrate.lorena.tech')
  await blockchain.connect()
  blockchain.setKeyring(SEED_FROM)

  const organization = new Credential.Organization()
  organization.name('Caelum Labs')
  organization.legalName('Caelum Innovation SL')
  organization.taxID('B67101519')

  const did = await ipfs.put(organization.subject)
  console.log('DID Caelum Labs = ' + did)

  // const dcs = new Credential.Organization()
  // dcs.name('Digital Currency Summit')
  // dcs.memberOf('Lorena - Trust Ecosystem', ipfs.cid(did))

  // const did2 = await ipfs.put(dcs.subject)
  // console.log('DID DCS : ' + did2)

  const seed = crypto.newKeyPair()
  console.log(seed)
  const address = blockchain.getAddress(seed.mnemonic)
  console.log('Temp wallet Seed = ' + seed.mnemonic)
  console.log('Temp wallet Address = ' + address)
  await blockchain.transferTokens(address, 10000000000)

  blockchain.setKeyring(seed.mnemonic)
  await blockchain.registerDid(did)

  // return
}

const main = async () => {
  try {
    genesis()
  } catch (e) {
    error(e)
    process.exit(1)
  }
}

main()
