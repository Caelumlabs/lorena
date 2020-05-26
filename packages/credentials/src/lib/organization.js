'use strict'

/**
 * Schema.org: Organization.
 */
module.exports = class Organization {
  /**
   * Constructor
   *
   * @param {string} did The DID corresponding to the persona
   */
  constructor (did = false) {
    this.subject = {
      '@type': 'Organization'
    }
    if (did !== false) {
      this.subject.id = did
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
   * Set the legal name
   *
   * @param {string} name Full Legal Name in ine string
   */
  legalName (legalName) {
    this.subject.legalName = legalName
  }

  /**
   * Set the taxID
   *
   * @param {string} taxID taxID
   */
  taxID (taxID) {
    this.subject.taxID = taxID
  }

  /**
   * Set the url
   *
   * @param {string} url URL
   */
  url (url) {
    this.subject.url = url
  }

  /**
   * Set the foundingDate
   *
   * @param {string} foundingDate founding Date
   */
  foundingDate (foundingDate) {
    this.subject.foundingDate = foundingDate
  }

  /**
   * Sets the member of this organization for the credential.
   *
   * @param {string} roleName role name
   * @param {*} persona Persona Object
   */
  member (roleName, persona) {
    this.subject.member = {
      '@type': 'OrganizationRole',
      roleName: roleName,
      member: persona.subject
    }
  }

  /**
   * Sets the member of a organization.
   *
   * @param {string} roleName role name
   * @param {*} persona Persona Object
   */
  memberOf (name, url) {
    this.subject.memberOf = {
      '@type': 'Organization',
      name: name,
      url: url
    }
  }

  /**
   * Sets the location of the organization.
   *
   * @param {*} location Location Object
   */
  location (location) {
    this.subject.location = location.subject
  }
}
