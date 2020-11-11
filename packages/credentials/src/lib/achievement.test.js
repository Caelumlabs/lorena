const cred = require('../index')
const Crypto = require('@caelumlabs/crypto')
const crypto = new Crypto(true)

test('Achievement: should add an Achievement', () => {
  const achievement = new cred.Achievement()

  // Create a new Credential for Achievement
  achievement.title('Javascript Course')
  achievement.description('Javascript full course for developers')
  achievement.issuer('did:caelum:10001')
  achievement.url('http://test.com')
  achievement.learningAchievement('Understand Javascript')
  achievement.issuanceDate('2020-04-23 00:00:00')
  achievement.expirationDate('2020-04-23 23:59:59')

  // test.
  expect(achievement.subject['@type']).toEqual('Achievement')
  expect(achievement.subject.title).toEqual('Javascript Course')
  expect(achievement.subject.description).toEqual('Javascript full course for developers')
  expect(achievement.subject.issuer).toEqual('did:caelum:10001')
  expect(achievement.subject.url).toEqual('http://test.com')
  expect(achievement.subject.learningAchievement.title).toEqual('Understand Javascript')
  expect(achievement.subject.issuanceDate).toEqual('2020-04-23 00:00:00')
  expect(achievement.subject.expirationDate).toEqual('2020-04-23 23:59:59')
})

test('Achievement: should add a subject to the achievement', () => {
  const agent = new cred.Person('did:caelum:1001')
  const achievement = new cred.Achievement('did:caelum:1000')
  achievement.title('Task1')
  achievement.description('Description1')
  achievement.agent(agent)
  expect(achievement.subject.agent['@type']).toEqual('Person')
  expect(achievement.subject.agent.id).toEqual('did:caelum:1001')
})

test('Achievement: should load an achievement', () => {
  const agent = new cred.Person('did:caelum:1001')
  const achievement = new cred.Achievement('did:caelum:1000')
  achievement.title('Task1')
  achievement.description('Description1')
  achievement.agent(agent)

  const achievementNew = new cred.Achievement(achievement.subject)
  expect(achievement.subject).toEqual(achievementNew.subject)
})

test('Achievement: should add a location to the achievement', () => {
  const achievement = new cred.Achievement()
  achievement.title('Task1')

  const loc = new cred.Location()
  loc.addressLocality('Mytown')
  loc.postalCode('08000')
  achievement.location(loc)
  expect(achievement.subject.title).toEqual('Task1')
  expect(achievement.subject.location['@type']).toEqual('PostalAddress')
  expect(achievement.subject.location.addressLocality).toEqual('Mytown')
  expect(achievement.subject.location.postalCode).toEqual('08000')
})

test('Achievement: should issue a new achievement', async () => {
  const achievement = new cred.Achievement('did:caelum:10001')
  achievement.issuanceDate('2020-04-23 00:00:00')
  achievement.expirationDate('2020-04-23 23:59:59')
  achievement.course('did:caelum:10025')

  const agent = new cred.Person('did:caelum:1001')
  agent.name('John Smith')
  agent.email('john@smith.io')
  achievement.agent(agent)

  expect(achievement.subject.agent['@type']).toEqual('Person')
  expect(achievement.subject.agent.name).toEqual('John Smith')
  expect(achievement.subject['@type']).toEqual('Achievement')
  expect(achievement.subject.id).toEqual('did:caelum:10001')
  expect(achievement.subject.issuanceDate).toEqual('2020-04-23 00:00:00')
  expect(achievement.subject.expirationDate).toEqual('2020-04-23 23:59:59')

  await crypto.init()
  const issuer = 'did:caelum:10000'
  const signer = crypto.keyPair()
  const serializedCredential = await cred.signCredential(achievement, signer, issuer)
  const result = cred.verifyCredential(serializedCredential, signer.address)
  expect(result.check).toEqual(true)
  expect(result.credential.issuer).toEqual(issuer)
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.issuanceDate).toBeDefined()
  expect(result.credential.proof.signature).toBeDefined()
})
