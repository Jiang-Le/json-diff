<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { initMonaco } from './utils/monacoConfig'
import '@mdi/font/css/materialdesignicons.css'
import { sortJSON } from './utils/sortJSON'
import { compareJSON } from './utils/compareJSON'
import { findLineNumber, buildLineNumberMap, pathToString } from './utils/findLineNumber'

// 创建一个简单的事件总线
if (typeof window.eventHub === 'undefined') {
  window.eventHub = {
    events: {},
    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data))
      }
    },
    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = []
      }
      this.events[event].push(callback)
    },
    off(event, callback) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(cb => cb !== callback)
      }
    }
  }
}

// 检查是否在uTools环境中运行
const isUTools = ref(typeof window.utools !== 'undefined')

const isCompareMode = ref(false)
const leftEditorContainer = ref(null)
const rightEditorContainer = ref(null)
let leftEditor = null
let rightEditor = null
let monaco = null
const leftDecorations = ref([])
const rightDecorations = ref([])
const leftFilePath = ref('')
const rightFilePath = ref('')
const fileChanged = ref(false)

// Toast 通知系统
const toast = ref({
  visible: false,
  message: '',
  type: 'info', // info, success, error
  timeout: null
})

// 显示 Toast 通知
function showToast(message, type = 'info', duration = 3000) {
  // 如果已有通知，先清除计时器
  if (toast.value.timeout) {
    clearTimeout(toast.value.timeout)
  }
  
  // 更新并显示通知
  toast.value.message = message
  toast.value.type = type
  toast.value.visible = true
  
  // 设置自动关闭
  toast.value.timeout = setTimeout(() => {
    hideToast()
  }, duration)
}

// 隐藏 Toast 通知
function hideToast() {
  toast.value.visible = false
}

const leftContent = ref({
  "config": {
    "name": "JSON Compare Demo",
    "version": "1.0.0",
    "description": "A comprehensive example to test JSON diff functionality"
  }
})

const rightContent = ref({
  "config": {
    "name": "JSON Compare Demo",
    "version": "2.0.0",
    "description": "An improved comprehensive example to test JSON diff functionality",
  }
})

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2)
}

// 加载左侧JSON文件
function handleLoadLeftFile() {
  if (!isUTools.value) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  const result = window.selectFile({
    title: '选择左侧JSON文件',
    filters: [{ name: 'JSON文件', extensions: ['json'] }],
    properties: ['openFile']
  })
  
  if (result.success) {
    leftFilePath.value = result.filePath
    const fileResult = window.readJSONFile(result.filePath)
    
    if (fileResult.success) {
      try {
        const jsonContent = JSON.parse(fileResult.content)
        if (leftEditor) {
          leftEditor.setValue(formatJSON(jsonContent))
          fileChanged.value = false
          if (isCompareMode.value && rightEditor) {
            highlightDifferences()
          }
        }
        showToast('已加载左侧JSON文件', 'success')
      } catch (e) {
        showToast('文件内容不是有效的JSON', 'error')
      }
    } else {
      showToast('无法读取文件: ' + fileResult.error, 'error')
    }
  }
}

// 加载右侧JSON文件
function handleLoadRightFile() {
  if (!isUTools.value) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  if (!isCompareMode.value) {
    toggleCompareMode()
  }
  
  const result = window.selectFile({
    title: '选择右侧JSON文件',
    filters: [{ name: 'JSON文件', extensions: ['json'] }],
    properties: ['openFile']
  })
  
  if (result.success) {
    rightFilePath.value = result.filePath
    const fileResult = window.readJSONFile(result.filePath)
    
    if (fileResult.success) {
      try {
        const jsonContent = JSON.parse(fileResult.content)
        if (rightEditor) {
          rightEditor.setValue(formatJSON(jsonContent))
          if (leftEditor) {
            highlightDifferences()
          }
        }
        showToast('已加载右侧JSON文件', 'success')
      } catch (e) {
        showToast('文件内容不是有效的JSON', 'error')
      }
    } else {
      showToast('无法读取文件: ' + fileResult.error, 'error')
    }
  }
}

// 保存左侧编辑器内容
function handleSaveLeftFile() {
  if (!isUTools.value || !leftEditor) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  let filePath = leftFilePath.value
  
  if (!filePath) {
    const result = window.selectFile({
      title: '保存JSON文件',
      filters: [{ name: 'JSON文件', extensions: ['json'] }],
      properties: ['saveFile']
    })
    
    if (result.success) {
      filePath = result.filePath
      leftFilePath.value = filePath
    } else {
      return
    }
  }
  
  try {
    const content = leftEditor.getValue()
    // 检查是否是有效的JSON
    JSON.parse(content)
    
    const saveResult = window.saveJSONFile(filePath, content)
    if (saveResult.success) {
      fileChanged.value = false
      showToast('文件已保存', 'success')
    } else {
      showToast('保存文件失败: ' + saveResult.error, 'error')
    }
  } catch (e) {
    showToast('内容不是有效的JSON，无法保存', 'error')
  }
}

// 保存右侧编辑器内容
function handleSaveRightFile() {
  if (!isUTools.value || !rightEditor) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  let filePath = rightFilePath.value
  
  if (!filePath) {
    const result = window.selectFile({
      title: '保存JSON文件',
      filters: [{ name: 'JSON文件', extensions: ['json'] }],
      properties: ['saveFile']
    })
    
    if (result.success) {
      filePath = result.filePath
      rightFilePath.value = filePath
    } else {
      return
    }
  }
  
  try {
    const content = rightEditor.getValue()
    // 检查是否是有效的JSON
    JSON.parse(content)
    
    const saveResult = window.saveJSONFile(filePath, content)
    if (saveResult.success) {
      showToast('文件已保存', 'success')
    } else {
      showToast('保存文件失败: ' + saveResult.error, 'error')
    }
  } catch (e) {
    showToast('内容不是有效的JSON，无法保存', 'error')
  }
}

function handleFormat() {
  try {
    if (isCompareMode.value) {
      if (leftEditor) {
        const leftContent = JSON.parse(leftEditor.getValue())
        leftEditor.setValue(formatJSON(leftContent))
        fileChanged.value = true
      }
      if (rightEditor) {
        const rightContent = JSON.parse(rightEditor.getValue())
        rightEditor.setValue(formatJSON(rightContent))
      }
    } else {
      if (leftEditor) {
        const content = JSON.parse(leftEditor.getValue())
        leftEditor.setValue(formatJSON(content))
        fileChanged.value = true
      }
    }
    showToast('JSON已格式化', 'success')
  } catch (e) {
    console.error('Invalid JSON:', e)
    showToast('无效的JSON格式', 'error')
  }
}

function handleSort() {
  try {
    if (isCompareMode.value) {
      if (leftEditor) {
        const leftContent = JSON.parse(leftEditor.getValue())
        const sortedLeft = sortJSON(leftContent)
        leftEditor.setValue(formatJSON(sortedLeft))
        fileChanged.value = true
      }
      if (rightEditor) {
        const rightContent = JSON.parse(rightEditor.getValue())
        const sortedRight = sortJSON(rightContent)
        rightEditor.setValue(formatJSON(sortedRight))
      }
    } else {
      if (leftEditor) {
        const content = JSON.parse(leftEditor.getValue())
        const sorted = sortJSON(content)
        leftEditor.setValue(formatJSON(sorted))
        fileChanged.value = true
      }
    }
    showToast('JSON已排序', 'success')
  } catch (e) {
    console.error('Invalid JSON:', e)
    showToast('无效的JSON格式', 'error')
  }
}

function handleCopy(side) {
  if (!isUTools.value) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  try {
    let content = ''
    if (side === 'left' && leftEditor) {
      content = leftEditor.getValue()
    } else if (side === 'right' && rightEditor) {
      content = rightEditor.getValue()
    }
    
    if (content) {
      if (window.copyToClipboard) {
        window.copyToClipboard(content)
        showToast('内容已复制到剪贴板', 'success')
      } else if (window.utools) {
        window.utools.copyText(content)
        showToast('内容已复制到剪贴板', 'success')
      } else {
        // 浏览器环境的备用方法
        navigator.clipboard.writeText(content).then(() => {
          showToast('内容已复制到剪贴板', 'success')
        })
      }
    }
  } catch (e) {
    console.error('复制失败:', e)
    showToast('复制失败', 'error')
  }
}

// 提取公共编辑器配置
const defaultEditorOptions = {
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
  glyphMargin: true
}

// 创建编辑器的通用函数
function createEditor(container, options = {}) {
  if (!container || !monaco) return null
  
  try {
    const editor = monaco.editor.create(container, {
      ...defaultEditorOptions,
      ...options
    })
    
    return editor
  } catch (error) {
    console.error('Failed to create editor:', error)
    showToast('编辑器创建失败', 'error')
    return null
  }
}

async function initializeMonaco() {
  try {
    monaco = await initMonaco()
    
    // 初始化左侧编辑器
    leftEditor = createEditor(leftEditorContainer.value, {
      value: formatJSON(leftContent.value),
      readOnly: false
    })
    
    if (!leftEditor) {
      throw new Error('Failed to create left editor')
    }
    
    // 设置左侧编辑器的内容变化监听
    leftEditor.onDidChangeModelContent(() => {
      try {
        fileChanged.value = true
        if (isCompareMode.value && rightEditor) {
          highlightDifferences()
        }
      } catch (e) {
        console.error('Invalid JSON in left editor:', e)
      }
    })
  } catch (error) {
    console.error('Monaco initialization failed:', error)
    showToast('编辑器加载失败，请刷新页面重试', 'error')
  }
}

function initializeRightEditor() {
  if (!isCompareMode.value || !rightEditorContainer.value) return
  
  rightEditor = createEditor(rightEditorContainer.value, {
    value: formatJSON(rightContent.value),
    readOnly: false
  })
  
  if (!rightEditor) return
  
  // 设置右侧编辑器的内容变化监听
  rightEditor.onDidChangeModelContent(() => {
    try {
      highlightDifferences()
    } catch (e) {
      console.error('Invalid JSON in right editor:', e)
    }
  })
  
  setupScrollSync()
}

function setupScrollSync() {
  if (!leftEditor || !rightEditor) return
  
  let isSyncing = false
  
  leftEditor.onDidScrollChange((e) => {
    if (isSyncing) return
    if (!rightEditor) return
    
    isSyncing = true
    
    rightEditor.setScrollTop(e.scrollTop)
    rightEditor.setScrollLeft(e.scrollLeft)

    setTimeout(() => {
      isSyncing = false
    }, 100)
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
    
    const leftLineMap = buildLineNumberMap(leftContent)
    const rightLineMap = buildLineNumberMap(rightContent)
    
    leftDecorations.value = leftEditor.deltaDecorations(leftDecorations.value, [])
    rightDecorations.value = rightEditor.deltaDecorations(rightDecorations.value, [])
    
    const leftHighlights = []
    const rightHighlights = []
    
    differences.forEach(diff => {
      const leftLines = findLineNumber(leftContent, diff.path, leftLineMap)
      const rightLines = findLineNumber(rightContent, diff.path, rightLineMap)
      
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
    setTimeout(() => {
      if (!rightEditor && rightEditorContainer.value) {
        initializeRightEditor()
        highlightDifferences()
      } else if (rightEditor) {
        setupScrollSync()
      }
    })
  } else {
    if (rightEditor) {
      rightEditor.dispose()
      rightEditor = null
    }
    // 关闭对比模式时清除左侧编辑器中的高亮装饰
    if (leftEditor) {
      leftDecorations.value = leftEditor.deltaDecorations(leftDecorations.value, [])
    }
  }
}

onMounted(() => {
  if (isUTools.value) {
    window.setWindowSize(1000, 700)
  }
  
  initializeMonaco()
  
  // 监听事件总线中的toast事件
  window.eventHub.on('show-toast', (data) => {
    showToast(data.message, data.type)
  })
  
  // 监听uTools窗口事件
  if (window.utools) {
    window.utools.onPluginEnter(({ code, type, payload }) => {
      console.log('Plugin entered with code:', code)
    })
    
    window.utools.onPluginOut(() => {
      // 插件被关闭时的处理
      if (fileChanged.value && leftFilePath.value) {
        // 可以在这里提示用户保存文件
      }
    })
  }
})

onBeforeUnmount(() => {
  // 清理事件监听
  window.eventHub.off('show-toast')
  
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
        <span>格式化</span>
      </div>
      <div class="tool-button" @click="handleSort">
        <i class="mdi mdi-sort-alphabetical-ascending"></i>
        <span>排序</span>
      </div>
      <div class="tool-button" :class="{ active: isCompareMode }" @click="toggleCompareMode">
        <i class="mdi mdi-compare"></i>
        <span>对比</span>
      </div>
      <div v-if="isUTools" class="tool-button" @click="handleLoadLeftFile">
        <i class="mdi mdi-file-upload"></i>
        <span>加载左侧</span>
      </div>
      <div v-if="isUTools && isCompareMode" class="tool-button" @click="handleLoadRightFile">
        <i class="mdi mdi-file-upload-outline"></i>
        <span>加载右侧</span>
      </div>
      <div v-if="isUTools" class="tool-button" @click="handleSaveLeftFile">
        <i class="mdi mdi-content-save"></i>
        <span>保存左侧</span>
      </div>
      <div v-if="isUTools && isCompareMode" class="tool-button" @click="handleSaveRightFile">
        <i class="mdi mdi-content-save-outline"></i>
        <span>保存右侧</span>
      </div>
      <div v-if="isUTools" class="tool-button" @click="handleCopy('left')">
        <i class="mdi mdi-content-copy"></i>
        <span>复制左侧</span>
      </div>
      <div v-if="isUTools && isCompareMode" class="tool-button" @click="handleCopy('right')">
        <i class="mdi mdi-content-copy"></i>
        <span>复制右侧</span>
      </div>
    </div>
    <div class="editor-container" :class="{ 'compare-mode': isCompareMode }">
      <div ref="leftEditorContainer" class="editor-component"></div>
      <div v-show="isCompareMode" ref="rightEditorContainer" class="editor-component"></div>
    </div>
    
    <!-- Toast 通知组件 -->
    <transition name="toast-fade">
      <div v-if="toast.visible" class="toast-container" :class="toast.type">
        <div class="toast-icon">
          <i class="mdi" :class="{
            'mdi-check-circle': toast.type === 'success',
            'mdi-alert-circle': toast.type === 'error',
            'mdi-information': toast.type === 'info'
          }"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <div class="toast-close" @click="hideToast">
          <i class="mdi mdi-close"></i>
        </div>
      </div>
    </transition>
  </div>
</template>

<style>
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
  width: 65px;
  background-color: #2c3e50;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tool-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  cursor: pointer;
  padding: 0.3rem;
  width: 100%;
  transition: background-color 0.3s;
}

.tool-button:hover, .tool-button.active {
  background-color: #34495e;
}

.tool-button i {
  font-size: 1.2rem;
  margin-bottom: 0.15rem;
}

.tool-button span {
  font-size: 0.7rem;
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

/* Toast 样式 */
.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 250px;
  max-width: 600px;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  color: white;
}

.toast-container.success {
  background-color: #4caf50;
}

.toast-container.error {
  background-color: #f44336;
}

.toast-container.info {
  background-color: #2196f3;
}

.toast-icon {
  margin-right: 12px;
  font-size: 1.4rem;
}

.toast-message {
  flex: 1;
  font-size: 0.9rem;
}

.toast-close {
  margin-left: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast 动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.removed-line {
  background-color: rgba(255, 0, 0, 0.1);
}

.added-line {
  background-color: rgba(0, 255, 0, 0.1);
}

.modified-line {
  background-color: rgba(255, 165, 0, 0.1);
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

.editor-component :deep(.monaco-editor) {
  padding-top: 10px;
}

.editor-component :deep(.monaco-editor .margin) {
  background-color: #f8f9fa;
}

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
