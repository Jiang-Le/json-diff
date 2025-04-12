export function sortJSON(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return sortJSON(item)
      }
      return item
    }).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b
      }
      if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
        // For objects in arrays, sort by their string representation after sorting their keys
        return JSON.stringify(sortJSON(a)).localeCompare(JSON.stringify(sortJSON(b)))
      }
      return String(a).localeCompare(String(b))
    })
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sortedObj = {}
    Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .forEach(key => {
        sortedObj[key] = typeof obj[key] === 'object' && obj[key] !== null
          ? sortJSON(obj[key])
          : obj[key]
      })
    return sortedObj
  }
  
  return obj
} 