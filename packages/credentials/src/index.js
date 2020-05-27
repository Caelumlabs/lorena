const Organization = require('./lib/organization')
const Person = require('./lib/person')
const Action = require('./lib/action')
const Location = require('./lib/location')
const Achievement = require('./lib/achievement')
const DidDoc = require('./lib/diddoc')
const signCredential = require('./lib/signCredential')

module.exports = { Organization, Person, Action, Location, Achievement, DidDoc, signCredential }
