/* eslint-disable no-async-promise-executor */
'use strict'

// Debug
var debug = require('debug')('did:debug:sub')
/**
 * Functions dealing with gas balance.
 */
module.exports = class Gas {
  /**
   * Balance of Gas
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} address Address to send gas to
   * @returns {*} balance and nonce
   */
  async addrState (exec, keypair, address) {
    return new Promise(async (resolve) => {
      const addressTo = (address === false) ? keypair.address : address
      const { nonce, data: balance } = await exec.api.query.system.account(addressTo)
      resolve({ balance, nonce })
    })
  }

  /**
   * Transfer Gas
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} addrTo Address to send gas to
   * @param {*} amount Amount of gas
   * @returns {Promise} of sending gas
   */
  async transferGas (exec, keypair, addrTo, amount) {
    return new Promise(async (resolve) => {
      const unsub = await exec.api.tx.balances
        .transfer(addrTo, amount)
        .signAndSend(keypair, (result) => {
          if (result.status.isInBlock) {
            debug(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            debug(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            resolve(true)
            unsub()
          }
        })
    })
  }

  /**
   * Transfer Gas without paying fees
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} addrTo Address to send gas to
   * @param {*} amount Amount of gas
   * @returns {Promise} of sending gas
   */
  async transferGasNoFees (exec, keypair, addrTo, amount) {
    return new Promise(async (resolve) => {
      const unsub = await exec.api.tx.balances
        .transferNoFees(addrTo, amount)
        .signAndSend(keypair, (result) => {
          if (result.status.isInBlock) {
            debug(`Transaction included at blockHash ${result.status.asInBlock}`)
          } else if (result.status.isFinalized) {
            debug(`Transaction finalized at blockHash ${result.status.asFinalized}`)
            resolve(true)
            unsub()
          }
        })
    })
  }

  /**
   * Transfer All Gas
   *
   * @param {object} exec Executor class.
   * @param {object} keypair Account's keypair
   * @param {string} addrTo Address to send gas to
   * @returns {Promise} of sending gas
   */
  async transferAllGas (exec, keypair, addrTo) {
    const current = await this.addrState(exec, keypair, false)
    const amount = current.balance.free
    const info = await exec.api.tx.balances.transfer(addrTo, amount).paymentInfo(keypair)
    if (info.partialFee.sub(amount) > 0) {
      return this.transferGasNoFees(exec, keypair, addrTo, info.partialFee.sub(amount))
    } 
    return this.transferGasNoFees(exec, keypair, addrTo, amount.sub(info.partialFee))
  }
}
