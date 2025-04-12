import { compareJSON } from './compareJSON'

describe('compareJSON', () => {
  test('should detect added properties', () => {
    const obj1 = { name: 'John' }
    const obj2 = { name: 'John', age: 30 }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['age'],
      type: 'added',
      value: 30
    }])
  })

  test('should detect removed properties', () => {
    const obj1 = { name: 'John', age: 30 }
    const obj2 = { name: 'John' }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['age'],
      type: 'removed',
      value: 30
    }])
  })

  test('should detect modified values', () => {
    const obj1 = { name: 'John', age: 30 }
    const obj2 = { name: 'John', age: 31 }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['age'],
      type: 'modified',
      oldValue: 30,
      newValue: 31
    }])
  })

  test('should handle nested objects', () => {
    const obj1 = { 
      person: { 
        name: 'John',
        address: { city: 'New York' }
      }
    }
    const obj2 = { 
      person: { 
        name: 'John',
        address: { city: 'Boston' }
      }
    }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['person', 'address', 'city'],
      type: 'modified',
      oldValue: 'New York',
      newValue: 'Boston'
    }])
  })

  test('should handle arrays', () => {
    const obj1 = { items: [1, 2, 3] }
    const obj2 = { items: [1, 2, 4] }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['items', 2],
      type: 'modified',
      oldValue: 3,
      newValue: 4
    }])
  })

  test('should handle array length changes', () => {
    const obj1 = { items: [1, 2] }
    const obj2 = { items: [1, 2, 3] }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['items', 2],
      type: 'added',
      value: 3
    }])
  })

  test('should handle objects in arrays', () => {
    const obj1 = { 
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]
    }
    const obj2 = { 
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Janet' }
      ]
    }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['users', 1, 'name'],
      type: 'modified',
      oldValue: 'Jane',
      newValue: 'Janet'
    }])
  })

  test('should handle null and undefined values', () => {
    const obj1 = { name: 'John', age: null }
    const obj2 = { name: 'John', age: 30 }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['age'],
      type: 'modified',
      oldValue: null,
      newValue: 30
    }])
  })

  test('should handle type changes', () => {
    const obj1 = { value: "123" }
    const obj2 = { value: 123 }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['value'],
      type: 'modified',
      oldValue: "123",
      newValue: 123
    }])
  })

  test('should handle empty objects', () => {
    const obj1 = { data: {} }
    const obj2 = { data: { name: 'John' } }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([{
      path: ['data', 'name'],
      type: 'added',
      value: 'John'
    }])
  })

  test('should handle key name changes', () => {
    const obj1 = { firstName: 'John' }
    const obj2 = { givenName: 'John' }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([
      {
        path: ['firstName'],
        type: 'removed',
        value: 'John'
      },
      {
        path: ['givenName'],
        type: 'added',
        value: 'John'
      }
    ])
  })

  test('should handle multiple key changes', () => {
    const obj1 = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30
    }
    const obj2 = {
      givenName: 'John',
      familyName: 'Doe',
      age: 30
    }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([
      {
        path: ['familyName'],
        type: 'added',
        value: 'Doe'
      },
      {
        path: ['firstName'],
        type: 'removed',
        value: 'John'
      },
      {
        path: ['givenName'],
        type: 'added',
        value: 'John'
      },
      {
        path: ['lastName'],
        type: 'removed',
        value: 'Doe'
      }
    ])
  })

  test('should handle nested key changes', () => {
    const obj1 = {
      person: {
        firstName: 'John',
        contact: {
          phoneNumber: '123-456-7890'
        }
      }
    }
    const obj2 = {
      person: {
        givenName: 'John',
        contact: {
          phone: '123-456-7890'
        }
      }
    }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([
      {
        path: ['person', 'contact', 'phone'],
        type: 'added',
        value: '123-456-7890'
      },
      {
        path: ['person', 'contact', 'phoneNumber'],
        type: 'removed',
        value: '123-456-7890'
      },
      {
        path: ['person', 'firstName'],
        type: 'removed',
        value: 'John'
      },
      {
        path: ['person', 'givenName'],
        type: 'added',
        value: 'John'
      }
    ])
  })

  test('should handle key changes in arrays of objects', () => {
    const obj1 = {
      users: [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' }
      ]
    }
    const obj2 = {
      users: [
        { givenName: 'John', familyName: 'Doe' },
        { givenName: 'Jane', familyName: 'Smith' }
      ]
    }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([
      {
        path: ['users', 0, 'familyName'],
        type: 'added',
        value: 'Doe'
      },
      {
        path: ['users', 0, 'firstName'],
        type: 'removed',
        value: 'John'
      },
      {
        path: ['users', 0, 'givenName'],
        type: 'added',
        value: 'John'
      },
      {
        path: ['users', 0, 'lastName'],
        type: 'removed',
        value: 'Doe'
      },
      {
        path: ['users', 1, 'familyName'],
        type: 'added',
        value: 'Smith'
      },
      {
        path: ['users', 1, 'firstName'],
        type: 'removed',
        value: 'Jane'
      },
      {
        path: ['users', 1, 'givenName'],
        type: 'added',
        value: 'Jane'
      },
      {
        path: ['users', 1, 'lastName'],
        type: 'removed',
        value: 'Smith'
      }
    ])
  })

  test('should handle mixed key changes and value modifications', () => {
    const obj1 = {
      person: {
        firstName: 'John',
        age: 30,
        contact: {
          phoneNumber: '123-456-7890'
        }
      }
    }
    const obj2 = {
      person: {
        givenName: 'Johnny',
        age: 31,
        contact: {
          phone: '123-456-7890'
        }
      }
    }
    const differences = compareJSON(obj1, obj2)
    
    expect(differences).toEqual([
      {
        path: ['person', 'age'],
        type: 'modified',
        oldValue: 30,
        newValue: 31
      },
      {
        path: ['person', 'contact', 'phone'],
        type: 'added',
        value: '123-456-7890'
      },
      {
        path: ['person', 'contact', 'phoneNumber'],
        type: 'removed',
        value: '123-456-7890'
      },
      {
        path: ['person', 'firstName'],
        type: 'removed',
        value: 'John'
      },
      {
        path: ['person', 'givenName'],
        type: 'added',
        value: 'Johnny'
      }
    ])
  })
}) 