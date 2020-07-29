const vc = require('vc-js')
const fs = require('fs').promises
const { defaultDocumentLoader } = vc
const { suites: { Ed25519Signature2018 } } = require('jsonld-signatures')
const MultiLoader = require('./utils/MultiLoader')

const documentLoader = async url => {
  if (url === 'https://schema.org') {
    return {
      contextUrl: null,
      documentUrl: url,
      document: await fs.readFile('./contexts/schema.jsonld', { encoding: 'utf8' })
    }
  }

  if (url === 'https://www.w3.org/2018/credentials/v1') {
    return {
      contextUrl: null,
      documentUrl: url,
      document: await fs.readFile('./contexts/credentials.jsonld', { encoding: 'utf8' })
    }
  }

  return defaultDocumentLoader(url)
}

module.exports = class Vc {
  constructor () {
    this.multiLoader = new MultiLoader(documentLoader)
  }

  documentLoader (url) {
    return this.multiLoader.load(url)
  }

  addLoader (loader) {
    this.multiLoader.add(loader)
  }

  async issue (credential, keyPair) {
    const suite = new Ed25519Signature2018({
      verificationMethod: keyPair.id,
      key: keyPair
    })

    const issue = await vc.issue({ credential, suite, documentLoader: this.documentLoader.bind(this) })
    return issue
  }

  async verifyCredential (credential, keyPair) {
    const suite = new Ed25519Signature2018({
      verificationMethod: keyPair.id,
      key: keyPair
    })
    const result = await vc.verifyCredential({ credential, suite, documentLoader: this.documentLoader.bind(this) })
    return result
  }

  async presentation (verifiableCredential, challenge, keyPair, id, holder) {
    const suite = new Ed25519Signature2018({
      verificationMethod: keyPair.id,
      key: keyPair
    })

    const presentation = await vc.createPresentation({
      verifiableCredential,
      id,
      holder
    })

    const vp = await vc.signPresentation({
      presentation,
      suite,
      challenge,
      documentLoader: this.documentLoader.bind(this)
    })
    return vp
  }

  async verify (presentation, challenge, keyPair) {
    const suite = new Ed25519Signature2018({
      verificationMethod: keyPair.id,
      key: keyPair
    })

    const result = await vc.verify({
      presentation,
      challenge,
      suite,
      documentLoader: this.documentLoader.bind(this),
      unsignedPresentation: true
    })

    return result
  }
}
