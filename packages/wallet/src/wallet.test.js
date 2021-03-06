const Wallet = require('./wallet.js');

['fs', 'mem'].forEach((storage) => {
  const w = new Wallet('testWallet', { storage })

  test('should create Wallet class ' + storage, () => {
    expect(w.info.matrixUser).toEqual('')
  })

  test('should delete the wallet (if any remaining from the last test) ' + storage, async () => {
    const result = await w.delete()
    expect(result).toBe(true)
  })

  test('should add to credentials collection ' + storage, () => {
    w.add('credentials', { name: 'adminTest', role: 'admin' })
    w.add('credentials', { name: 'test1', role: 'user' })
    w.add('credentials', { name: 'test2', role: 'user' })
    w.add('credentials', { name: 'test3', role: 'user' })
    w.add('credentials', { name: 'test4', role: 'user' })
    w.add('credentials', { id: '5', name: 'test5', role: 'user' })
    expect(w.data.credentials[0]).toEqual({ name: 'adminTest', role: 'admin' })
    expect(w.data.credentials[1]).toEqual({ name: 'test1', role: 'user' })
  })

  test('should get the credential ' + storage, () => {
    const cred = w.get('credentials', { name: 'adminTest' })
    expect(cred).toEqual({ name: 'adminTest', role: 'admin' })
  })

  test('should get the credential by id', () => {
    const result = w.getCredentialById('5')
    expect(result.name).toEqual('test5')
  })

  test('should update the credential ' + storage, () => {
    w.update('credentials', { name: 'adminTest' }, { name: 'adminTest', role: 'superAdmin' })
    expect(w.data.credentials[0]).toEqual({ name: 'adminTest', role: 'superAdmin' })
  })

  test('should save the wallet (lock) ' + storage, async () => {
    await w.lock('myPassword0')
    expect(w.data.credentials[0]).toEqual({ name: 'adminTest', role: 'superAdmin' })
  })

  test('should load the wallet (unlock) (fs only)', async () => {
    if (storage === 'fs') {
      const w2 = new Wallet('testWallet', { storage, silent: true })
      await w2.unlock('myPassword0')
      expect(w2.data.credentials[0]).toEqual({ name: 'adminTest', role: 'superAdmin' })
    }
  })

  test('should remove the credential ' + storage, () => {
    const name = 'test3'
    w.remove('credentials', { name })
    expect(w.data.credentials[3]).toEqual({ name: 'test4', role: 'user' })
  })

  test('should remove all coincidences ' + storage, () => {
    const role = 'user'
    w.remove('credentials', { role })
    expect(w.data.credentials).toHaveLength(1)
  })

  test('Batch for ' + storage, () => {
    let batch = w.getBatch()
    expect(batch).toBe('')
    w.setBatch('wp11111')
    batch = w.getBatch()
    expect(batch).toBe('wp11111')
  })

  test('should lock ' + storage, async () => {
    const result = await w.lock('myPassword0')
    expect(result).toBe(true)
  })

  test('should not lock with the wrong password ' + storage, async () => {
    let result = await w.unlock('myPassword0')
    expect(result).toBe(true)
    w.add('credentials', { name: 'test6', role: 'user' })
    result = await w.lock('NotMyPasswordX')
    expect(result).toBe(false)
  })

  test('should NOT unlock wallet (because it does not exist) ' + storage, (done) => {
    w.delete().then(() => {
      w.unlock('myPassword0').then((response) => {
        expect(response).toBe(false)
        done()
      })
    })
  })

  test('should lock new wallet (thus creating it) ' + storage, (done) => {
    w.lock('myPassword1').then((response) => {
      expect(response).toBeDefined()
      done()
    })
  })

  test('should lock existing wallet with correct password ' + storage, (done) => {
    w.lock('myPassword1').then((response) => {
      expect(response).toBeDefined()
      done()
    })
  })

  test('should NOT unlock existing wallet with incorrect password ' + storage, (done) => {
    w.unlock('myPassword2').then((response) => {
      expect(response).toBe(false)
      done()
    })
  })

  test('should unlock wallet ' + storage, (done) => {
    w.unlock('myPassword1').then((response) => {
      expect(response).toBeDefined()
      done()
    })
  })

  test('should delete wallet ' + storage, (done) => {
    w.delete().then((response) => {
      expect(response).toBeDefined()
      done()
    })
  })
})

// Scenarios specific to filesystem
test('should lock and unlock a wallet in fs', (done) => {
  let w2
  const w1 = new Wallet('testWallet', { storage: 'fs', silent: true })
  w1.add('credentials', { name: 'adminTest', role: 'admin' })
  expect(w1.data.credentials[0]).toEqual({ name: 'adminTest', role: 'admin' })
  w1.lock('myPassword')
    .then((response) => {
      expect(response).toBeDefined()
      w2 = new Wallet('testWallet', { storage: 'fs', silent: true })
      return w2.unlock('myPassword')
    })
    .then((response) => {
      expect(w2.data.credentials[0]).toEqual({ name: 'adminTest', role: 'admin' })
      return w2.delete()
    })
    .then(() => {
      done()
    })
})

test('should create a default value', () => {
  const w1 = new Wallet('testWallet')
  expect(w1.opts.storage).toEqual('fs')
})
