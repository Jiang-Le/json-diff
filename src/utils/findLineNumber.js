/**
 * 在 JSON 文本中查找指定路径对应的行号
 * @param {string} content - JSON 文本内容
 * @param {Array} path - 要查找的路径数组
 * @returns {Array} 匹配的行号数组（1-based）
 */
export function findLineNumber(content, path) {
  const lines = content.split('\n')
  const foundLines = new Set()
  let currentPath = []
  let inString = false
  let inComment = false
  let inMultilineComment = false
  let arrayIndexStack = []
  let bracketStack = []
  let currentLine = 1
  let currentToken = ''
  let lastKey = ''
  let lastKeyLine = 0
  let expectValue = false
  let valueStartLine = 0
  
  // 处理每个字符
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    
    // 处理换行
    if (char === '\n') {
      currentLine++
      if (!inMultilineComment) inComment = false
      continue
    }
    
    // 处理注释
    if (!inString) {
      if (char === '/' && content[i + 1] === '/') {
        inComment = true
        continue
      }
      if (char === '/' && content[i + 1] === '*') {
        inMultilineComment = true
        i++
        continue
      }
      if (inMultilineComment && char === '*' && content[i + 1] === '/') {
        inMultilineComment = false
        i++
        continue
      }
      if (inComment || inMultilineComment) continue
    }
    
    // 处理字符串
    if (char === '"' && content[i - 1] !== '\\') {
      if (!inString) {
        inString = true
        currentToken = ''
      } else {
        if (expectValue) {
          // 这是一个值
          if (currentPath.length === path.length) {
            foundLines.add(currentLine)
          }
          expectValue = false
        } else {
          // 这是一个键
          lastKey = currentToken
          lastKeyLine = currentLine
          
          // 检查是否是目标路径的一部分
          if (currentPath.length < path.length && lastKey === path[currentPath.length]) {
            currentPath.push(lastKey)
            if (currentPath.length === path.length) {
              valueStartLine = currentLine
            }
          }
        }
        currentToken = ''
        inString = false
      }
      continue
    }
    
    if (inString) {
      currentToken += char
      continue
    }
    
    // 处理冒号（表示键值对）
    if (char === ':') {
      expectValue = true
      continue
    }
    
    // 处理逗号（表示元素分隔）
    if (char === ',') {
      if (bracketStack[bracketStack.length - 1] === '[') {
        arrayIndexStack[arrayIndexStack.length - 1]++
      }
      continue
    }
    
    // 处理对象和数组的开始
    if (char === '{' || char === '[') {
      bracketStack.push(char)
      if (char === '[') {
        arrayIndexStack.push(-1)
        // 如果这是目标路径中的数组
        if (currentPath.length < path.length && typeof path[currentPath.length] === 'number') {
          currentPath.push(-1)
        }
      }
      continue
    }
    
    // 处理对象和数组的结束
    if (char === '}' || char === ']') {
      const openBracket = bracketStack.pop()
      if (openBracket === '[') {
        arrayIndexStack.pop()
        if (currentPath.length > 0 && typeof currentPath[currentPath.length - 1] === 'number') {
          currentPath.pop()
        }
      } else {
        if (currentPath.length > 0) {
          currentPath.pop()
        }
      }
      continue
    }
    
    // 处理数组索引
    if (bracketStack[bracketStack.length - 1] === '[' && /[0-9]/.test(char)) {
      const arrayIndex = arrayIndexStack[arrayIndexStack.length - 1]
      if (currentPath.length < path.length && 
          typeof path[currentPath.length] === 'number' && 
          path[currentPath.length] === arrayIndex + 1) {
        currentPath[currentPath.length - 1] = arrayIndex + 1
        if (currentPath.length === path.length) {
          foundLines.add(currentLine)
        }
      }
    }
  }
  
  return Array.from(foundLines).sort((a, b) => a - b)
} 