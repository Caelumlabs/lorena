const vc = require('vc-js')
const fs = require('fs').promises
const { defaultDocumentLoader } = vc
const { suites: { Ed25519Signature2018 } } = require('jsonld-signatures')

const documentLoader = async url => {
  if (url === 'https://lorena.tech/context/schema') {
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
  async issue (credential, keyPair) {
    const suite = new Ed25519Signature2018({
      verificationMethod: keyPair.id,
      key: keyPair
    })

    const issue = await vc.issue({ credential, suite, documentLoader })
    return issue
  }

  async presentation (verifiableCredential, keyPair, id, holder) {
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
      presentation, suite, challenge: Buffer.alloc(16, 'random').toString(), documentLoader
    })
    return vp
  }

  async verify (presentation, keyPair) {
    const suite = new Ed25519Signature2018({
      verificationMethod: keyPair.id,
      key: keyPair
    })

    const result = await vc.verify({
      presentation,
      challenge: presentation.proof.challenge,
      suite,
      documentLoader,
      unsignedPresentation: true
    })

    return result.verified
  }

  async verifyCredential (credential, keyPair) {
    const suite = new Ed25519Signature2018({
      verificationMethod: keyPair.id,
      key: keyPair
    })
    const result = await vc.verifyCredential({ credential, suite })
    console.log('RESULT', result)
    return result
  }
}
