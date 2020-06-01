class ContactsApi {
  /**
   * Insert a Contact
   *
   * @param {object} context IDsapce context
   * @param {object} contact Contact details
   * @returns {*} result
   */
  static async insertContact (context, contact) {
    const sql = 'INSERT OR REPLACE INTO contacts ' +
      ' (did, linkId, diddoc, network, type, name, status ) VALUES ' +
      ' ($did, $linkId, $diddoc, $network, $type, $name, $status )'

    const params = {
      $did: contact.did,
      $linkId: contact.lonkId,
      $diddoc: contact.diddoc,
      $network: contact.network,
      $type: contact.type || 'contact',
      $name: contact.name || '',
      $status: contact.status || 'invited'
    }
    return context.database.runSQL(sql, params)
  }

  /**
   * Get contact from database by DID
   *
   * @param {object} context IDsapce context
   * @param {string} did DID
   * @returns {object} Contact details
   */
  static async getContact (context, did) {
    return new Promise((resolve, reject) => {
      context.database.getSQL('SELECT * FROM contacts WHERE did=?', [did])
        .then((contact) => {
          resolve(contact)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  /**
   * Adds a key.
   *
   * @param {object} context IDsapce context
   * @param {string} did DID
   * @param {string} type Type of key
   * @param {string} key to add
   * @param {number} number Index
   * @returns {*} result
   */
  static async addKey (context, did, type, key, number) {
    const sql = "INSERT INTO keys (did, keyIndex, status, type, key) VALUES (?,?,'active',?,?)"
    return context.database.runSQL(sql, [did, number, type, JSON.stringify(key)])
  }

  /**
   * Get contact from database by DID
   *
   * @param {string} did DID
   * @param {string} type Type of Key
   * @param {number} number Index
   * @returns {object} Contact details
   */
  static async getKey (context, did, type, number) {
    return new Promise((resolve, reject) => {
      context.database.getSQL('SELECT key FROM keys WHERE did=? AND type=? AND keyIndex=? ', [did, type, number])
        .then((result) => {
          resolve(JSON.parse(result.key))
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  /**
   * Adds a Room.
   *
   * @param {object} context IDsapce context
   * @param {string} roomId Room ID
   * @param {string} matrixUser Matrix User
   * @returns {*} result
   */
  static async addConnection (context, roomId, matrixUser) {
    return context.database.runSQL('INSERT INTO connections (roomId, matrixUser) VALUES (?, ?)', [roomId, matrixUser])
  }
}

module.exports = ContactsApi
