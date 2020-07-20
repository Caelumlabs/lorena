const cred = require('../index')

test('Action: should add an action', () => {
  const action = new cred.Action('did:lor:lab:1001', 20)
  action.name('Do a Task')
  action.description('Description of the task')
  expect(action.subject['@type']).toEqual('Action')
  expect(action.subject.id).toEqual('did:lor:lab:1001,actionId=20')
  expect(action.subject.name).toEqual('Do a Task')
  expect(action.subject.description).toEqual('Description of the task')
})

test('Action: should add an agent to the action', () => {
  const agent = new cred.Person('did:lor:lab:1001')
  const action = new cred.Action('did:lor:lab:1000')
  action.name('Task1')
  action.description('Description1')
  action.agent(agent)
  expect(action.subject.description).toEqual('Description1')
})

test('Action: should add extra fields', () => {
  const action = new cred.Action('did:lor:lab:1000')
  action.extra({ extra1: '1', extra2: 2 })
  expect(action.subject.extra.extra1).toEqual('1')
  expect(action.subject.extra.extra2).toEqual(2)
})

test('Action: should add a location to the action', () => {
  const action = new cred.Action('did:lor:lab:1000', 20)
  action.name('Task1')
  const loc = new cred.Location()
  loc.addressLocality('Mytown')
  loc.postalCode('08000')
  action.location(loc)
  expect(action.subject.name).toEqual('Task1')
  expect(action.subject.location['@type']).toEqual('PostalAddress')
  expect(action.subject.location.addressLocality).toEqual('Mytown')
  expect(action.subject.location.postalCode).toEqual('08000')
})

test('Action: should add a startTime and endTime', () => {
  const action = new cred.Action('did:lor:lab:1000', 20)
  action.name('Task1')
  action.startTime('2020-04-23 00:00:00')
  action.endTime('2020-04-23 23:59:59')
  expect(action.subject.startTime).toEqual('2020-04-23 00:00:00')
  expect(action.subject.endTime).toEqual('2020-04-23 23:59:59')
})
