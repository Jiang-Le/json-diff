import { sortJSON } from './sortJSON'

describe('sortJSON', () => {
  test('should sort object keys alphabetically', () => {
    const input = {
      zebra: 1,
      apple: 2,
      banana: 3
    }
    const expected = {
      apple: 2,
      banana: 3,
      zebra: 1
    }
    expect(sortJSON(input)).toEqual(expected)
  })

  test('should sort array elements', () => {
    const input = [3, 1, 2]
    const expected = [1, 2, 3]
    expect(sortJSON(input)).toEqual(expected)
  })

  test('should sort nested objects', () => {
    const input = {
      c: {
        z: 1,
        a: 2
      },
      b: {
        y: 3,
        x: 4
      }
    }
    const expected = {
      b: {
        x: 4,
        y: 3
      },
      c: {
        a: 2,
        z: 1
      }
    }
    expect(sortJSON(input)).toEqual(expected)
  })

  test('should sort mixed arrays and objects', () => {
    const input = {
      items: [
        { name: "zebra", id: 3 },
        { name: "apple", id: 1 },
        { name: "banana", id: 2 }
      ]
    }
    const expected = {
      items: [
        { id: 1, name: "apple" },
        { id: 2, name: "banana" },
        { id: 3, name: "zebra" }
      ]
    }
    expect(sortJSON(input)).toEqual(expected)
  })

  test('should handle null and undefined values', () => {
    const input = {
      b: null,
      a: undefined,
      c: 1
    }
    const expected = {
      a: undefined,
      b: null,
      c: 1
    }
    expect(sortJSON(input)).toEqual(expected)
  })

  test('should handle empty objects and arrays', () => {
    const input = {
      emptyObj: {},
      emptyArr: [],
      value: 1
    }
    const expected = {
      emptyArr: [],
      emptyObj: {},
      value: 1
    }
    expect(sortJSON(input)).toEqual(expected)
  })
}) 