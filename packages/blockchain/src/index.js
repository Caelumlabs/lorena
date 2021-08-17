'use strict'

/**
 * Javascript Class to interact with Database.
 */
module.exports = class BlockchainInterface {
  constructor () {
    if (!this.connect) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `connect`!')
    } else if (!this.setKeyring) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `setKeyring`!')
    } else if (!this.disconnect) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `disconnect`!')
    } else if (!this.getMetadata) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getMetdata`!')
    } else if (!this.getKeyring) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getKeyring`!')
    } else if (!this.getAddress) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getAddress`!')
    } else if (!this.addrState) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `addrState`!')
    } else if (!this.transferTokens) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `transferTokens`!')
    } else if (!this.registerDid) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `registerDid`!')
    } else if (!this.setStorageAddress) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `setStorageAddress`!')
    } else if (!this.getActualDidKey) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getActualDidKey`!')
    } else if (!this.getStorageAddressHash) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getStorageAddressHash`!')
    } else if (!this.setKey) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `setKey`!')
    } else if (!this.changeOwner) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `changeOwner`!')
    } else if (!this.putHash) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `putHash`!')
    } else if (!this.revokeHash) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `revokeHash`!')
    } else if (!this.getDidData) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getDidData`!')
    } else if (!this.getOwnerFromDid) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getOwnerFromDid`!')
    } else if (!this.getDidFromOwner) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getDidFromOwner`!')
    } else if (!this.getActualDidKey) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getActualDidKey`!')
    } else if (!this.getActualDidKeyType) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getActualDidKeyType`!')
    } else if (!this.getStorageAddressHash) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getStorageAddressHash`!')
    } else if (!this.addCertificate) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `addCertificate`!')
    } else if (!this.revokeCertificate) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `revokeCertificate`!')
    } else if (!this.getCertificates) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getCIDs`!')
    } else if (!this.getValidCertificates) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getValidCIDs`!')
    } else if (!this.getCertificateByKey) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getCIDByKey`!')
    } else if (!this.getCertificatesByDID) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getCIDsByDID`!')
    } else if (!this.startProcess) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `startProcess`!')
    } else if (!this.startSubprocess) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `startSubprocess`!')
    } else if (!this.startStep) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `startStep`!')
    } else if (!this.addDocument) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `addDocument`!')
    } else if (!this.addAttachment) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `addAttachment`!')
    } else if (!this.pathTo) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `pathTo`!')
    } else if (!this.getFullProcessTree) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getFullProcessTree`!')
    } else if (!this.createToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `createToken`!')
    } else if (!this.destroyToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `destroyToken`!')
    } else if (!this.mintToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `mintToken`!')
    } else if (!this.burnToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `burnToken`!')
    } else if (!this.transferToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `transferToken`!')
    } else if (!this.transferTokenKeepAlive) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `transferTokenKeepAlive`!')
    } else if (!this.freezeAccountForToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `freezeAccountForToken`!')
    } else if (!this.unfreezeAccountForToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `unfreezeAccountForToken`!')
    } else if (!this.freezeToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `freezeToken`!')
    } else if (!this.unfreezeToken) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `unfreezeToken`!')
    } else if (!this.transferTokenOwnership) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `transferTokenOwnership`!')
    } else if (!this.setTokenMetadata) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `setTokenMetadata`!')
    } else if (!this.clearTokenMetadata) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `clearTokenMetadata`!')
    } else if (!this.getAccountTokenData) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getAccountTokenData`!')
    } else if (!this.getTokenDetails) {
      /* istanbul ignore next */
      throw new Error('Blockchain must have function `getTokenDetails`!')
    }
  }
}
