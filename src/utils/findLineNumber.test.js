import { findLineNumber, buildLineNumberMap, pathToString } from './findLineNumber'

describe('findLineNumber', () => {
  test('should handle empty input', () => {
    expect(findLineNumber('', [])).toEqual([])
    expect(findLineNumber('{}', [])).toEqual([])
    expect(findLineNumber(null, ['key'])).toEqual([])
  })

  test('should find simple key-value pairs', () => {
    const json = `{
      "name": "John",
      "age": 30
    }`
    expect(findLineNumber(json, ['name'])).toEqual([2])
    expect(findLineNumber(json, ['age'])).toEqual([3])
  })

  test('should handle arrays', () => {
    const json = `{
      "numbers": [
        1,
        2,
        3
      ]
    }`
    expect(findLineNumber(json, ['numbers', 0])).toEqual([3])
    expect(findLineNumber(json, ['numbers', 1])).toEqual([4])
    expect(findLineNumber(json, ['numbers', 2])).toEqual([5])
  })

  test('should handle nested objects', () => {
    const json = `{
      "user": {
        "details": {
          "address": {
            "city": "New York"
          }
        }
      }
    }`
    expect(findLineNumber(json, ['user', 'details', 'address', 'city'])).toEqual([5])
  })

  test('should handle comments', () => {
    const json = `{
      // Single line comment
      "key1": "value1",
      /* Multi-line
         comment */
      "key2": "value2"
    }`
    expect(findLineNumber(json, ['key1'])).toEqual([3])
    expect(findLineNumber(json, ['key2'])).toEqual([6])
  })

  test('should handle escaped characters', () => {
    const json = `{
      "normal": "value",
      "escaped\\\"key": "value",
      "string": "contains \\"quotes\\" inside"
    }`
    expect(findLineNumber(json, ['normal'])).toEqual([2])
    expect(findLineNumber(json, ['escaped"key'])).toEqual([3])
  })

  test('should handle complex nested arrays', () => {
    const json = `{
      "matrix": [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]
    }`
    expect(findLineNumber(json, ['matrix', 0])).toEqual([3])
    expect(findLineNumber(json, ['matrix', 1])).toEqual([4])
    expect(findLineNumber(json, ['matrix', 2])).toEqual([5])
  })

  test('should handle mixed nested structures', () => {
    const json = `{
      "users": [
        {
          "id": 1,
          "details": {
            "name": "John"
          }
        },
        {
          "id": 2,
          "details": {
            "name": "Jane"
          }
        }
      ]
    }`
    expect(findLineNumber(json, ['users', 0, 'details', 'name'])).toEqual([6])
    expect(findLineNumber(json, ['users', 1, 'details', 'name'])).toEqual([12])
  })

  test('should handle non-string keys', () => {
    const json = `{
      123: "numeric key",
      true: "boolean key",
      null: "null key"
    }`
    expect(findLineNumber(json, ['123'])).toEqual([2])
    expect(findLineNumber(json, ['true'])).toEqual([3])
    expect(findLineNumber(json, ['null'])).toEqual([4])
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
    expect(findLineNumber(json, ['mixed', 3])).toEqual([8, 9, 10, 11])
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

  test('should use prebuilt line map when provided', () => {
    const json = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`
    // 预先构建行号映射
    const lineMap = buildLineNumberMap(json)
    
    // 使用预构建的行号映射调用 findLineNumber
    expect(findLineNumber(json, ['age'], lineMap)).toEqual([3])
    expect(findLineNumber(json, ['city'], lineMap)).toEqual([4])
  })
})

describe('buildLineNumberMap', () => {
  test('should return empty map for empty input', () => {
    const map = buildLineNumberMap('')
    expect(map.size).toBe(0)
  })

  test('should build correct line map for simple JSON', () => {
    const json = `{
  "name": "John",
  "age": 30
}`
    const lineMap = buildLineNumberMap(json)
    
    // 通过路径字符串查询行号映射
    expect(lineMap.get(pathToString(['name']))).toEqual([2])
    expect(lineMap.get(pathToString(['age']))).toEqual([3])
  })

  test('should build correct line map for nested structures', () => {
    const json = `{
  "person": {
    "name": "John",
    "address": {
      "city": "New York"
    }
  }
}`
    const lineMap = buildLineNumberMap(json)
    
    expect(lineMap.get(pathToString(['person', 'name']))).toEqual([3])
    expect(lineMap.get(pathToString(['person', 'address', 'city']))).toEqual([5])
  })
})

describe('pathToString', () => {
  test('should convert simple path to string', () => {
    expect(pathToString(['name'])).toBe('.name')
    expect(pathToString(['age'])).toBe('.age')
  })

  test('should handle array indices', () => {
    expect(pathToString(['items', 0])).toBe('.items[0]')
    expect(pathToString(['users', 1, 'name'])).toBe('.users[1].name')
  })

  test('should handle special values', () => {
    expect(pathToString([true])).toBe('[true]')
    expect(pathToString([false])).toBe('[false]')
    expect(pathToString([null])).toBe('[null]')
  })

  test('should handle mixed path types', () => {
    expect(pathToString(['data', 0, 'items', true, 'value'])).toBe('.data[0].items[true].value')
  })
}) 