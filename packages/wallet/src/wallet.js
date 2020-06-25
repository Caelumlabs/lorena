const Crypto = require('@caelumlabs/crypto')
const fsPromises = require('fs').promises
const home = require('os').homedir
const debug = require('debug')('did:debug:wallet-fs')
debug.enabled = true

module.exports = class Wallet {
  constructor (username, opts) {
    this.opts = opts || { storage: 'fs' }
    if (this.opts.storage === 'mem') {
      this.storage = {}
    }
    this.name = username
    this.directoryPath = `${home()}/.lorena/wallets/${username}`
    this.crypto = new Crypto()
    this.changed = false
    // info
    this.info = {
      matrixUser: '',
      matrixPass: '',
      keyPair: {},
      person: {}
    }
    // data
    this.data = {
      credentials: [],
      links: [],
      tasks: []
    }
  }

  async exist () {
    if (this.opts.storage === 'fs') {
      const result = await fsPromises.stat(this.directoryPath).catch(() => {
        return false
      })
      return !result ? result : result.isDirectory()
    } else /* istanbul ignore next */
    if (this.opts.storage === 'mem') {
      return !!this.storage[this.directoryPath]
    }
  }

  async read (source) {
    if (this.opts.storage === 'fs') {
      try {
        const data = await fsPromises.readFile(`${this.directoryPath}/${source}`, 'utf-8')
        return data
      } catch (error) {
        throw new Error(error)
      }
    } else /* istanbul ignore next */
    if (this.opts.storage === 'mem') {
      return this.storage[this.directoryPath][source]
    }
  }

  async write (source, data) {
    if (this.opts.storage === 'fs') {
      try {
        await fsPromises.mkdir(this.directoryPath, { recursive: true })
        await fsPromises.writeFile(`${this.directoryPath}/${source}`, data)
        return true
      } catch (error) {
        /* istanbul ignore next */
        return false
      }
    } else /* istanbul ignore next */
    if (this.opts.storage === 'mem') {
      if (!this.storage[this.directoryPath]) {
        this.storage[this.directoryPath] = {}
      }
      this.storage[this.directoryPath][source] = data
      return true
    }
  }

  /**
   * Unlock the wallet by decrypting with the supplied password
   *
   * @param {string} password Pass
   * @param {boolean} onlyCheck Only check if the files can be unlocked
   * @returns {boolean} whether the password worked
   */
  async unlock (password, onlyCheck = false) {
    try {
      const infoDecrypted = this.crypto.decryptObj(password, await this.read('info'))
      const dataDecrypted = this.crypto.decryptObj(password, await this.read('data'))
      const batch = await this.read('batch')
      if (!onlyCheck) {
        this.info = infoDecrypted
        this.data = dataDecrypted
        this.batch = batch
      }
      return true
    } catch (_e) {
      return false
    }
  }

  /**
   * Encrypt and save configuration.
   *
   * @param {string} password Password to decrypt configuration
   * @returns {boolean} success
   */
  async lock (password) {
    try {
      // if it already exists, unlock it.
      if (await this.exist()) {
        if (!await this.unlock(password, true)) {
          return false
        }
      }

      // Otherwise, we're creating it for the first time.
      await this.write('info', this.crypto.encryptObj(password, this.info))
      await this.write('data', this.crypto.encryptObj(password, this.data))
      await this.write('batch', this.batch)
      this.changed = false
      return true
    } catch (_e) {
      /* istanbul ignore next */
      return false
    }
  }

  /**
   * Delete the wallet.
   *
   * @returns {boolean} success
   */
  async delete () {
    try {
      // if it exists, delete it
      if (await this.exist()) {
        if (this.opts.storage === 'fs') {
          await fsPromises.rmdir(this.directoryPath, { recursive: true })
        } else /* istanbul ignore next */
        if (this.opts.storage === 'mem') {
          this.storage = {}
        }
      }
      // now it doesn't exist regardless
      return true
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  }

  get (collection, where) {
    let result = false
    this.data[collection].filter((item, index) => {
      Object.entries(where).forEach((searchTerm) => {
        if (item[searchTerm[0]] === searchTerm[1]) {
          result = this.data[collection][index]
        }
      })
    })
    return result
  }

  add (collection, value) {
    this.changed = true
    /* istanbul ignore if */
    if (typeof collection !== 'string') throw new Error('Collection should be a String')
    /* istanbul ignore if */
    if (typeof value !== 'object') throw new Error('Value should be an Object')
    /* istanbul ignore if */
    if (!this.data[collection]) this.data[collection] = []
    this.data[collection].push(value)
  }

  update (collection, where, value) {
    this.changed = true
    /* istanbul ignore if */
    if (typeof collection !== 'string') throw new Error('Collection should be a String')
    /* istanbul ignore if */
    if (typeof where !== 'object') throw new Error('Value should be an Object')
    /* istanbul ignore if */
    if (typeof value !== 'object') throw new Error('Value should be an Object')
    const found = this.data[collection].filter((item, index) => {
      let founded
      Object.entries(where).forEach((searchTerm) => {
        if (item[searchTerm[0]] === searchTerm[1]) {
          this.data[collection][index] = { ...this.data[collection][index], ...value }
          founded = true
        } else {
          founded = false
        }
      })
      return founded
    })
    return found.length > 0
  }

  remove (collection, where) {
    this.changed = true
    if (typeof collection !== 'string') throw new Error('Collection should be a String')
    if (typeof where !== 'object') throw new Error('Value should be an Object')
    const found = this.data[collection].filter((item) => {
      let founded
      Object.entries(where).forEach((searchTerm) => {
        if (item[searchTerm[0]] === searchTerm[1]) {
          founded = true
        } else {
          founded = false
        }
      })
      return !founded
    })
    this.data[collection] = found
    return found
  }

  setBatch (batch) {
    this.changed = true
    this.data.batch = batch
  }

  getBatch () {
    return this.data.batch || ''
  }
}
