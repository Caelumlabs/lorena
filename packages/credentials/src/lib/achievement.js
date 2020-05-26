'use strict'
/**
 * Schema.org: Action.
 */
module.exports = class Achievement {
  /**
   * Constructor.
   * @param {string} did The DID corresponding to the achievementDID
   * @param {number} actionId Action unique identifier for the did
   */
  constructor (subject = '') {
    this.subject = {
      '@type': 'Achievement'
    }

    if (typeof subject === 'object' && subject['@type'] === 'Achievement') {
      this.subject = subject
    } else if (subject !== '') {
      this.subject.id = subject
    }
  }

  /**
   * Set the title
   * @param {string} name Title in ine string
   */
  title (title) {
    this.subject.title = title
  }

  /**
   * Set the description
   * @param {string} description Full Name in ine string
   */
  description (description) {
    this.subject.description = description
  }

  /**
   * Sets the url of the Achievement for the credential.
   * @param {string} url URL of the Achievement
   */
  url (url) {
    this.subject.url = url
  }

  /**
   * Sets the issuer of the Achievement for the credential.
   * @param {*} person Persona Object
   */
  issuer (did) {
    this.subject.issuer = did
  }

  /**
   * Sets the Location for this Achievement.
   * @param {Location} location Location Object
   */
  location (location) {
    this.subject.location = location.subject
  }

  /**
   * Sets the agent of the Action for the credential.
   * @param {*} subject Person/Organization Object
   */
  agent (agent) {
    this.subject.agent = agent.subject
  }

  /**
   * Sets the starting time.
   * @param {string} start Starting Time
   */
  issuanceDate (issuanceDate) {
    this.subject.issuanceDate = issuanceDate
  }

  /**
   * Sets the ending time.
   * @param {string} end Ending Time
   */
  expirationDate (expirationDate) {
    this.subject.expirationDate = expirationDate
  }

  /**
   * Sets the ending time.
   * @param {string} end Ending Time
   */
  learningAchievement (learningAchievement) {
    this.subject.learningAchievement = {
      title: learningAchievement
    }
  }

  /**
   * Sets the course id.
   * @param {string} end Ending Time
   */
  course (course) {
    this.subject.course = {
      id: course
    }
  }
}
