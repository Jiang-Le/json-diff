import { findLineNumber } from './findLineNumber'

describe('findLineNumber', () => {
  test('should find line number for top-level property', () => {
    const json = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`
    const path = ['age']
    
    expect(findLineNumber(json, path)).toEqual([3])
  })

  test('should find line number for nested object property', () => {
    const json = `{
  "person": {
    "name": "John",
    "address": {
      "city": "New York",
      "country": "USA"
    }
  }
}`
    const path = ['person', 'address', 'city']
    
    expect(findLineNumber(json, path)).toEqual([5])
  })

  test('should find line number for array index', () => {
    const json = `{
  "items": [
    "apple",
    "banana",
    "orange"
  ]
}`
    const path = ['items', 1]
    
    expect(findLineNumber(json, path)).toEqual([4])
  })

  test('should find line numbers for object in array', () => {
    const json = `{
  "users": [
    {
      "id": 1,
      "name": "John"
    },
    {
      "id": 2,
      "name": "Jane"
    }
  ]
}`
    const path = ['users', 1, 'name']
    
    expect(findLineNumber(json, path)).toEqual([9])
  })

  test('should find line numbers for multi-line object/array', () => {
    const json = `{
  "data": {
    "items": [
      {
        "id": 1,
        "details": {
          "color": "red",
          "size": "large"
        }
      }
    ]
  }
}`
    const path = ['data', 'items', 0, 'details']
    
    // 应该返回整个 details 对象的所有行
    expect(findLineNumber(json, path)).toEqual([6, 7, 8, 9])
  })

  test('should handle empty objects and arrays', () => {
    const json = `{
  "emptyObject": {},
  "emptyArray": [],
  "nested": {
    "empty": {}
  }
}`
    
    expect(findLineNumber(json, ['emptyObject'])).toEqual([2])
    expect(findLineNumber(json, ['emptyArray'])).toEqual([3])
    expect(findLineNumber(json, ['nested', 'empty'])).toEqual([5])
  })

  test('should handle complex nested structures', () => {
    const json = `{
  "data": {
    "users": [
      {
        "profile": {
          "name": "John",
          "contacts": [
            {
              "type": "email",
              "value": "john@example.com"
            }
          ]
        }
      }
    ]
  }
}`
    const path = ['data', 'users', 0, 'profile', 'contacts', 0, 'value']
    
    expect(findLineNumber(json, path)).toEqual([10])
  })

  test('should handle arrays with mixed content types', () => {
    const json = `{
  "mixed": [
    123,
    "string",
    {
      "key": "value"
    },
    [
      1,
      2
    ]
  ]
}`
    
    expect(findLineNumber(json, ['mixed', 0])).toEqual([3])
    expect(findLineNumber(json, ['mixed', 1])).toEqual([4])
    expect(findLineNumber(json, ['mixed', 2, 'key'])).toEqual([6])
    expect(findLineNumber(json, ['mixed', 3])).toEqual([8, 9, 10])
  })

  test('should handle JSON with comments and whitespace', () => {
    const json = `{
  // This is a comment
  "name": "John",
  
  /* Multi-line
     comment */
  "age": 30,
  
  "address": {
    "city": "New York"  // Inline comment
  }
}`
    
    expect(findLineNumber(json, ['name'])).toEqual([3])
    expect(findLineNumber(json, ['age'])).toEqual([7])
    expect(findLineNumber(json, ['address', 'city'])).toEqual([10])
  })

  test('should handle special characters in property names', () => {
    const json = `{
  "@type": "Person",
  "user-name": "john_doe",
  "data": {
    "$ref": "#/definitions/user"
  }
}`
    
    expect(findLineNumber(json, ['@type'])).toEqual([2])
    expect(findLineNumber(json, ['user-name'])).toEqual([3])
    expect(findLineNumber(json, ['data', '$ref'])).toEqual([5])
  })
}) 