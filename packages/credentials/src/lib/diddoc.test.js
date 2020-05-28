const cred = require('../index')

test('DidDocument: should add a diddoc', () => {
  const diddoc = new cred.DidDoc('did:lor:lab:1001')
  expect(diddoc.subject['@context']).toEqual('https://www.w3.org/ns/did/v1')
  expect(diddoc.subject.did).toEqual('did:lor:lab:1001')
})
