'use strict'

/**
 * Javascript Class to interact with Database.
 */
module.exports = class DBInterface {
  constructor () {
    if (!this.init) {
      /* istanbul ignore next */
      throw new Error('DataBase must have function `init`!')
    } else if (!this.close) {
      /* istanbul ignore next */
      throw new Error('DataBase must have function `close`!')
    } else if (!this.set) {
      /* istanbul ignore next */
      throw new Error('DataBase must have function `set`!')
    } else if (!this.get) {
      /* istanbul ignore next */
      throw new Error('DataBase must have function `get`!')
    } else {
      // console.log('Database constructed correctly.')
    }
  }
}
