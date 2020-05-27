'use strict'
/**
 * DidDoc.
 */
module.exports = class DidDoc {
  /**
   * Constructor.
   * @param {string} did The DID corresponding to the issuer of that action
   */
  constructor (did) {
    this.subject = {
      '@context': 'https://www.w3.org/ns/did/v1',
      did: did
    }
  }
}
