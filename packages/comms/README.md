# matrix-lib

`matrix-lib` is a caelum api for matrix connection used in `Lorena SSI`.

[![NPM Status](https://img.shields.io/npm/v/@caelumlabs/comms.svg?style=flat)](https://www.npmjs.com/package/@caelumlabs/comms)
[![Build Status](https://travis-ci.org/caelumlabs/lorena.svg?branch=master)](https://travis-ci.org/caelumlabs/comms)
[![Coverage Status](https://coveralls.io/repos/github/Caelumlabs/lorena/badge.svg?branch=master)](https://coveralls.io/github/Caelumlabs/lorena?branch=master)

## Installation

```bash
npm @lorena-ssi/matrix-lib
```

## Getting Started

```javascript
const Comms = require('@caelumlabs/comms')
// Creating class Matrix with parameter `homeserver`
const matrix = new Comms('https://matrix.org')
// Check if user exists
if ( (await matrix.available(username)) ) {
    // Registering to matrix `homeserver` with `username` and `password`
    const primaryUser = await matrix.register('username', 'password')
    // Connecting to account with username `username` and password `password`
    matrix.connect(username, password)
        .then((res)=>{console.log("Connected:", res)})
        .catch((e)=>{console.log("Error:", e)})
    // Read events: If argument=='' then all history events are received
    matrix.events('')
        .then((a,b)=>{console.log("Correct:", a)})
        .catch((e)=>{console.log("Error in events:", e)})
}
```
