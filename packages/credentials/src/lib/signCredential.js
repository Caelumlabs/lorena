'use strict'
const baseCredential = require('../credentials/credential.json')

/**
 * Creates the proof for the Credential and returns the Verifiable Credential
 *
 * @param {object} credential Credential to be signed
 * @param {object} signature Signature of the Credential
 * @param {string} issuer DID for the Identity issuing the credential
 * @param {string} type Encryption Type
 * @returns {*} signedCredential
 */
const signCredential = (credential, signature, issuer, type) => {
  const signedCredential = baseCredential
  signedCredential.type = ['VerifiableCredential', credential.subject['@type']]
  signedCredential.credentialSubject = credential.subject

  const date = new Date()
  signedCredential.issuer = issuer
  signedCredential.issuanceDate = date.toISOString()
  signedCredential.proof.type = type
  signedCredential.proof.verificationMethod = ''
  signedCredential.proof.signature = signature
  return signedCredential
}

module.exports = signCredential
