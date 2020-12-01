'use strict'
const { signCredential } = require('./signCredential')

/**
 * Schema.org: Action.
 */
module.exports = class Capacity {
  /**
   * Constructor.
   *
   * @param {string} subject of the achievement
   */
  constructor (subject = '') {
    this.subject = { '@type': 'Capacity', version: 1 }

    if (typeof subject === 'object' && subject['@type'] === 'Capacity') {
      this.subject = subject
    } else if (subject !== '') {
      this.subject.id = subject
    }
  }

  /**
   * Set the peerDid
   *
   * @param {string} peerDid of the achievement
   */
  peerDid (peerDid) {
    this.subject.peerDid = peerDid
  }

  /**
   * Set the Capacity
   *
   * @param {string} capacity of the achievement
   */
  capacity (capacity) {
    this.subject.capacity = capacity
  }

  /**
   * Set the Department
   *
   * @param {string} department of the achievement
   */
  department (department) {
    this.subject.department = department
  }

  /**
   * Set the Department
   *
   * @param {string} department of the achievement
   */
  location (department) {
    this.subject.location = department
  }

  /**
   * Return a signe credential for Action
   *
   * @param {object} signer Key Pair
   * @param {string} issuer DID of the signer
   * @returns {object} Signed credential
   */
  sign (signer, issuer) {
    return signCredential(this.subject, signer, issuer)
  }
}
