var express = require('express')
var debug = require('debug')('server:health')

module.exports = class HealthChecker {
  constructor (didInstance, port) {
    this.app = express()
    this.didInstance = didInstance
    this.port = port
  }

  refresh () {
    this.app.set('DidInfo', this.didInstance.context.info.did)
    this.app.set('NetworkOptions', this.didInstance.options.network)
    this.app.set('DidType', this.didInstance.context.info.didType)
    this.app.set('Domain', this.didInstance.options.domain)
    this.app.set('MatrixUser', this.didInstance.context.info.matrixUser)
    this.app.set('TxnId', this.didInstance.context.matrix.txnId)
  }

  init () {
    this.app.set('port', this.port || 8080)

    this.refresh()

    this.app.get('/', function (req, res) {
      res.send('Health Checker initialized')
    })

    this.app.get('/did-info', (req, res) => {
      const didInfo = req.app.get('DidInfo')
      res.send(JSON.stringify(didInfo))
    })

    this.app.get('/network-info', (req, res) => {
      const networkOptions = res.app.get('NetworkOptions')
      res.send(JSON.stringify(networkOptions))
    })

    this.app.get('/domain', (req, res) => {
      const domain = res.app.get('Domain')
      res.send(JSON.stringify(domain))
    })

    this.app.get('/did-type', (req, res) => {
      const didType = res.app.get('DidType')
      res.send(JSON.stringify(didType))
    })

    this.app.get('/matrix-user', (req, res) => {
      const matrixUser = res.app.get('MatrixUser')
      res.send(JSON.stringify(matrixUser))
    })

    this.app.get('/matrix-txnid', (req, res) => {
      const txnId = res.app.get('TxnId')
      res.send(JSON.stringify(txnId))
    })
  }

  listen () {
    const port = this.app.get('port')
    this.app.listen(port, () => {
      debug('Health Checker listening on port: ', port)
    })
  }
}
