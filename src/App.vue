<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import loader from '@monaco-editor/loader'
import '@mdi/font/css/materialdesignicons.css'
import { sortJSON } from './utils/sortJSON'
import { compareJSON } from './utils/compareJSON'
import { findLineNumber } from './utils/findLineNumber'

const isCompareMode = ref(false)
const leftEditorContainer = ref(null)
const rightEditorContainer = ref(null)
let leftEditor = null
let rightEditor = null
let monaco = null
const leftDecorations = ref([])
const rightDecorations = ref([])

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
    formatOnType: true,
    glyphMargin: true  // 启用装订线，以显示差异标记
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

function highlightDifferences() {
  if (!leftEditor || !rightEditor) return
  
  const leftContent = leftEditor.getValue()
  const rightContent = rightEditor.getValue()
  
  try {
    const leftJson = JSON.parse(leftContent)
    const rightJson = JSON.parse(rightContent)
    
    const differences = compareJSON(leftJson, rightJson)
    
    // Clear previous decorations
    leftDecorations.value = leftEditor.deltaDecorations(leftDecorations.value, [])
    rightDecorations.value = rightEditor.deltaDecorations(rightDecorations.value, [])
    
    const leftHighlights = []
    const rightHighlights = []
    
    // 存储差异的路径和相应的行号
    const diffPathToLines = new Map()
    const rightDiffPathToLines = new Map()
    
    differences.forEach(diff => {
      const leftLines = findLineNumber(leftContent, diff.path)
      const rightLines = findLineNumber(rightContent, diff.path)
      
      // 存储路径到行号的映射，以便点击时导航
      const pathKey = diff.path.join('.')
      diffPathToLines.set(pathKey, { leftLines, rightLines, diff })
      
      if (leftLines.length > 0 && (diff.type === 'removed' || diff.type === 'modified')) {
        leftHighlights.push({
          range: new monaco.Range(
            leftLines[0],
            1,
            leftLines[leftLines.length - 1],
            1
          ),
          options: {
            isWholeLine: true,
            className: diff.type === 'removed' ? 'removed-line' : 'modified-line',
            glyphMarginClassName: diff.type === 'removed' ? 'removed-glyph' : 'modified-glyph',
            hoverMessage: { value: getHoverMessage(diff, 'left') },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        })
      }
      
      if (rightLines.length > 0 && (diff.type === 'added' || diff.type === 'modified')) {
        rightHighlights.push({
          range: new monaco.Range(
            rightLines[0],
            1,
            rightLines[rightLines.length - 1],
            1
          ),
          options: {
            isWholeLine: true,
            className: diff.type === 'added' ? 'added-line' : 'modified-line',
            glyphMarginClassName: diff.type === 'added' ? 'added-glyph' : 'modified-glyph',
            hoverMessage: { value: getHoverMessage(diff, 'right') },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        })
      }
    })
    
    leftDecorations.value = leftEditor.deltaDecorations([], leftHighlights)
    rightDecorations.value = rightEditor.deltaDecorations([], rightHighlights)
    
    // 添加点击事件，点击一侧的差异会跳转到另一侧
    setupDiffNavigationEvents(diffPathToLines)
    
  } catch (error) {
    console.error('Error parsing JSON:', error)
  }
}

function getHoverMessage(diff, side) {
  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return JSON.stringify(value)
  }

  const pathStr = diff.path.join('.')

  switch (diff.type) {
    case 'added':
      return `新增属性 '${pathStr}': ${formatValue(diff.value)}`
    case 'removed':
      return `删除属性 '${pathStr}': ${formatValue(diff.value)}`
    case 'modified':
      return side === 'left' 
        ? `属性 '${pathStr}' 原始值: ${formatValue(diff.oldValue)}`
        : `属性 '${pathStr}' 修改为: ${formatValue(diff.newValue)}`
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

// 设置差异导航点击事件
function setupDiffNavigationEvents(diffPathToLines) {
  // 移除旧的事件处理器
  leftEditor.onMouseDown(null)
  rightEditor.onMouseDown(null)
  
  // 添加点击差异区域时的导航功能
  leftEditor.onMouseDown((e) => {
    handleEditorClick(e, leftEditor, rightEditor, diffPathToLines)
  })
  
  rightEditor.onMouseDown((e) => {
    handleEditorClick(e, rightEditor, leftEditor, diffPathToLines)
  })
}

// 处理编辑器中差异区域的点击
function handleEditorClick(e, sourceEditor, targetEditor, diffPathToLines) {
  if (!e.target || !e.target.position) return
  
  const lineNumber = e.target.position.lineNumber
  
  // 查找点击的行是否属于某个差异
  for (const [pathKey, { leftLines, rightLines, diff }] of diffPathToLines.entries()) {
    const isLeftEditor = sourceEditor === leftEditor
    const sourceLines = isLeftEditor ? leftLines : rightLines
    const targetLines = isLeftEditor ? rightLines : leftLines
    
    // 检查点击的行是否在差异范围内
    if (sourceLines.includes(lineNumber) || (sourceLines.length > 0 && lineNumber >= sourceLines[0] && lineNumber <= sourceLines[sourceLines.length - 1])) {
      // 如果对应的差异在另一侧存在，则跳转到那里
      if (targetLines.length > 0) {
        targetEditor.revealLineInCenter(targetLines[0])
        targetEditor.setPosition({ lineNumber: targetLines[0], column: 1 })
        targetEditor.focus()
      }
      break
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
  display: flex;
  overflow: hidden;
}

.editor-component {
  height: 100%;
  width: 100%;
  transition: width 0.3s;
}

.compare-mode .editor-component {
  width: 50%;
}

/* 差异高亮样式 */
.removed-line {
  background-color: rgba(255, 0, 0, 0.1);
  cursor: pointer;
}

.added-line {
  background-color: rgba(0, 255, 0, 0.1);
  cursor: pointer;
}

.modified-line {
  background-color: rgba(255, 165, 0, 0.1);
  cursor: pointer;
}

.removed-glyph {
  background-color: #f5485d;
  width: 5px !important;
  margin-left: 3px;
}

.added-glyph {
  background-color: #48d75f;
  width: 5px !important;
  margin-left: 3px;
}

.modified-glyph {
  background-color: #ffa500;
  width: 5px !important;
  margin-left: 3px;
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

.editor-component :deep(.monaco-editor .line-numbers) {
  color: #666;
}
</style>
