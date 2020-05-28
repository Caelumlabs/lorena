const Credential = require('@lorena-ssi/credential-lib')
var debug = require('debug')('did:debug:members')

const MembersAPI = {
  /**
   * Insert a Member
   *
   * @param {object} recipe Recipe Object
   * @param {string} did member DID
   * @param {string} contactId ContactID
   * @param {object} credential Full credential : Person, Organization, Location...
   * @param {string} roleName RoleName
   * @param {string} extra Additional information
   * @param {string} publicKey Public Key
   * @param {string} secretCode Secret Code to verify member
   * @returns {Promise} Result of the SQL insert
   */
  insertMember: (recipe, did, contactId, credential, roleName, extra, publicKey, secretCode) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO members ' +
      ' (did, contactId, givenName, familyName, additionalName, propertyID, roleName, extra, credential, publicKey, secretCode) VALUES ' +
      ' ($did, $contactId, $givenName, $familyName, $additionalName, $propertyID, $roleName, $extra, $credential, $publicKey, $secretCode )'

      const member = new Credential.Person(credential.credentialSubject)
      const params = {
        $did: did,
        $contactId: contactId,
        $givenName: member.subject.givenName,
        $familyName: member.subject.familyName || '',
        $additionalName: member.subject.additionalName || '',
        $propertyID: member.subject.identifier.value || '',
        $roleName: roleName || '',
        $extra: extra,
        $credential: JSON.stringify(credential),
        $publicKey: publicKey,
        $secretCode: secretCode
      }
      recipe.database.runSQL(sql, params)
        .then(resolve)
        .catch((e) => {
          debug(e)
          reject(new Error('failed: updateMemberRole'))
        })
    })
  },
  getMember: (recipe, contactId) => {
    return new Promise((resolve, reject) => {
      recipe.database.getSQL('SELECT * FROM members WHERE contactId=?', [contactId]).then(resolve)
        .catch((e) => {
          debug(e)
          reject(new Error('failed: getMember'))
        })
    })
  },
  updateMemberRole: (recipe, did, contactId, roleName) => {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE members SET roleName=$roleName WHERE did=$did AND contactId=$contactId'
      recipe.database.runSQL(sql, { $did: did, $contactId: contactId, $roleName: roleName })
        .then(resolve)
        .catch((e) => {
          debug(e)
          reject(new Error('failed: updateMemberRole'))
        })
    })
  }
}
module.exports = MembersAPI
