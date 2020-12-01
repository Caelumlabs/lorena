const Capacity = require('./lib/capacity')
const Organization = require('./lib/organization')
const Person = require('./lib/person')
const Action = require('./lib/action')
const Location = require('./lib/location')
const Achievement = require('./lib/achievement')
const DidDoc = require('./lib/diddoc')
const { signCredential, verifyCredential, keyPair } = require('./lib/signCredential')

module.exports = { Capacity, Organization, Person, Action, Location, Achievement, DidDoc, signCredential, verifyCredential, keyPair }
