# Lorena DID Resolver

[![Build Status](https://travis-ci.com/lorena-ssi/did-resolver.svg?branch=master)](https://travis-ci.com/lorena-ssi/did-resolver)
[![Coverage Status](https://coveralls.io/repos/github/lorena-ssi/did-resolver/badge.svg?branch=master)](https://coveralls.io/github/lorena-ssi/did-resolver?branch=master&service=github)

Resolve DID Documents from DIDs in the Lorena namespace.  This is is a plug-in for the [Decentralized Identity Foundation](https://identity.foundation) [did-resolver](https://www.npmjs.com/package/did-resolver).

## Network configurations (static data)
There are two static methods (no blockchain calls) which are useful for retrieving endpoints for different Lorena networks:

```javascript
getInfoForNetwork('labdev')
getInfoForDid('did:lor:labdev:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX')
```
... and both return the same data:
```javascript
{ "type": "substrate", "blockchainEndpoint": "wss://labdev.substrate.lorena.tech", "matrixEndpoint": "https://labdev.matrix.lorena.tech"}
```

## DID Resolver (retrieve DID Document from blockchain data)
The Lorena DID resolver exposes a function called `getResolver` which will return an object containing one of these key/value pairs.
```js
import { Resolver } from 'did-resolver'
import LorenaDidResolver from '@lorena-ssi/did-resolver'

// returns an object of { methodName: resolveFunction}
lorResolver = LorenaDidResolver.getResolver()

// If you are using only one method you can simply pass the result of `getResolver()` into the constructor
const resolver = new Resolver(lorResolver)
```

The resolver presents a simple `resolve()` function that returns a ES6 Promise returning the DID document.

```js
resolver.resolve('did:lor:and:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX/some/path#fragment=123').then(doc => console.log)

// You can also use ES7 async/await syntax
const doc = await resolver.resolve('did:lor:and:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX/some/path#fragment=123')
```

Outside of the standard `resolve()` method, LorenaDidResolver also provides a simple method to retrieve the public key for a DID, whether stored directly on the blockchain, in a DID Document, or through IPLD.

```js
const pubKey = LorenaDidResolver.getPublicKeyForDid('did:lor:maxtest:2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX')

```
## License

MIT
