const cred = require('../index')

test('Person: should set a name', () => {
  // new Person.
  const person = new cred.Person('did:lor:lab:1001')
  person.name('John Smith')

  // Check Person.
  expect(person.subject['@type']).toEqual('Person')
  expect(person.subject.id).toEqual('did:lor:lab:1001')
  expect(person.subject.name).toEqual('John Smith')
})

test('Person: should set a Full name', () => {
  // new Person.
  const person = new cred.Person('did:lor:lab:1001')
  person.fullName('John', 'Smith', 'Matrix')
  expect(person.subject['@type']).toEqual('Person')
  expect(person.subject.givenName).toEqual('John')
  expect(person.subject.familyName).toEqual('Smith')
  expect(person.subject.additionalName).toEqual('Matrix')
})

test('Person: should set a national ID', () => {
  const person = new cred.Person('did:lor:lab:1001')
  person.nationalID('11223344A', 'Documento Nacional de Identidad, España')
  expect(person.subject.identifier['@type']).toEqual('PropertyValue')
  expect(person.subject.identifier.propertyID).toEqual('Documento Nacional de Identidad, España')
  expect(person.subject.identifier.value).toEqual('11223344A')
})

test('Person: should set Phone number', () => {
  // new Person.
  const person = new cred.Person('did:lor:lab:1001')
  person.telephone('555 111 111')
  expect(person.subject.telephone).toEqual('555 111 111')
})

test('Person: should set Email', () => {
  // new Person.
  const person = new cred.Person()
  person.email('test@example.com')
  expect(person.subject.email).toEqual('test@example.com')
})

test('Person: should set Location', () => {
  // new Person.
  const location = new cred.Location()
  location.postalCode('08001')
  const person = new cred.Person()
  person.name('Captain Hook')
  person.location(location)
  expect(person.subject.location['@type']).toEqual('PostalAddress')
  expect(person.subject.location.postalCode).toEqual('08001')
})

test('Person: should load a previous credential', async () => {
  const person = new cred.Person('did:lor:1')
  person.name('Captain Hook')
  expect(person.subject.name).toEqual('Captain Hook')

  const captain = new cred.Person(person.subject)
  expect(captain.subject.name).toEqual('Captain Hook')
})

test('Person: should fail to load an invalid credential', async () => {
  const location = new cred.Location()
  location.postalCode('08001')

  const captain = new cred.Person(location.subject)
  expect(captain.subject).toEqual(false)
})
