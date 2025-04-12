export function compareJSON(obj1, obj2, path = []) {
  const differences = []

  // 如果两个值完全相等（包括类型），直接返回空数组
  if (obj1 === obj2) {
    return differences
  }

  // 如果其中一个值为 undefined，则视为添加或删除
  if (obj1 === undefined || obj2 === undefined) {
    differences.push({
      path,
      type: obj1 === undefined ? 'added' : 'removed',
      value: obj1 === undefined ? obj2 : obj1
    })
    return differences
  }

  // 如果其中一个值为 null 或类型不同，标记为修改
  if (obj1 === null || obj2 === null || typeof obj1 !== typeof obj2) {
    differences.push({
      path,
      type: 'modified',
      oldValue: obj1,
      newValue: obj2
    })
    return differences
  }

  // 处理数组
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLength = Math.max(obj1.length, obj2.length)
    
    for (let i = 0; i < maxLength; i++) {
      const currentPath = [...path, i]
      
      // 数组越界检查
      if (i >= obj1.length) {
        // 新数组更长，标记为新增
        differences.push({
          path: currentPath,
          type: 'added',
          value: obj2[i]
        })
      } else if (i >= obj2.length) {
        // 旧数组更长，标记为删除
        differences.push({
          path: currentPath,
          type: 'removed',
          value: obj1[i]
        })
      } else {
        // 递归比较数组元素
        differences.push(...compareJSON(obj1[i], obj2[i], currentPath))
      }
    }
    return sortDifferences(differences)
  }

  // 处理对象
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

    for (const key of allKeys) {
      const currentPath = [...path, key]
      const value1 = obj1[key]
      const value2 = obj2[key]

      // 处理键的存在性
      if (!(key in obj1)) {
        // 新对象中存在，旧对象中不存在的键
        differences.push({
          path: currentPath,
          type: 'added',
          value: value2
        })
      } else if (!(key in obj2)) {
        // 旧对象中存在，新对象中不存在的键
        differences.push({
          path: currentPath,
          type: 'removed',
          value: value1
        })
      } else {
        // 递归比较值
        differences.push(...compareJSON(value1, value2, currentPath))
      }
    }
    return sortDifferences(differences)
  }

  // 处理基本类型（数字、字符串、布尔值）
  if (obj1 !== obj2) {
    differences.push({
      path,
      type: 'modified',
      oldValue: obj1,
      newValue: obj2
    })
  }

  return sortDifferences(differences)
}

// 辅助函数：按路径排序差异
function sortDifferences(differences) {
  return differences.sort((a, b) => {
    // 首先按路径排序
    const pathA = a.path.join('.')
    const pathB = b.path.join('.')
    const pathCompare = pathA.localeCompare(pathB)
    if (pathCompare !== 0) return pathCompare

    // 如果路径相同，按类型排序：removed > modified > added
    const typeOrder = { removed: 0, modified: 1, added: 2 }
    return typeOrder[a.type] - typeOrder[b.type]
  })
} 