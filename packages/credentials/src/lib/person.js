'use strict'

/**
 * Schema.org : Person
 */
module.exports = class Person {
  /**
   * Constructor
   *
   * @param {string} subject The DID corresponding to the person
   */
  constructor (subject = '') {
    if (typeof subject === 'string') {
      this.subject = { '@type': 'Person', id: subject }
    } else if (typeof subject === 'object' && subject['@type'] === 'Person') {
      this.subject = subject
    } else {
      this.subject = false
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
   * Set the Phone number
   *
   * @param {string} telephone Phone number
   */
  telephone (telephone) {
    this.subject.telephone = telephone
  }

  /**
   * Set the Email
   *
   * @param {string} email Email
   */
  email (email) {
    this.subject.email = email
  }

  /**
   * Set the full Name
   *
   * @param {string} givenName name
   * @param {string} familyName family name
   * @param {string} additionalName any additional Name
   */
  fullName (givenName, familyName, additionalName) {
    this.subject.givenName = givenName
    this.subject.familyName = familyName
    this.subject.additionalName = additionalName
  }

  location (location) {
    this.subject.location = location.subject
  }

  /**
   * National ID
   *
   * @param {string} value National ID Value
   * @param {string} propertyID Type of ID
   */
  nationalID (value, propertyID) {
    this.subject.identifier = {
      '@type': 'PropertyValue',
      propertyID: propertyID,
      value: value
    }
  }
}
