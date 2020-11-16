const cred = require('../index')
const Crypto = require('@caelumlabs/crypto')
const crypto = new Crypto(true)

test('Organization: should add a name', () => {
  const organization = new cred.Organization('did:lor:lab:1000')
  organization.name('Caelum Labs')
  expect(organization.subject.name).toEqual('Caelum Labs')
  expect(organization.subject['@type']).toEqual('Organization')
})

test('Organization: should have full info', () => {
  const organization = new cred.Organization()
  organization.name('Caelum Labs')
  organization.legalName('Caelum Innovation SL')
  organization.taxID('B67101519')
  organization.url('https://caelumlabs.com')
  organization.foundingDate('2018-05-12')

  expect(organization.subject['@type']).toEqual('Organization')
  expect(organization.subject.name).toEqual('Caelum Labs')
  expect(organization.subject.legalName).toEqual('Caelum Innovation SL')
  expect(organization.subject.taxID).toEqual('B67101519')
  expect(organization.subject.url).toEqual('https://caelumlabs.com')
  expect(organization.subject.foundingDate).toEqual('2018-05-12')

  const location = new cred.Location()
  location.streetAddress('Reina Cristina 9, principal')
  location.addressLocality('Sitges')
  location.postalCode('08001')
  location.addressRegion('Barcelona')
  location.addressCountry('Spain')
  organization.location(location)

  expect(organization.subject.location['@type']).toEqual('PostalAddress')
  expect(organization.subject.location.streetAddress).toEqual('Reina Cristina 9, principal')
  expect(organization.subject.location.addressLocality).toEqual('Sitges')
  expect(organization.subject.location.postalCode).toEqual('08001')
  expect(organization.subject.location.addressRegion).toEqual('Barcelona')
  expect(organization.subject.location.addressCountry).toEqual('Spain')
})

test('Organization: should add a role', () => {
  // new Person.
  const admin = new cred.Person('did:lor:lab:1001')
  admin.name('John Smith')

  // New Organization and add member as admin.
  const organization = new cred.Organization('did:lor:lab:1000')
  organization.name('Caelum Labs')
  organization.member('admin', admin)

  expect(organization.subject.name).toEqual('Caelum Labs')
  expect(organization.subject['@type']).toEqual('Organization')
  expect(organization.subject.member.roleName).toEqual('admin')

  expect(organization.subject.member.member['@type']).toEqual('Person')
  expect(organization.subject.member.member.name).toEqual('John Smith')
  expect(organization.subject.member.member.id).toEqual('did:lor:lab:1001')

  const developer = new cred.Person('did:lor:lab:1001')
  developer.fullName('John', 'Smith', 'Matrix')
  organization.member('developer', developer)

  expect(organization.subject.member['@type']).toEqual('OrganizationRole')
  expect(organization.subject.member.roleName).toEqual('developer')
  expect(organization.subject.member.member['@type']).toEqual('Person')
  expect(organization.subject.member.member.givenName).toEqual('John')
  expect(organization.subject.member.member.familyName).toEqual('Smith')
  expect(organization.subject.member.member.additionalName).toEqual('Matrix')
})

test('Sign a MemberOf credential', async () => {
  const issuer = 'did:caelum:10000'
  await crypto.init()
  const signer = crypto.keyPair()

  const organization = new cred.Organization(issuer)
  organization.name('Caelum Labs')
  const developer = new cred.Person()
  developer.fullName('John', 'Smith', 'Matrix')
  organization.member('member', developer, {
    name: 'Member',
    location: 'Barcelona',
    department: 'Technology',
    document: '',
    threshold: 0
  })
  const serializedCredential = await organization.sign(signer, issuer)
  const result = cred.verifyCredential(serializedCredential, signer.address)
  expect(result.check).toEqual(true)
  expect(result.credential.issuer).toEqual(issuer)
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.proof.signature).toBeDefined()
})
