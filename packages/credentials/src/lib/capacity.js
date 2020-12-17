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
   * Set the Sphere: personal or profesisonal
   *
   * @param {string} did of the credential
   * @param {string} name of the credential
   */
  certificate (did, name) {
    this.subject.did = did
    this.subject.name = name
  }

  /**
   * Return a signe credential for Action
   *
   * @param {object} signer Key Pair
   * @param {string} issuer DID of the signer
   * @returns {object} Signed credential
   */
  sign (signer, issuer) {
    this.subject.sphere = (this.subject.capacity === 'Over18') ? 'Personal' : 'Professional'
    return signCredential(this.subject, signer, issuer)
  }
}
