const assertionController = {
  '@context': 'https://w3id.org/security/v2',
  id: 'did:lor:issuer12345',
  // actual keys are going to be added in the test suite before() block
  assertionMethod: [],
  authentication: []
}
module.exports = assertionController
