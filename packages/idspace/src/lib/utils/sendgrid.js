'use strict'
const sgMail = require('@sendgrid/mail')

// Debug
var debug = require('debug')('did:debug:mail')
var error = require('debug')('did:error:mail')

/**
 * Javascript Class to interact with Zenroom.
 */
module.exports = class MAIL {
  /**
   * Sends an email.
   *
   * @param {string} toEmail Email to send to
   * @param {object} attachment Attachment (JSON)
   * @param {string }templateId Template ID in Sendgrid
   * @param {object} dynamicTemplateData Metadata for the email
   * @returns {Promise} Email sent or false
   */
  sendEmail (toEmail, attachment, templateId, dynamicTemplateData) {
    return new Promise((resolve) => {
      debug('Send an email')
      const attachFile = Buffer.from(JSON.stringify(attachment))
      const msg = {
        to: toEmail,
        from: 'info@caelumlabs.com',
        templateId: templateId,
        dynamicTemplateData,
        attachments: [
          {
            content: attachFile.toString('base64'),
            filename: 'credential.txt',
            type: 'plain/text',
            disposition: 'attachment'
          }
        ]
      }

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      sgMail.send(msg)
        .then((cid) => {
          resolve()
        })
        .catch((e) => {
          error(e)
          resolve(false)
        })
    })
  }

  notifyMember (toEmail, name, pin) {
    return new Promise((resolve) => {
      const msg = {
        to: toEmail,
        from: 'info@caelumlabs.com',
        templateId: 'd-c91a646e6c4343ec8e9d4f8891b5cfdc',
        dynamicTemplateData: {
          name: name,
          pin: pin
        }
      }
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      sgMail.send(msg)
        .then(() => {
          resolve()
        })
        .catch((e) => {
          error(e)
          resolve(false)
        })
    })
  }
}
