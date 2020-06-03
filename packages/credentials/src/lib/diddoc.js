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

  /**
   * Add a service to the diddoc
   * @param {string} id Identifier for the DID
   * @param {*} type Type of Service
   * @param {*} serviceEndpoint Service endpoint
   */
  addService (id, type, serviceEndpoint) {
    if (!this.subject.service) {
      this.subject.service = []
    }
    this.subject.service.push({
      id: this.subject.did + '#' + id,
      type,
      serviceEndpoint
    })
  }
}
