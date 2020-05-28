const fs = require('fs')
const path = require('path')
var DBTables = require('./lorena-db-tables')
const DB = require('./lorena-db-sqlite')
const lex = require('./lorena-db-lexer').lex

var debug = require('debug')('did:debug:db')
var error = require('debug')('did:error:db')

const timeToFormattedTime = (timestamp) => {
  var time = new Date(timestamp)
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var year = time.getFullYear()
  var month = months[time.getMonth()]
  var date = time.getDate()
  var hour = time.getHours()
  var min = time.getMinutes()
  var sec = time.getSeconds()
  var timeString = year + '-' + month + '-' + date + '-' + hour + min + sec
  return timeString
}

/**
 * Javascript Class to migrate Database.
 */
module.exports = class DBMigrator {
  constructor (did, path) {
    this.srcDB = {}
    this.dstDB = {}
    this.srcSchema = []
    this.dstSchema = []
    this.dbPath = path
    this.did = did

    this.newTables = 0
    this.oldTables = 0
    this.delTables = 0

    this.unmodifiedTables = 0
    this.modifiedTables = 0

    this.newColumns = 0
    this.modifiedColumns = 0
    this.deletedColumns = 0
    return this
  }

  /**
   * Do Migration.
   *
   * @returns {boolean} result
   */
  async doMigration () {
    if (!await this.checkDB()) {
      debug('Migration can not be done. Stopped!!')
      return false
    }
    await this.openSourceDB()
    await this.compareSchemas()

    if ((this.newTables === 0) && (this.delTables === 0) && (this.newTables === 0) && (this.modifiedColumns === 0) && (this.deletedColumns === 0)) {
      // no migration needed
      await this.closeSourceDB()
      return false
    }

    // do effective migration
    await this.createAndOpenTargetDB()
    await this.initializeTargetDB()
    await this.processTables()
    await this.closeSourceDB()
    await this.closeTargetDB()

    // rename DB files keeping old DB
    await this.renameDBFiles()
    return true
  }

  /**
   * Read Source DB Table
   *
   * @param {object} table Table to read
   * @returns {object} Table rows
   */
  async readSourceDBTable (table) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM ' + table

      this.srcDB.allSQL(sql, []).then((res) => {
        if (res) {
          resolve(res)
        } else resolve('')
      })
    })
  }

  /**
   * Process every table
   * (TODO: this implementation copies only.
   * there must be an implementation with an ETL kind of process)
   */
  async processTables () {
    for (let idx = 0, len = this.dstSchema.length; idx < len; idx++) {
      const table = this.dstSchema[idx]
      switch (table.newTable) {
        case 'deleted':
          break
        case 'new':
          break
        case 'old':
          await this.fullCopy(table)
          break
        default:
          error('ERROR: Invalid type for table copy. This should not happen!!')
          process.exit(3)
      }
    }
  }

  /**
   * Full copy of a Table
   *
   * @param {object} table Table to process
   */
  async fullCopy (table) {
    const srcRows = await this.readSourceDBTable(table.name)
    // if table is empty -> do not copy
    if (!Array.isArray(srcRows) || (srcRows.length === 0)) {
      return
    }
    const sqlStatements = []
    const valuesOfValues = []
    srcRows.forEach((row) => {
      const sql = 'INSERT OR REPLACE INTO ' + table.name
      let columnsString = ''
      let valuesString = ''
      const values = []
      let insertComma = false
      table.columns.forEach((col) => {
        switch (col.changed) {
          case 'no changes':
            if (insertComma) {
              columnsString = columnsString.concat(', ', col.name)
              valuesString = valuesString.concat(' , ?')
            } else {
              columnsString = columnsString.concat(' (', col.name)
              valuesString = valuesString.concat(' VALUES (?')
              insertComma = true
            }
            values[values.length] = row[col.name]
            return
          case 'deleted':
            return
          case 'new':
            return
          default:
            error('ERROR: Column change type invalid. This error should not happen!!')
            process.exit(3)
        }
      })
      sqlStatements[sqlStatements.length] = sql + columnsString + ')' + valuesString + ')'
      valuesOfValues[valuesOfValues.length] = values
    })
    await this.loadTargetDB(sqlStatements, valuesOfValues)
    // TODO: compare both databases to be equal
  }

  /**
   * Load target DB
   *
   * @param {[]} statements SQL statements to execute
   * @param {[]} values Values to feed
   * @returns {Promise} of completion
   */
  async loadTargetDB (statements, values) {
    const executeStatements = []
    statements.forEach((statement, index) => {
      executeStatements[executeStatements.length] = this.dstDB.runSQL(statement, values[index])
    })
    return Promise.all(executeStatements)
  }

  /**
   * Initialize target DB
   */
  async initializeTargetDB () {
    // initializes the target DB
    await this.dstDB.initDB(DBTables)
  }

  /**
   * Build Source DB Schema
   */
  async buildSourceDBSchema () {
    // builds the source schema
    const dbs = await this.readDBSchema()
    const sdb = await Promise.all(dbs.map(async (sql) => {
      return await this.buildSourceDBSchemaMember(sql)
    }))
    this.srcSchema = sdb.filter(item => (typeof item !== 'undefined'))
  }

  /**
   * Build Target DB Schema
   */
  async buildTargetDBSchema () {
    // builds the target schema
    const tdb = await Promise.all(DBTables.map(async (sql) => {
      return await this.buildTargetDBSchemaMember(sql)
    }))
    this.dstSchema = tdb.filter(item => (typeof item !== 'undefined'))
  }

  /**
   * Compare Source Schema vs Target Schema
   */
  async compareSchemas () {
    // compare both schema definitions
    await this.buildSourceDBSchema()
    await this.buildTargetDBSchema()

    this.dstSchema.forEach((dst, index) => {
      if (typeof this.srcSchema.find(val => dst.name === val.name) === 'undefined') {
        this.dstSchema[index].newTable = 'new'
        this.newTables++
      } else {
        this.dstSchema[index].newTable = 'old'
        this.oldTables++
      }
    })
    this.srcSchema.forEach((src) => {
      const dstTbl = this.dstSchema.find(val => src.name === val.name)
      if (typeof dstTbl === 'undefined') {
        this.dstSchema[this.dstSchema.length] = src
        this.dstSchema[this.dstSchema.length].newTable = 'deleted'
        this.delTables++
      }
    })
    this.dstSchema.forEach((tbl, index) => {
      if (tbl.newTable !== 'old') {
        return
      }
      this.dstSchema[index] = this.compareColumns(tbl, index)
    })
  }

  /**
   * Compare Columns in equal tables
   *
   * @param {*} tbl Table to explore and enhance
   * @param {*} index Table index
   * @returns {object} table
   */
  compareColumns (tbl, index) {
    const srcTable = this.srcSchema.find(val => tbl.name === val.name)
    if (typeof srcTable === 'undefined') {
      error('ERROR: Table not found during table compare. This should not happen!!')
    }
    tbl.columns.forEach((column, index) => {
      const srcColumn = srcTable.columns.find(val => column.name === val.name)
      if (typeof srcColumn === 'undefined') {
        tbl.columns[index].changed = 'new'
        this.newColumns++
      } else {
        tbl.columns[index].changed = 'no changes'
      }
    })
    const srcCol = srcTable.columns.find(val => val.name === tbl.name)
    if (typeof srcCol !== 'undefined') {
      srcCol.changed = 'deleted'
      tbl.columns[tbl.columns.length] = srcCol
      this.deletedColumns++
    }
    return tbl
  }

  /**
   * Build each source schema members
   *
   * @param {*} item Item to be explored
   * @returns {*} schema member
   */
  async buildSourceDBSchemaMember (item) {
    if (item.type !== 'table') {
      return
    }
    if (item.name === 'sqlite_sequence') {
      return
    }

    const table = {}
    table.name = item.name
    table.tblname = item.tbl_name
    return this.buildSchemaMember(table, item.sql)
  }

  /**
   * Build each target schema members
   *
   * @param {*} sql SQL definition member
   * @returns {*} schema member
   */
  async buildTargetDBSchemaMember (sql) {
    const table = {}
    table.name = ''
    table.tblname = ''
    return this.buildSchemaMember(table, sql)
  }

  /**
   * Build each schema members
   *
   * @param {*} table table to build
   * @param {*} sql sql statement to create table
   * @returns {object} table
   */
  buildSchemaMember (table, sql) {
    const lexResult = lex(sql)
    const lr = lexResult.tokens
    let tableNameFound = false
    let openBrackets = 0
    let openQuotes = false
    let NullsAllowed = true
    table.columns = []
    let column = {}
    for (let i = 0, len = lr.length; i < len; i++) {
      switch (lr[i].tokenType.name) {
        case 'Table':
          // eslint-disable-next-line indent
              tableNameFound = false
          break
        case 'LeftParen':
          openBrackets++
          break
        case 'Identifier':
          if (!tableNameFound) {
            if (table.name === '') {
              table.name = lr[i].image
              table.tblname = lr[i].image
            }
            if (lr[i].image !== table.name) {
              error('ERROR: Lexer table name does not match')
              process.exit(1)
            } else {
              tableNameFound = true
              break
            }
          }
          if (openQuotes && column.default) {
            column.defaultValue = lr[i].image
            break
          }
          if ((openBrackets > 1) && (column.type === 'Char')) {
            column.length = lr[i].image
            break
          }
          column.name = lr[i].image
          column.type = ''
          column.length = 0
          column.primaryKey = false
          column.default = false
          column.defaultValue = ''
          column.autoIncrement = false
          column.Null = true
          break
        case 'Integer':
        case 'Text':
        case 'Boolean':
        case 'DateTime':
        case 'Char':
          column.type = lr[i].tokenType.name
          break
        case 'Comma':
          table.columns[table.columns.length] = column
          column = {}
          break
        case 'Quote':
          openQuotes = !openQuotes
          break
        case 'Default':
          column.default = true
          break
        case 'Primary':
          column.primaryKey = true
          break
        case 'AutoIncrement':
          column.autoIncrement = true
          break
        case 'CurrentTime':
          if (column.default) {
            column.defaultValue = lr[i].tokenType.name
          }
          break
        case 'Number':
          if ((openBrackets > 1) && (column.type === 'Char')) {
            column.length = lr[i].image
          } else {
            column.defaultValue = lr[i].image
          }
          break
        case 'Not':
          if (tableNameFound) {
            NullsAllowed = false
          }
          break
        case 'Null':
          column.Null = NullsAllowed
          NullsAllowed = true
          break
        case 'RightParen':
          openBrackets--
          if (openBrackets === 0) {
            table.columns[table.columns.length] = column
            column = {}
          }
          break
        default:
          break
      }
    }
    return table
  }

  /**
   * Check file name and DB existence for Source DB
   *
   * @returns {boolean} success
   */
  async checkDB () {
    debug('Sqlite : Checking Source DB')
    // Make sure directory data/ exists
    try {
      await fs.promises.access(this.dbPath)
    } catch (error) {
      debug('Source DB directory does not exist: ' + this.dbPath)
      return false
    }
    const databasePath = path.join(this.dbPath, this.did + '.db')
    try {
      await fs.promises.access(databasePath)
    } catch (error) {
      debug('DB file does not exist: ' + databasePath)
      return false
    }

    this.srcDBPath = databasePath
    return true
  }

  /**
   * Open the source DB.
   *
   * @returns {object} srcDB
   */
  async openSourceDB () {
    await this.checkDB()
    this.srcDB = await new DB(this.did, this.srcDBPath)
    return this.srcDB
  }

  /**
   * Create and open the target DB.
   *
   * @returns {object} destination database
   */
  async createAndOpenTargetDB () {
    const now = new Date()
    const dstTempName = '$$$' + this.did + '$$$-' + timeToFormattedTime(now)
    // make sure tmp directory exists opr create it
    const tmpDirName = path.join(this.dbPath, '/tmp')
    await fs.promises.mkdir(tmpDirName, { recursive: true })
    const dstPath = path.join(tmpDirName, dstTempName + '.db')
    this.dstDBPath = dstPath
    this.dstDB = await new DB(dstTempName, this.dstDBPath)
    return this.dstDB
  }

  /**
   * Read DB Schema
   *
   * @returns {object} schema
   */
  async readDBSchema () {
    const dbSchema = await this.srcDB.readSchema()
    return dbSchema
  }

  /**
   * Set DB Tables definition file
   *
   * @param {object} dbTables DBTables definition
   * @returns {object} DBTables
   */
  setDBTables (dbTables) {
    DBTables = dbTables
    return DBTables
  }

  /**
   * Close Source DB
   */
  async closeSourceDB () {
    await this.srcDB.close()
  }

  /**
   * Close Target DB
   */
  async closeTargetDB () {
    await this.dstDB.close()
  }

  /**
   * Rename DB files
   *
   * @returns {number} Bytes transferred
   */
  async renameDBFiles () {
    // rename DB files cannot be done straight because a bug in SQLite
    // SQLite does not free the database file whe close
    // even calling mv shell command does not work
    // The only solution (as a workaround) is overwrite the files and that must
    // be done at low-level
    // TODO: Explore better solution through SQLite3 modifications
    const now = new Date()
    let bckName = '-BckUp-' + timeToFormattedTime(now)

    const bckExtension = path.extname(this.srcDBPath)
    const bckFileName = path.basename(this.srcDBPath, bckExtension)

    bckName = bckFileName.concat(bckExtension).concat(bckName)
    debug('New Name = %O', bckName)
    // make sure bck directory exists or create it
    const bckDirName = path.join(this.dbPath, '/bck')
    await fs.promises.mkdir(bckDirName, { recursive: true })
    const bckDBPath = path.join(bckDirName, bckName)

    await this.copyFiles(this.srcDBPath, bckDBPath)
    const bytesWritten = await this.copyFiles(this.dstDBPath, this.srcDBPath)

    // delete tmp file
    await this.deleteFile(this.dstDBPath)

    return bytesWritten
  }

  /**
   * Copy Files low-level
   *
   * @param {path} src Path to source file
   * @param {path} dst Path to target file
   * @returns {number} Bytes transferred
   */
  async copyFiles (src, dst) {
    const srcFD = await this.openFile(src, 'r')
    const dstFD = await this.openFile(dst, 'w')

    const stats = await this.getStats(srcFD)
    const buffer = await this.readFile(srcFD, stats)
    const bytesWritten = await this.writeFile(dstFD, buffer)

    await this.closeFile(srcFD)
    await this.closeFile(dstFD)

    return bytesWritten
  }

  /**
   * Open a file async
   *
   * @param {string} fileName File to open
   * @param {*} params Open params
   * @returns {Promise} File descriptor
   */
  openFile (fileName, params) {
    params = params || 'r'
    return new Promise((resolve, reject) => {
      fs.open(fileName, params, (err, fd) => {
        if (err) {
          error('ERROR: error opening file -> %O', err)
          reject(err)
          return
        }
        resolve(fd)
      })
    })
  }

  /**
   * Close a file async
   *
   * @param {number} fd File descriptor
   * @returns {Promise} of file being closed
   */
  closeFile (fd) {
    return new Promise((resolve, reject) => {
      fs.close(fd, (err) => {
        if (err) {
          error('ERROR: closing file -> %O', err)
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Delete a file async
   *
   * @param {path} filePath File path to delete
   * @returns {Promise} of deleted file
   */
  deleteFile (filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          error('ERROR: deleting file -> %O', err)
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * File Stats async
   *
   * @param {number} fd File descriptor
   * @returns {Promise} Stats data
   */
  getStats (fd) {
    const statsData = {}
    return new Promise((resolve, reject) => {
      fs.fstat(fd, (err, stats) => {
        if (err) {
          error('ERROR2: -> %O', err)
          reject(err)
          return
        }
        statsData.bufferSize = stats.size
        statsData.chunkSize = 512
        statsData.buffer = Buffer.alloc(statsData.bufferSize)
        statsData.bytesRead = 0
        resolve(statsData)
      })
    })
  }

  /**
   * Reads a file async
   *
   * @param {number} fd File descriptor
   * @param {object} sts File stats data
   * @returns {Promise} Data buffer
   */
  readFile (fd, sts) {
    const stats = sts
    return new Promise((resolve, reject) => {
      while (stats.bytesRead < stats.bufferSize) {
        if ((stats.bytesRead + stats.chunkSize) > stats.bufferSize) {
          stats.chunkSize = (stats.bufferSize - stats.bytesRead)
        }
        fs.read(fd, stats.buffer, stats.bytesRead, stats.chunkSize, stats.bytesRead, (err, bytesRead, buffer) => {
          if (err) {
            error('ERROR: Reading file -> %O', err)
            reject(err)
          }
        })
        stats.bytesRead += stats.chunkSize
      }
      resolve(stats.buffer)
    })
  }

  /**
   * Write to a file async
   *
   * @param {number} fd File descriptor
   * @param {*} buffer Data buffer to be written
   * @returns {Promise} Bytes written
   */
  writeFile (fd, buffer) {
    return new Promise((resolve, reject) => {
      fs.write(fd, buffer, (err, bytesWritten, buffer) => {
        if (err) {
          error('ERROR: Writing file -> %O', err)
          reject(err)
        }
        resolve(bytesWritten)
      })
    })
  }
}
