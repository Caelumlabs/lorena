const { mnemonicGenerate, mnemonicValidate, naclDecrypt, naclEncrypt } = require('@polkadot/util-crypto')
const { stringToU8a, u8aConcat, u8aToHex, hexToU8a, hexToString } = require('@polkadot/util')
const { randomAsU8a, blake2AsHex } = require('@polkadot/util-crypto')
// const { schnorrkelSign, schnorrkelVerify } = require('@polkadot/util-crypto')
const { cryptoWaitReady, createKeyMulti } = require('@polkadot/util-crypto')
const { Keyring } = require('@polkadot/keyring')
/**
 * Javascript Class to interact with Zenroom.
 */
module.exports = class LorenaCrypto {
  /**
   * Init Crypto library
   */
  async init () {
    await cryptoWaitReady()
  }

  keyPair (_mnemonic = false) {
    const mnemonic = (_mnemonic === false) ? mnemonicGenerate() : _mnemonic
    const keyring = new Keyring({ type: 'sr25519' })
    if (mnemonicValidate(mnemonic)) {
      const meta = { whenCreated: Date.now() }
      const pair = keyring.addFromMnemonic(mnemonic, meta)
      const keyringPairAddress = keyring.getPair(pair.address).address
      const keyringPairPubKey = u8aToHex(keyring.getPair(pair.address).publicKey)
      return ({
        mnemonic,
        address: keyringPairAddress,
        publicKey: keyringPairPubKey,
        keyPair: keyring.getPair(pair.address)
      })
    } else return false
  }

  /**
   * Create a multi Address.
   * @param {Array} addresses Array of addresses to be uin the multiaddress
   * @param {number} threshold number of needed addresses to verify
   */
  multiAddress (addresses, threshold = 1) {
    const multiAddress = createKeyMulti(addresses, threshold)
    return (multiAddress)
  }

  /**
   * Encrypts (symmetric) a message with a keypair.
   *
   * @param {string} password Password to encrypt the message
   * @param {string} message Message to be encrypted
   * @returns {Promise} Return a promise with the execution of the encryption.
   */
  encrypt (password, message) {
    let secret = stringToU8a(password)
    secret = u8aConcat(secret, new Uint8Array(32 - secret.length))
    const messagePreEncryption = stringToU8a(message)
    const noncePreEncryption = randomAsU8a(24)

    // Encrypt the message
    const result = naclEncrypt(messagePreEncryption, secret, noncePreEncryption)
    return (result)
  }

  /**
   * Encrypts (symmetric) a message with a keypair.
   *
   * @param {string} password Password to decrypt the message
   * @param {string} msgEncrypted Message to be decrypted
   * @returns {Promise} Return a promise with the execution of the encryption.
   */
  decrypt (password, msgEncrypted) {
    let secret = stringToU8a(password)
    secret = u8aConcat(secret, new Uint8Array(32 - secret.length))
    const messageDecrypted = naclDecrypt(msgEncrypted.encrypted, msgEncrypted.nonce, secret)
    return (hexToString(u8aToHex(messageDecrypted)))
  }

  /**
   * Encrypts (symmetric) a message with a keypair.
   *
   * @param {string} password Password to encrypt the message
   * @param {string} message Message to be encrypted
   * @returns {Promise} Return a promise with the execution of the encryption.
   */
  encryptObj (password, obj) {
    // Prepare Message.
    const result = this.encrypt(password, JSON.stringify(obj))
    return (JSON.stringify({
      e: u8aToHex(result.encrypted),
      n: u8aToHex(result.nonce)
    }))
  }

  /**
   * Encrypts (symmetric) a message with a keypair.
   *
   * @param {string} password Password to decrypt the message
   * @param {string} msgEncrypted Message to be decrypted
   * @returns {Promise} Return a promise with the execution of the encryption.
   */
  decryptObj (password, msgEncrypted) {
    // Decrypt
    const preEncrypted = JSON.parse(msgEncrypted)
    const decryptMsg = {
      encrypted: hexToU8a(preEncrypted.e),
      nonce: hexToU8a(preEncrypted.n)
    }
    const messageDecrypted = this.decrypt(password, decryptMsg)
    return (JSON.parse(messageDecrypted))
  }

  /**
   * Signs a message with a keypair.
   *
   * @param {string} message Message to be signed
   * @param {object} keyPair Keypair for the signer
   * @returns {object} Signature
   */
  signMessage (message, keyPair) {
    const signedData = u8aToHex(keyPair.sign(stringToU8a(message)))
    console.log(signedData)
    return (signedData)
  }

  /**
   * Checks signature of a message.
   *
   * @param {string} message Message signed..
   * @param {object} signature Signature of the message.
   * @param {string} publicKey Public Key of the signature
   * @returns {boolean} Whether the signature is valid or not
   */
  checkSignature (message, signature, publicKey) {
    const verifier = new Keyring({ type: 'sr25519' })
    const pair = verifier.addFromAddress(publicKey)
    const keyPair = verifier.getPair(pair.address)
    const isValid = keyPair.verify(message, signature)
    return isValid
  }

  /**
   * Create a Random string
   *
   * @param {number} length Length of the random string
   * @returns {string} Return a random string
   */
  random (length = 32) {
    const rnd = blake2AsHex(randomAsU8a(length)).toString()
    return (rnd.slice(2, length + 2))
  }

  /**
   * Creates a random Pin
   *
   * @param {number} length Length of the random PIN
   * @returns {number} Random PIN
   */
  randomPin (length = 6) {
    const rnd = randomAsU8a(length)
    return (rnd.slice(0, length))
  }

  /**
   * Create a Hash
   *
   * @param {string} source to be hashed
   * @returns {string} Hashed source
   */
  blake2 (source) {
    return (blake2AsHex(source))
  }
}
