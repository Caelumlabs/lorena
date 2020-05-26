const cred = require('../index')

test('Person: should set a addressLocality', () => {
  // new Person.
  const location = new cred.Location()
  location.addressLocality('Myoldtown')

  // Check Person.
  expect(location.subject['@type']).toEqual('PostalAddress')
  expect(location.subject.addressLocality).toEqual('Myoldtown')
})

test('Person: should set a addressLocality', () => {
  // new Person.
  const location = new cred.Location()
  location.streetAddress('Reina Cristina 9, ppal')
  location.addressLocality('Sitges')
  location.postalCode('08001')
  location.addressRegion('Barcelona')
  location.addressCountry('Spain')

  // Check Location.
  expect(location.subject['@type']).toEqual('PostalAddress')
  expect(location.subject.streetAddress).toEqual('Reina Cristina 9, ppal')
  expect(location.subject.addressLocality).toEqual('Sitges')
  expect(location.subject.postalCode).toEqual('08001')
  expect(location.subject.addressRegion).toEqual('Barcelona')
  expect(location.subject.addressCountry).toEqual('Spain')
})

test('Person: should set a postalCode', () => {
  // new Person.
  const location = new cred.Location()
  location.postalCode('08001')

  // Check Person.
  expect(location.subject['@type']).toEqual('PostalAddress')
  expect(location.subject.postalCode).toEqual('08001')
})

test('Person: should set a neighborhood', () => {
  // new Person.
  const location = new cred.Location()
  location.neighborhood('Myneighborhood')

  // Check Person.
  expect(location.subject['@type']).toEqual('PostalAddress')
  expect(location.subject.neighborhood).toEqual('Myneighborhood')
})
