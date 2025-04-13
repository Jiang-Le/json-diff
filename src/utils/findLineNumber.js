/**
 * 在 JSON 文本中查找指定路径对应的行号
 * @param {string} content - JSON 文本内容
 * @param {Array} path - 要查找的路径数组
 * @returns {Array} 匹配的行号数组（1-based）
 */
export function findLineNumber(content, path) {
  // 处理边界情况
  if (!content || !path || !Array.isArray(path) || path.length === 0) {
    return []
  }

  try {
    // 第一步：解析 JSON 文本并记录键值对的行号
    const lineMap = new Map() // 存储路径与行号的映射
    const lines = content.split('\n')
    
    // 构建行号映射
    parseJsonWithLineNumbers(content, lines, lineMap)
    
    // 第二步：使用路径查找对应的行号
    return findLinesByPath(lineMap, path)
  } catch (error) {
    console.error('Error in findLineNumber:', error)
    return []
  }
}

/**
 * 解析JSON文本并记录每个键和值的行号
 * @param {string} content - JSON文本内容 
 * @param {Array} lines - 分割后的行数组
 * @param {Map} lineMap - 存储路径与行号的映射
 */
function parseJsonWithLineNumbers(content, lines, lineMap) {
  // 用于存储当前解析的位置状态
  const tokenizer = {
    content: content,
    position: 0,
    line: 1,
    column: 1,
    currentChar: content[0]
  }
  
  // 解析整个JSON对象，并记录每个节点的位置信息
  const rootNode = parseValue(tokenizer, [], lineMap)
}

/**
 * 根据路径在lineMap中查找对应的行号
 * @param {Map} lineMap - 存储路径与行号的映射
 * @param {Array} path - 路径数组
 * @returns {Array} 匹配的行号数组
 */
function findLinesByPath(lineMap, path) {
  // 将路径转换为字符串形式，以便在Map中查找
  const pathString = pathToString(path)
  
  // 在Map中查找该路径
  if (lineMap.has(pathString)) {
    return lineMap.get(pathString)
  }
  
  return []
}

/**
 * 将路径数组转换为字符串
 * @param {Array} path - 路径数组
 * @returns {string} 路径字符串
 */
function pathToString(path) {
  return path.map(segment => {
    // 处理数组索引或特殊字符的情况
    if (typeof segment === 'number' || typeof segment === 'boolean' || segment === null) {
      return `[${segment}]`
    }
    return `.${segment}`
  }).join('')
}

/**
 * 跳过空白字符
 * @param {Object} tokenizer - 词法分析器状态
 */
function skipWhitespace(tokenizer) {
  while (tokenizer.position < tokenizer.content.length) {
    const char = tokenizer.content[tokenizer.position]
    
    if (char === ' ' || char === '\t' || char === '\r') {
      advanceTokenizer(tokenizer)
    } else if (char === '\n') {
      advanceTokenizer(tokenizer)
    } else if (char === '/' && tokenizer.position + 1 < tokenizer.content.length) {
      // 处理注释
      const nextChar = tokenizer.content[tokenizer.position + 1]
      
      if (nextChar === '/') {
        // 单行注释
        advanceTokenizer(tokenizer, 2) // 跳过 //
        while (tokenizer.position < tokenizer.content.length && tokenizer.currentChar !== '\n') {
          advanceTokenizer(tokenizer)
        }
        if (tokenizer.currentChar === '\n') {
          advanceTokenizer(tokenizer) // 跳过换行符
        }
      } else if (nextChar === '*') {
        // 多行注释
        advanceTokenizer(tokenizer, 2) // 跳过 /*
        while (
          tokenizer.position + 1 < tokenizer.content.length && 
          !(tokenizer.currentChar === '*' && tokenizer.content[tokenizer.position + 1] === '/')
        ) {
          advanceTokenizer(tokenizer)
        }
        if (tokenizer.position + 1 < tokenizer.content.length) {
          advanceTokenizer(tokenizer, 2) // 跳过 */
        }
      } else {
        break
      }
    } else {
      break
    }
  }
}

/**
 * 前进tokenizer的位置
 * @param {Object} tokenizer - 词法分析器状态
 * @param {number} steps - 前进的步数，默认为1
 */
function advanceTokenizer(tokenizer, steps = 1) {
  for (let i = 0; i < steps; i++) {
    if (tokenizer.position >= tokenizer.content.length) {
      break
    }
    
    if (tokenizer.currentChar === '\n') {
      tokenizer.line++
      tokenizer.column = 1
    } else {
      tokenizer.column++
    }
    
    tokenizer.position++
    tokenizer.currentChar = tokenizer.content[tokenizer.position]
  }
}

/**
 * 解析值
 * @param {Object} tokenizer - 词法分析器状态
 * @param {Array} currentPath - 当前解析路径
 * @param {Map} lineMap - 行号映射
 * @returns {*} 解析后的值
 */
function parseValue(tokenizer, currentPath, lineMap) {
  skipWhitespace(tokenizer)
  
  if (tokenizer.position >= tokenizer.content.length) {
    return null
  }
  
  const startLine = tokenizer.line
  
  switch (tokenizer.currentChar) {
    case '{':
      // 对象会在parseObject内部记录行号
      return parseObject(tokenizer, currentPath, lineMap, startLine)
    case '[':
      // 数组会在parseArray内部记录行号
      return parseArray(tokenizer, currentPath, lineMap, startLine)
    case '"':
      // 字符串在parseString内记录行号
      return parseString(tokenizer, currentPath, lineMap)
    case 't':
      if (tokenizer.content.slice(tokenizer.position, tokenizer.position + 4) === 'true') {
        // 记录简单值的行号
        recordLineNumber(lineMap, currentPath, [tokenizer.line])
        advanceTokenizer(tokenizer, 4)
        return true
      }
      break
    case 'f':
      if (tokenizer.content.slice(tokenizer.position, tokenizer.position + 5) === 'false') {
        // 记录简单值的行号
        recordLineNumber(lineMap, currentPath, [tokenizer.line])
        advanceTokenizer(tokenizer, 5)
        return false
      }
      break
    case 'n':
      if (tokenizer.content.slice(tokenizer.position, tokenizer.position + 4) === 'null') {
        // 记录简单值的行号
        recordLineNumber(lineMap, currentPath, [tokenizer.line])
        advanceTokenizer(tokenizer, 4)
        return null
      }
      break
    default:
      if (
        (tokenizer.currentChar >= '0' && tokenizer.currentChar <= '9') ||
        tokenizer.currentChar === '-'
      ) {
        return parseNumber(tokenizer, currentPath, lineMap)
      }
  }
  
  throw new Error(`Unexpected character at position ${tokenizer.position}, line ${tokenizer.line}`)
}

/**
 * 解析对象
 * @param {Object} tokenizer - 词法分析器状态
 * @param {Array} currentPath - 当前解析路径
 * @param {Map} lineMap - 行号映射
 * @param {number} startLine - 开始行号
 * @returns {Object} 解析后的对象
 */
function parseObject(tokenizer, currentPath, lineMap, startLine) {
  const obj = {}
  const objectStartLine = tokenizer.line
  
  // 跳过开始的 {
  advanceTokenizer(tokenizer)
  skipWhitespace(tokenizer)
  
  // 处理空对象
  if (tokenizer.currentChar === '}') {
    recordLineNumber(lineMap, currentPath, [tokenizer.line])
    advanceTokenizer(tokenizer)
    return obj
  }
  
  let first = true
  while (tokenizer.position < tokenizer.content.length) {
    if (!first) {
      // 期望一个逗号
      if (tokenizer.currentChar !== ',') {
        break
      }
      advanceTokenizer(tokenizer)
      skipWhitespace(tokenizer)
    }
    
    first = false
    
    // 解析键 (允许带引号或不带引号的键)
    let key
    const keyStartLine = tokenizer.line
    
    if (tokenizer.currentChar === '"') {
      key = parseString(tokenizer, currentPath, lineMap, true)
    } else {
      // 处理不带引号的键 (如数字、true、false、null等)
      let keyStr = ''
      while (
        tokenizer.position < tokenizer.content.length &&
        tokenizer.currentChar !== ':' &&
        tokenizer.currentChar !== ' ' &&
        tokenizer.currentChar !== '\t' &&
        tokenizer.currentChar !== '\n' &&
        tokenizer.currentChar !== '\r'
      ) {
        keyStr += tokenizer.currentChar
        advanceTokenizer(tokenizer)
      }
      key = keyStr
    }
    
    skipWhitespace(tokenizer)
    
    // 期望一个冒号
    if (tokenizer.currentChar !== ':') {
      throw new Error(`Expected ':' at position ${tokenizer.position}, line ${tokenizer.line}`)
    }
    advanceTokenizer(tokenizer)
    
    // 解析值
    const newPath = [...currentPath, key]
    skipWhitespace(tokenizer)
    
    // 记录值开始的行号
    const valueStartLine = tokenizer.line
    
    // 解析值并获取对应的行号
    obj[key] = parseValue(tokenizer, newPath, lineMap)
    
    // 如果是对象或数组，会在parseValue中记录行号
    // 对于简单值，记录单行的行号
    if (!lineMap.has(pathToString(newPath))) {
      recordLineNumber(lineMap, newPath, [valueStartLine])
    }
    
    skipWhitespace(tokenizer)
    
    if (tokenizer.currentChar === '}') {
      break
    }
  }
  
  // 记录整个对象的行范围
  const objectEndLine = tokenizer.line
  const objectLines = []
  for (let i = objectStartLine; i <= objectEndLine; i++) {
    objectLines.push(i)
  }
  recordLineNumber(lineMap, currentPath, objectLines)
  
  // 跳过结束的 }
  if (tokenizer.currentChar === '}') {
    advanceTokenizer(tokenizer)
  }
  
  return obj
}

/**
 * 解析数组
 * @param {Object} tokenizer - 词法分析器状态
 * @param {Array} currentPath - 当前解析路径
 * @param {Map} lineMap - 行号映射
 * @param {number} startLine - 开始行号
 * @returns {Array} 解析后的数组
 */
function parseArray(tokenizer, currentPath, lineMap, startLine) {
  const arr = []
  const arrayStartLine = tokenizer.line
  
  // 跳过开始的 [
  advanceTokenizer(tokenizer)
  skipWhitespace(tokenizer)
  
  // 处理空数组
  if (tokenizer.currentChar === ']') {
    recordLineNumber(lineMap, currentPath, [tokenizer.line])
    advanceTokenizer(tokenizer)
    return arr
  }
  
  let index = 0
  let first = true
  while (tokenizer.position < tokenizer.content.length) {
    if (!first) {
      // 期望一个逗号
      if (tokenizer.currentChar !== ',') {
        break
      }
      advanceTokenizer(tokenizer)
      skipWhitespace(tokenizer)
    }
    
    first = false
    
    // 获取元素开始的行号
    const elementStartLine = tokenizer.line
    const newPath = [...currentPath, index]
    
    // 解析数组元素
    arr.push(parseValue(tokenizer, newPath, lineMap))
    
    // 如果是对象或数组，会在parseValue中记录行号
    // 对于简单值，如果没有记录过，则记录当前行
    if (!lineMap.has(pathToString(newPath))) {
      recordLineNumber(lineMap, newPath, [elementStartLine])
    }
    
    skipWhitespace(tokenizer)
    index++
    
    if (tokenizer.currentChar === ']') {
      break
    }
  }
  
  // 记录整个数组的行范围
  const arrayEndLine = tokenizer.line
  const arrayLines = []
  for (let i = arrayStartLine; i <= arrayEndLine; i++) {
    arrayLines.push(i)
  }
  recordLineNumber(lineMap, currentPath, arrayLines)
  
  // 跳过结束的 ]
  if (tokenizer.currentChar === ']') {
    advanceTokenizer(tokenizer)
  }
  
  return arr
}

/**
 * 解析字符串
 * @param {Object} tokenizer - 词法分析器状态
 * @param {Array} currentPath - 当前解析路径
 * @param {Map} lineMap - 行号映射
 * @param {boolean} isKey - 是否是对象键
 * @returns {string} 解析后的字符串
 */
function parseString(tokenizer, currentPath, lineMap, isKey = false) {
  let str = ''
  const startLine = tokenizer.line
  
  // 跳过开始的双引号
  advanceTokenizer(tokenizer)
  
  let escaped = false
  while (tokenizer.position < tokenizer.content.length) {
    if (escaped) {
      // 处理转义字符
      if (tokenizer.currentChar === 'n') str += '\n'
      else if (tokenizer.currentChar === 'r') str += '\r'
      else if (tokenizer.currentChar === 't') str += '\t'
      else if (tokenizer.currentChar === 'b') str += '\b'
      else if (tokenizer.currentChar === 'f') str += '\f'
      else if (tokenizer.currentChar === 'u') {
        // 解析Unicode字符
        const hexCode = tokenizer.content.slice(tokenizer.position + 1, tokenizer.position + 5)
        str += String.fromCharCode(parseInt(hexCode, 16))
        advanceTokenizer(tokenizer, 4)
      } else {
        // 对于其他字符（如 " 或 \ 或 /），直接添加
        str += tokenizer.currentChar
      }
      escaped = false
    } else if (tokenizer.currentChar === '\\') {
      escaped = true
    } else if (tokenizer.currentChar === '"') {
      // 结束字符串
      advanceTokenizer(tokenizer)
      break
    } else {
      // 普通字符
      str += tokenizer.currentChar
    }
    
    advanceTokenizer(tokenizer)
  }
  
  // 如果不是键，则记录行号
  if (!isKey) {
    recordLineNumber(lineMap, currentPath, [startLine])
  }
  
  return str
}

/**
 * 解析数字
 * @param {Object} tokenizer - 词法分析器状态
 * @param {Array} currentPath - 当前解析路径
 * @param {Map} lineMap - 行号映射
 * @returns {number} 解析后的数字
 */
function parseNumber(tokenizer, currentPath, lineMap) {
  let numStr = ''
  const startLine = tokenizer.line
  
  // 处理负号
  if (tokenizer.currentChar === '-') {
    numStr += '-'
    advanceTokenizer(tokenizer)
  }
  
  // 处理整数部分
  while (
    tokenizer.position < tokenizer.content.length &&
    tokenizer.currentChar >= '0' &&
    tokenizer.currentChar <= '9'
  ) {
    numStr += tokenizer.currentChar
    advanceTokenizer(tokenizer)
  }
  
  // 处理小数部分
  if (tokenizer.currentChar === '.') {
    numStr += '.'
    advanceTokenizer(tokenizer)
    
    while (
      tokenizer.position < tokenizer.content.length &&
      tokenizer.currentChar >= '0' &&
      tokenizer.currentChar <= '9'
    ) {
      numStr += tokenizer.currentChar
      advanceTokenizer(tokenizer)
    }
  }
  
  // 处理指数部分
  if (tokenizer.currentChar === 'e' || tokenizer.currentChar === 'E') {
    numStr += tokenizer.currentChar
    advanceTokenizer(tokenizer)
    
    if (tokenizer.currentChar === '+' || tokenizer.currentChar === '-') {
      numStr += tokenizer.currentChar
      advanceTokenizer(tokenizer)
    }
    
    while (
      tokenizer.position < tokenizer.content.length &&
      tokenizer.currentChar >= '0' &&
      tokenizer.currentChar <= '9'
    ) {
      numStr += tokenizer.currentChar
      advanceTokenizer(tokenizer)
    }
  }
  
  // 记录行号
  recordLineNumber(lineMap, currentPath, [startLine])
  
  return parseFloat(numStr)
}

/**
 * 记录路径对应的行号
 * @param {Map} lineMap - 行号映射
 * @param {Array} path - 路径数组
 * @param {Array} lines - 行号数组
 */
function recordLineNumber(lineMap, path, lines) {
  const pathString = pathToString(path)
  lineMap.set(pathString, lines)
} 