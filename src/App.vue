<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import loader from '@monaco-editor/loader'
import '@mdi/font/css/materialdesignicons.css'

const isCompareMode = ref(false)
const leftEditorContainer = ref(null)
const rightEditorContainer = ref(null)
let leftEditor = null
let rightEditor = null
let monaco = null

const leftContent = ref({
  name: "JSON Diff Tool",
  description: "A tool to compare JSON files",
  version: "1.0.0"
})

const rightContent = ref({
  name: "JSON Diff Tool",
  description: "A modified version",
  version: "2.0.0"
})

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2)
}

function sortJSON(obj) {
  if (Array.isArray(obj)) {
    return obj.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b
      }
      return String(a).localeCompare(String(b))
    }).map(item => {
      if (typeof item === 'object' && item !== null) {
        return sortJSON(item)
      }
      return item
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

function handleFormat() {
  try {
    if (isCompareMode.value) {
      // 在比较模式下，格式化两个编辑器
      if (leftEditor) {
        const leftContent = JSON.parse(leftEditor.getValue())
        leftEditor.setValue(formatJSON(leftContent))
      }
      if (rightEditor) {
        const rightContent = JSON.parse(rightEditor.getValue())
        rightEditor.setValue(formatJSON(rightContent))
      }
    } else {
      // 在单编辑器模式下，只格式化左侧编辑器
      if (leftEditor) {
        const content = JSON.parse(leftEditor.getValue())
        leftEditor.setValue(formatJSON(content))
      }
    }
  } catch (e) {
    console.error('Invalid JSON:', e)
  }
}

function handleSort() {
  try {
    if (isCompareMode.value) {
      // 在比较模式下，排序两个编辑器
      if (leftEditor) {
        const leftContent = JSON.parse(leftEditor.getValue())
        const sortedLeft = sortJSON(leftContent)
        leftEditor.setValue(formatJSON(sortedLeft))
      }
      if (rightEditor) {
        const rightContent = JSON.parse(rightEditor.getValue())
        const sortedRight = sortJSON(rightContent)
        rightEditor.setValue(formatJSON(sortedRight))
      }
    } else {
      // 在单编辑器模式下，只排序左侧编辑器
      if (leftEditor) {
        const content = JSON.parse(leftEditor.getValue())
        const sorted = sortJSON(content)
        leftEditor.setValue(formatJSON(sorted))
      }
    }
  } catch (e) {
    console.error('Invalid JSON:', e)
  }
}

async function initializeMonaco() {
  monaco = await loader.init()
  
  // 设置编辑器选项
  const editorOptions = {
    language: 'json',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    renderValidationDecorations: 'on',
    formatOnPaste: true,
    formatOnType: true
  }

  // 创建左侧编辑器
  leftEditor = monaco.editor.create(leftEditorContainer.value, {
    ...editorOptions,
    value: formatJSON(leftContent.value),
    readOnly: false
  })

  // 监听左侧编辑器内容变化
  leftEditor.onDidChangeModelContent(() => {
    try {
      if (isCompareMode.value && rightEditor) {
        highlightDifferences()
      }
    } catch (e) {
      console.error('Invalid JSON in left editor')
    }
  })
}

function initializeRightEditor() {
  if (!rightEditorContainer.value || !monaco) return

  // 创建右侧编辑器
  rightEditor = monaco.editor.create(rightEditorContainer.value, {
    language: 'json',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    renderValidationDecorations: 'on',
    formatOnPaste: true,
    formatOnType: true,
    value: formatJSON(rightContent.value),
    readOnly: false
  })

  // 监听右侧编辑器内容变化
  rightEditor.onDidChangeModelContent(() => {
    try {
      highlightDifferences()
    } catch (e) {
      console.error('Invalid JSON in right editor')
    }
  })
}

function compareJSON(obj1, obj2, path = []) {
  const differences = []

  // 如果两个值完全相等（包括类型），直接返回空数组
  if (obj1 === obj2) {
    return differences
  }

  // 处理其中一个值为 undefined 或 null 的情况
  if (obj1 === undefined || obj1 === null || obj2 === undefined || obj2 === null) {
    if (obj1 !== obj2) {
      differences.push({
        path,
        type: obj1 === undefined || obj1 === null ? 'added' : 'removed',
        value: obj1 === undefined || obj1 === null ? obj2 : obj1
      })
    }
    return differences
  }

  // 如果类型不同，标记为修改
  if (typeof obj1 !== typeof obj2) {
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
    return differences
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
        differences.push({
          path: currentPath,
          type: 'added',
          value: value2
        })
      } else if (!(key in obj2)) {
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
    return differences
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

  return differences
}

function findLineNumber(editor, path) {
  const content = editor.getValue()
  const lines = content.split('\n')
  const targetKey = path[path.length - 1]
  let foundLines = []
  let depth = 0
  let currentPath = []
  let inArray = false
  let arrayIndex = -1
  let keyStartLine = -1
  let bracketCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 处理数组开始
    if (line.includes('[')) {
      inArray = true
      arrayIndex = -1
      depth++
      if (bracketCount === 0) bracketCount++
    }
    
    // 处理数组结束
    if (line.includes(']')) {
      inArray = false
      depth--
      if (depth < currentPath.length) {
        currentPath.pop()
      }
      bracketCount--
    }

    // 处理对象开始
    if (line.includes('{')) {
      inArray = false
      depth++
      if (bracketCount === 0) bracketCount++
    }
    
    // 处理对象结束
    if (line.includes('}')) {
      depth--
      if (depth < currentPath.length) {
        currentPath.pop()
      }
      bracketCount--
    }

    // 处理数组元素
    if (inArray) {
      if (!line.includes('[') && !line.includes(']')) {
        arrayIndex++
        if (!isNaN(targetKey) && parseInt(targetKey) === arrayIndex) {
          const pathPrefix = path.slice(0, -1)
          const isPathMatch = pathPrefix.length <= currentPath.length &&
            pathPrefix.every((p, idx) => p === currentPath[idx])

          if (isPathMatch) {
            keyStartLine = i
            foundLines.push(i + 1)
            
            // 如果元素是对象或数组，找到它的结束位置
            if (line.includes('{') || line.includes('[')) {
              let innerBracketCount = 1
              let j = i + 1
              while (j < lines.length) {
                const currentLine = lines[j].trim()
                if (currentLine.includes('{') || currentLine.includes('[')) innerBracketCount++
                if (currentLine.includes('}') || currentLine.includes(']')) innerBracketCount--
                foundLines.push(j + 1)
                if (innerBracketCount === 0) break
                j++
              }
            }
          }
        }
      }
      continue
    }

    // 处理键值对
    const keyMatch = line.match(/"([^"]+)"\s*:/)
    if (keyMatch) {
      const key = keyMatch[1]
      
      if (line.includes('{')) {
        currentPath.push(key)
      }
      
      if (key === targetKey) {
        const pathPrefix = path.slice(0, -1)
        const isPathMatch = pathPrefix.length <= currentPath.length &&
          pathPrefix.every((p, idx) => p === currentPath[idx])

        if (isPathMatch) {
          keyStartLine = i
          foundLines.push(i + 1)
          
          // 如果值在下一行
          if (!line.includes('{') && !line.includes('[') && line.endsWith(':')) {
            let j = i + 1
            while (j < lines.length) {
              const nextLine = lines[j].trim()
              foundLines.push(j + 1)
              // 如果遇到下一个键值对或结束符号，停止
              if (nextLine.match(/"([^"]+)"\s*:/) || nextLine.includes('}') || nextLine.includes(']')) {
                break
              }
              j++
            }
          }
          
          // 如果值是对象或数组
          if (line.includes('{') || line.includes('[')) {
            let innerBracketCount = 1
            let j = i + 1
            while (j < lines.length) {
              const currentLine = lines[j].trim()
              if (currentLine.includes('{') || currentLine.includes('[')) innerBracketCount++
              if (currentLine.includes('}') || currentLine.includes(']')) innerBracketCount--
              foundLines.push(j + 1)
              if (innerBracketCount === 0) break
              j++
            }
          }
        }
      }
    }
  }

  return [...new Set(foundLines)].sort((a, b) => a - b)
}

function highlightDifferences() {
  if (!leftEditor || !rightEditor) return

  try {
    const leftJson = JSON.parse(leftEditor.getValue())
    const rightJson = JSON.parse(rightEditor.getValue())
    
    // 清除现有装饰
    const oldLeftDecorations = leftEditor.getModel().getAllDecorations()
    const oldRightDecorations = rightEditor.getModel().getAllDecorations()
    leftEditor.deltaDecorations(oldLeftDecorations.map(d => d.id), [])
    rightEditor.deltaDecorations(oldRightDecorations.map(d => d.id), [])

    // 比较并高亮差异
    const differences = compareJSON(leftJson, rightJson)
    const leftDecorations = []
    const rightDecorations = []

    differences.forEach(diff => {
      const leftLineNumbers = findLineNumber(leftEditor, diff.path)
      const rightLineNumbers = findLineNumber(rightEditor, diff.path)

      leftLineNumbers.forEach(lineNumber => {
        leftDecorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: diff.type === 'removed' ? 'line-delete' : 'line-modified',
            linesDecorationsClassName: 'line-decoration',
            glyphMarginClassName: diff.type === 'removed' ? 'glyph-delete' : 'glyph-modified',
            hoverMessage: { value: getHoverMessage(diff, 'left') }
          }
        })
      })

      rightLineNumbers.forEach(lineNumber => {
        rightDecorations.push({
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: diff.type === 'added' ? 'line-insert' : 'line-modified',
            linesDecorationsClassName: 'line-decoration',
            glyphMarginClassName: diff.type === 'added' ? 'glyph-insert' : 'glyph-modified',
            hoverMessage: { value: getHoverMessage(diff, 'right') }
          }
        })
      })
    })

    leftEditor.deltaDecorations([], leftDecorations)
    rightEditor.deltaDecorations([], rightDecorations)
  } catch (e) {
    console.error('Error comparing JSON:', e)
  }
}

function getHoverMessage(diff, side) {
  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return JSON.stringify(value)
  }

  switch (diff.type) {
    case 'added':
      return `新增: ${formatValue(diff.value)}`
    case 'removed':
      return `删除: ${formatValue(diff.value)}`
    case 'modified':
      return side === 'left' 
        ? `原始值: ${formatValue(diff.oldValue)}`
        : `修改为: ${formatValue(diff.newValue)}`
    default:
      return ''
  }
}

function toggleCompareMode() {
  isCompareMode.value = !isCompareMode.value
  
  if (isCompareMode.value) {
    // 切换到对比模式，保持左侧编辑器，添加右侧编辑器
    setTimeout(() => {
      if (!rightEditor && rightEditorContainer.value) {
        initializeRightEditor()
        highlightDifferences()
      }
    })
  } else {
    // 切换回单编辑器模式，移除右侧编辑器
    if (rightEditor) {
      rightEditor.dispose()
      rightEditor = null
    }
  }
}

onMounted(() => {
  initializeMonaco()
})

onBeforeUnmount(() => {
  if (leftEditor) {
    leftEditor.dispose()
  }
  if (rightEditor) {
    rightEditor.dispose()
  }
})
</script>

<template>
  <div class="app-container">
    <div class="toolbar">
      <div class="tool-button" @click="handleFormat">
        <i class="mdi mdi-format-align-left"></i>
        <span>Format</span>
      </div>
      <div class="tool-button" @click="handleSort">
        <i class="mdi mdi-sort-alphabetical-ascending"></i>
        <span>Sort</span>
      </div>
      <div class="tool-button" :class="{ active: isCompareMode }" @click="toggleCompareMode">
        <i class="mdi mdi-compare"></i>
        <span>Compare</span>
      </div>
    </div>
    <div class="editor-container" :class="{ 'compare-mode': isCompareMode }">
      <div ref="leftEditorContainer" class="editor-component"></div>
      <div v-show="isCompareMode" ref="rightEditorContainer" class="editor-component"></div>
    </div>
  </div>
</template>

<style>
/* 重置默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.toolbar {
  width: 80px;
  background-color: #2c3e50;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.tool-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
  transition: background-color 0.3s;
}

.tool-button:hover, .tool-button.active {
  background-color: #34495e;
}

.tool-button i {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.tool-button span {
  font-size: 0.75rem;
}

.editor-container {
  flex: 1;
  padding: 1rem;
  background-color: #f8f9fa;
  overflow: hidden;
  display: flex;
  min-width: 0;
  gap: 1rem;
}

.editor-container.compare-mode {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.editor-component {
  flex: 1;
  height: 100%;
  overflow: hidden;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Monaco Editor 自定义样式 */
.editor-component :deep(.monaco-editor) {
  padding-top: 10px;
}

.editor-component :deep(.monaco-editor .margin) {
  background-color: #f8f9fa;
}

/* 差异视图样式 */
.line-modified {
  background-color: rgba(255, 220, 100, 0.2) !important;
}

.line-insert {
  background-color: rgba(155, 185, 85, 0.2) !important;
}

.line-delete {
  background-color: rgba(255, 100, 100, 0.2) !important;
}

.line-decoration {
  width: 5px !important;
}

.glyph-modified {
  background-color: #ffd700;
  width: 5px !important;
}

.glyph-insert {
  background-color: #9bb955;
  width: 5px !important;
}

.glyph-delete {
  background-color: #ff6464;
  width: 5px !important;
}

.editor-component :deep(.monaco-editor .line-numbers) {
  color: #666;
}
</style>
