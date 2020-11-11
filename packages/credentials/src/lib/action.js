'use strict'
const { signCredential } = require('./signCredential')

/**
 * Schema.org: Action.
 */
module.exports = class Action {
  /**
   * Constructor.
   *
   * @param {string} did The DID corresponding to the issuer of that action
   * @param {number} actionId Action unique identifier for the did
   */
  constructor (did) {
    this.subject = {
      '@type': 'Action',
      id: did
    }
  }

  /**
   * Set the name
   *
   * @param {string} name Full Name in ine string
   */
  name (name) {
    this.subject.name = name
  }

  /**
   * Set the description
   *
   * @param {string} description Full Name in ine string
   */
  description (description) {
    this.subject.description = description
  }

  /**
   * Set extra fields
   *
   * @param {object} extra Extra fields
   */
  extra (extra) {
    this.subject.extra = extra
  }

  /**
   * Sets the agent of the Action for the credential.
   *
   * @param {*} person Persona Object
   */
  agent (person) {
    this.subject.agent = person.subject
  }

  /**
   * Sets the Location for this action.
   *
   * @param {object} location Location Object
   */
  location (location) {
    this.subject.location = location.subject
  }

  /**
   * Sets the starting time.
   *
   * @param {string} start Starting Time
   */
  startTime (start) {
    this.subject.startTime = start
  }

  /**
   * Sets the ending time.
   *
   * @param {string} end Ending Time
   */
  endTime (end) {
    this.subject.endTime = end
  }

  /**
   * Return a signe credential for Action
   *
   * @param {string} issuer DID of the signer
   * @param {object} signer Key Pair
   * @returns {object} Signed credential
   */
  sign (signer, issuer) {
    return signCredential(this.subject, signer, issuer)
  }
}
