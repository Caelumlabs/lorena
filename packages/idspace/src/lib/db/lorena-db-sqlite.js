const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const DBInterface = require('./lorena-db')
const DBTables = require('./lorena-db-tables')
var debug = require('debug')('did:debug:db')
var error = require('debug')('did:error:db')

/**
 * Javascript Class to interact with Database.
 */
module.exports = class DB extends DBInterface {
  constructor (did, path) {
    super()
    this.db = {}
    this.dbPath = path
    return new Promise((resolve) => {
      // TODO: encrypt file with password
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        /* istanbul ignore if */
        if (err) {
          console.error(err.message)
          process.exit(2)
        }
        debug(`Database Open ${did}`)
        resolve(this)
      })
    })
  }

  /**
   * Delete database.
   */
  delete () {
    try {
      fs.unlinkSync(this.dbPath)
    } catch (err) {
      error(err)
    }
  }

  /**
   * Runs a SQL query
   *
   * @param {string} sql SQL query
   * @param {*} params for query
   * @returns {Promise} SQL query result
   */
  runSQL (sql, params) {
    params = params || []
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        /* istanbul ignore if */
        if (err) {
          error('ERR ' + err)
          reject(err)
          return
        }
        resolve(this.lastID)
      })
    })
  }

  /**
   * Runs a SQL query
   *
   * @param {string} sql SQL query
   * @param {*} params for query
   * @returns {Promise} SQL query result
   */
  getSQL (sql, params) {
    params = params || []
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, res) => {
        /* istanbul ignore if */
        if (err) {
          reject(err)
          return
        }
        resolve((res === undefined) ? false : res)
      })
    })
  }

  /**
   * Runs a SQL query
   *
   * @param {string} sql SQL query
   * @param {*} params for query
   * @returns {Promise} SQL query result
   */
  allSQL (sql, params) {
    params = params || []
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, res) => {
        /* istanbul ignore if */
        if (err) {
          reject(err)
          return
        }
        resolve(res)
      })
    })
  }

  /**
   * Check if a table exists
   *
   * @param {string} table Table name
   * @returns {*} result
   */
  async existTable (table) {
    const sql = 'SELECT * FROM sqlite_master WHERE name =\'' + table + '\' and type=\'table\''
    return this.getSQL(sql, [])
  }

  /**
   * Read DB Schema
   *
   * @returns {*} value
   */
  readSchema () {
    return new Promise((resolve, reject) => {
      this.allSQL('SELECT * FROM sqlite_master', [])
        .then((res) => {
          if (res) {
            resolve(res)
          } else resolve('')
        })
    })
  }

  /**
   * Set the key/value pair
   *
   * @param {*} key key
   * @param {*} value value
   * @param {string} type Type = 'S' for String, 'J' for Json, 'N' for Numeric
   * @returns {*} result
   */
  async set (key, value, type = 'S') {
    let val = value
    switch (type) {
      case 'J': val = JSON.stringify(value) // JSON
        break
    }
    const sql = 'INSERT OR REPLACE INTO settings (key, value, type) VALUES (?, ?, ?)'
    return this.runSQL(sql, [key, val, type])
  }

  /**
   * Get key/value pair
   *
   * @param {*} key to get
   * @returns {JSON} value
   */
  get (key) {
    return new Promise((resolve, reject) => {
      this.getSQL('SELECT * FROM settings WHERE key=?', [key])
        .then((res) => {
          if (res) {
            resolve((res.type === 'J') ? JSON.parse(res.value) : res.value)
          } else resolve('')
        })
    })
  }

  /**
   * Delete key/value pair
   *
   * @param {*} key to get
   * @returns {JSON} value
   */
  del (key) {
    const sql = 'DELETE FROM settings WHERE key=?'
    return this.runSQL(sql, [key])
  }

  /**
   * Get anew unique identifier. Adds one
   *
   * @param {*} key key
   * @returns {number} credentialId
   */
  async getId (key) {
    const res = await this.getSQL('SELECT * FROM settings WHERE key=?', [key])
    let credentialID = 1
    if (res) {
      credentialID = parseInt(res.value) + 1
    }
    this.runSQL('INSERT OR REPLACE INTO settings (key, value, type) VALUES (?, ?, \'N\')', [key, credentialID])
    return credentialID
  }

  /**
   * Update status
   *
   * @param {string} did DID
   * @param {number} contactId Id
   * @param {string} status New status
   * @returns {*} result
   */
  async updateMemberStatus (did, contactId, status) {
    const sql = 'UPDATE members SET status=$status WHERE did=$did AND contactId=$contactId'
    return this.runSQL(sql, { $did: did, $contactId: contactId, $status: status })
  }

  /**
   * Get one member
   *
   * @param {string} did DID
   * @returns {JSON} value
   */
  getMember (did) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM members WHERE did=?'
      this.getSQL(sql, [did])
        .then((res) => {
          resolve(res)
        })
        .catch(() => {
          reject(new Error('Not found'))
        })
    })
  }

  /**
   * Get all members
   *
   * @param {string} _filter Filter options
   * @returns {Array} List of members
   */
  getMembers (_filter) {
    return this.allSQL('SELECT * FROM members')
  }

  /**
   * Insert a Contact
   *
   * @param {object} contact Contact details
   * @returns {*} result
   */
  async insertContact (contact) {
    const sql = 'INSERT OR REPLACE INTO contacts ' +
      ' (matrixUser, network, roomId, type, name, alias, didType, status ) VALUES ' +
      ' ($matrixUser, $network, $roomId, $type, $name, $alias, $didType, $status )'

    const params = {
      $matrixUser: contact.matrixUser,
      $network: contact.network,
      $roomId: contact.room_id || '',
      $type: contact.type || 'contact',
      $name: contact.name || '',
      $alias: contact.alias,
      $didType: contact.didType,
      $status: 'invited'
    }
    return this.runSQL(sql, params)
  }

  /**
   * Updates contact as accepted
   *
   * @param {string} roomId Contact room ID
   * @param {string} membership Join or Leave
   * @param {string} status Status
   * @returns {*} results
   */
  async updateContact (roomId, membership, status = 'accepted') {
    let sql
    if (membership === 'join') {
      sql = 'UPDATE contacts SET status=$status,joinAt=CURRENT_TIMESTAMP WHERE roomId=$roomId'
    } else if (membership === 'leave') {
      sql = 'UPDATE contacts SET status=$status,leaveAt=CURRENT_TIMESTAMP WHERE roomId=$roomId'
    } else {
      sql = 'UPDATE contacts SET status=$status WHERE roomId=$roomId'
    }
    return this.runSQL(sql, { $roomId: roomId, $status: status })
  }

  /**
   * Update contact Status
   *
   * @param {string} roomId Contact room ID
   * @param {string} status new Status
   * @returns {*} result
   */
  async updateContactStatus (roomId, status) {
    const sql = 'UPDATE contacts SET status=$status WHERE roomId=$roomId'
    const params = {
      $status: status,
      $roomId: roomId
    }
    return this.runSQL(sql, params)
  }

  /**
   * Get contact from database by DID
   *
   * @returns {object} Contact details
   */
  async getContact () {
    return new Promise((resolve, reject) => {
      this.getSQL('SELECT * FROM contacts WHERE type=\'me\'')
        .then((contact) => {
          resolve(contact)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  /**
   * Get contact from database by DID
   *
   * @param {string} contactId DID
   * @param {string} type Type of Key
   * @param {number} number Index
   * @returns {object} Contact details
   */
  getKey (contactId, type, number) {
    return new Promise((resolve, reject) => {
      this.getSQL('SELECT key, type FROM keys WHERE owner=? AND type=? AND keyNumber=? ', [contactId, type, number])
        .then((keypair) => {
          resolve((keypair.type === 'zenroom:keypair' || keypair.type === 'zenroom:public_key') ? JSON.parse(keypair.key) : keypair.key)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  /**
   * Get contact from database by DID
   *
   * @param {number} contactId COntact ID
   * @returns {object} Contact details
   */
  async getContactById (contactId) {
    return this.getSQL('SELECT * FROM contacts WHERE id=?', [contactId])
  }

  /**
   * Get Recipe from database by recipeId
   *
   * @param {number} recipeId Recipe Id
   * @returns {Promise} Recipe details
   */
  async getRecipe (recipeId) {
    return this.getSQL('SELECT * FROM recipes WHERE recipeId=?', [recipeId])
  }

  /**
   * Get Steps from database by recipeId
   *
   * @param {number} recipeId Recipe Id
   * @returns {Promise} Recipe details
   */

  /**
   * Get the contact from a Room ID
   *
   * @param {string} roomId Room ID
   * @returns {object} Contact details
   */
  async getContactByRoomId (roomId) {
    return this.getSQL('SELECT * FROM contacts WHERE roomId=?', [roomId])
  }

  /**
   * Adds a key.
   *
   * @param {string} owner contactId to add key to
   * @param {string} type Type of key
   * @param {string} key to add
   * @param {number} number Index
   * @returns {*} SQL result
   */
  async addKey (owner, type, key, number) {
    const sql = "INSERT INTO keys (owner, keyNumber, status, type, key) VALUES (?,?,'active',?,?)"
    return this.runSQL(sql, [owner, number, type, (typeof key === 'string') ? key : JSON.stringify(key)])
  }

  /**
   * Adds a Credential.
   *
   * @param {number} credentialId Credential unique identifier.
   * @param {number} contactId Contact Id.
   * @param {string} owner DID of the owner
   * @param {string} issuer DID of the issuer
   * @param {string} credentialType  Type of credential
   * @param {string} credentialSubject Claim
   * @returns {*} Id for the new row inserted
   */
  /* async addCredential (credentialId, contactId, owner, issuer, credentialType, credentialSubject) {
    const subject = JSON.stringify(credentialSubject)
    const sql = 'INSERT INTO credentials (credentialId, contactId, owner, issuer, credentialType, credentialSubject) VALUES (?,?,?)'
    return this.runSQL(sql, [credentialId, contactId, owner, issuer, credentialType, subject])
  } */

  /**
   * Get Contacts from
   *
   * @param {string} filter Status of the contact
   * @returns {Promise} Recipe details
   */
  async getContacts (filter = 'all') {
    let claim
    if (filter === 'all') {
      const invited = await this.allSQL('SELECT id,createdAt,joinAt,status,type,name,alias FROM contacts WHERE type =\'contact\' AND status=\'invited\'')
      for (let i = 0; i < invited.length; i++) {
        // claim = await this.getClaim(invited[i].id, 'memberOf')
        invited[i].fullName = claim.credentialSubject.member.member.givenName + ' ' + claim.credentialSubject.member.member.familyName + ' ' + claim.credentialSubject.member.member.additionalName
        invited[i].nationalId = claim.credentialSubject.member.member.identifier.value
      }
      return ({ invited })
    } else {
      const filtered = await this.allSQL('SELECT id,did,createdAt,joinAt,status,type,name,alias FROM contacts WHERE status=?', [filter])
      return ({ filtered })
    }
  }

  /**
   * Init Database Tables
   *
   * @returns {Promise} query results
   */
  async init () {
    return new Promise((resolve, reject) => {
      DBTables.reduce((accumulatorPromise, nextSQL) => {
        return accumulatorPromise.then(() => {
          return new Promise((resolve, reject) => {
            this.db.run(nextSQL, (err) => {
              /* istanbul ignore if */
              if (err) {
                reject(err)
                return
              }
              resolve()
            })
          })
        })
      }, Promise.resolve())
      resolve()
    })
  }

  /**
   * Init Database Tables
   * Can pass different DB definitions
   * Used during DB migrations
   *
   * @param {[]} dbDef DB Definition
   * @returns {Promise} query results
   */
  async initDB (dbDef = DBTables) {
    const proms = []
    dbDef.forEach((nextSQL, index) => {
      proms[proms.length] = new Promise((resolve, reject) => {
        this.db.run(nextSQL, (err) => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
      })
    })
    return Promise.all(proms)
  }

  /**
   * Close database
   */
  close () {
    this.db.close()
  }
}
