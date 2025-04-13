/**
 * jsonLineTracker.test.js
 * 
 * 测试parseJsonWithLineNumbers函数的功能
 */

import { parseJsonWithLineNumbers } from './jsonLineTracker';

describe('parseJsonWithLineNumbers', () => {
  test('应该正确解析简单的JSON对象并跟踪行号', () => {
    const jsonStr = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`;

    const { jsonObject, lineMap } = parseJsonWithLineNumbers(jsonStr);
    
    // 检查解析的对象
    expect(jsonObject).toEqual({
      name: "John",
      age: 30,
      city: "New York"
    });
    
    // 检查行号映射
    expect(lineMap.get('name')).toEqual({ key: 2, value: 2 });
    expect(lineMap.get('age')).toEqual({ key: 3, value: 3 });
    expect(lineMap.get('city')).toEqual({ key: 4, value: 4 });
  });
  
  test('应该处理嵌套对象并跟踪行号', () => {
    const jsonStr = `{
  "person": {
    "name": "Alice",
    "age": 25,
    "address": {
      "street": "123 Main St",
      "city": "Boston"
    }
  }
}`;

    const { jsonObject, lineMap } = parseJsonWithLineNumbers(jsonStr);
    
    // 检查解析的对象
    expect(jsonObject).toEqual({
      person: {
        name: "Alice",
        age: 25,
        address: {
          street: "123 Main St",
          city: "Boston"
        }
      }
    });
    
    // 检查行号映射
    expect(lineMap.get('person')).toEqual({ key: 2, value: 2 });
    expect(lineMap.get('person.name')).toEqual({ key: 3, value: 3 });
    expect(lineMap.get('person.age')).toEqual({ key: 4, value: 4 });
    expect(lineMap.get('person.address')).toEqual({ key: 5, value: 5 });
    expect(lineMap.get('person.address.street')).toEqual({ key: 6, value: 6 });
    expect(lineMap.get('person.address.city')).toEqual({ key: 7, value: 7 });
  });
  
  test('应该处理数组并跟踪行号', () => {
    const jsonStr = `{
  "numbers": [1, 2, 3],
  "users": [
    {
      "name": "Bob",
      "active": true
    },
    {
      "name": "Charlie",
      "active": false
    }
  ]
}`;

    const { jsonObject, lineMap } = parseJsonWithLineNumbers(jsonStr);
    
    // 检查解析的对象
    expect(jsonObject).toEqual({
      numbers: [1, 2, 3],
      users: [
        {
          name: "Bob",
          active: true
        },
        {
          name: "Charlie",
          active: false
        }
      ]
    });
    
    // 检查行号映射
    expect(lineMap.get('numbers')).toEqual({ key: 2, value: 2 });
    expect(lineMap.get('users')).toEqual({ key: 3, value: 3 });
    
    // 数组元素对象的属性
    expect(lineMap.get('users.0.name')).toEqual({ key: 5, value: 5 });
    expect(lineMap.get('users.0.active')).toEqual({ key: 6, value: 6 });
    expect(lineMap.get('users.1.name')).toEqual({ key: 9, value: 9 });
    expect(lineMap.get('users.1.active')).toEqual({ key: 10, value: 10 });
  });
  
  test('应该处理复杂的JSON并跟踪行号', () => {
    const jsonStr = `{
  "id": "12345",
  "metadata": {
    "created": "2023-01-01",
    "updated": "2023-05-15"
  },
  "items": [
    10,
    "text",
    { "key": "value" },
    [1, 2, 3]
  ],
  "nested": {
    "arrays": [
      [1, 2],
      [3, 4]
    ]
  }
}`;

    const { jsonObject, lineMap } = parseJsonWithLineNumbers(jsonStr);
    
    // 部分行号检查
    expect(lineMap.get('id')).toEqual({ key: 2, value: 2 });
    expect(lineMap.get('metadata')).toEqual({ key: 3, value: 3 });
    expect(lineMap.get('metadata.created')).toEqual({ key: 4, value: 4 });
    expect(lineMap.get('items')).toEqual({ key: 7, value: 7 });
    expect(lineMap.get('nested.arrays')).toEqual({ key: 14, value: 14 });
  });
  
  test('应该处理带有换行的JSON字符串', () => {
    // 注意：我们在JSON字符串中使用转义的换行符 \n 而不是实际的换行符
    const jsonStr = `{
  "multi": "this is a \\nmulti-line string",
  "spacing": "value with spaces"
}`;

    const { jsonObject, lineMap } = parseJsonWithLineNumbers(jsonStr);
    
    expect(jsonObject).toEqual({
      multi: "this is a \nmulti-line string",
      spacing: "value with spaces"
    });
    
    expect(lineMap.get('multi')).toEqual({ key: 2, value: 2 });
    expect(lineMap.get('spacing')).toEqual({ key: 3, value: 3 });
  });
  
  test('应该处理特殊字符和转义序列', () => {
    const jsonStr = `{
  "escaped": "line 1\\nline 2",
  "quotes": "He said, \\"Hello\\"",
  "special": "symbols: @#$%^&*()"
}`;

    const { jsonObject, lineMap } = parseJsonWithLineNumbers(jsonStr);
    
    expect(jsonObject).toEqual({
      escaped: "line 1\nline 2",
      quotes: "He said, \"Hello\"",
      special: "symbols: @#$%^&*()"
    });
    
    expect(lineMap.get('escaped')).toEqual({ key: 2, value: 2 });
    expect(lineMap.get('quotes')).toEqual({ key: 3, value: 3 });
    expect(lineMap.get('special')).toEqual({ key: 4, value: 4 });
  });
  
  test('空对象和空数组应该正确处理', () => {
    const jsonStr = `{
  "emptyObj": {},
  "emptyArr": []
}`;

    const { jsonObject, lineMap } = parseJsonWithLineNumbers(jsonStr);
    
    expect(jsonObject).toEqual({
      emptyObj: {},
      emptyArr: []
    });
    
    expect(lineMap.get('emptyObj')).toEqual({ key: 2, value: 2 });
    expect(lineMap.get('emptyArr')).toEqual({ key: 3, value: 3 });
  });
  
  test('应该处理无效的JSON输入', () => {
    const invalidJson = `{ "key": "value", }`;
    
    expect(() => {
      parseJsonWithLineNumbers(invalidJson);
    }).toThrow('JSON解析错误');
  });
  
  test('应该处理非字符串输入', () => {
    expect(() => {
      parseJsonWithLineNumbers(null);
    }).toThrow('输入必须是非空字符串');
    
    expect(() => {
      parseJsonWithLineNumbers(123);
    }).toThrow('输入必须是非空字符串');
    
    expect(() => {
      parseJsonWithLineNumbers({});
    }).toThrow('输入必须是非空字符串');
  });
}); 