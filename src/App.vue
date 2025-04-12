<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { createJSONEditor } from 'vanilla-jsoneditor'
import '@fortawesome/fontawesome-free/css/all.css'

const editorContainer = ref(null)
let editor = null

const initialContent = {
  text: undefined,
  json: {
    name: "JSON Diff Tool",
    description: "A tool to compare JSON files",
    version: "1.0.0"
  }
}

onMounted(() => {
  editor = createJSONEditor({
    target: editorContainer.value,
    props: {
      content: initialContent,
      onChange: (updatedContent, previousContent, { contentErrors, patchResult }) => {
        console.log('JSON changed:', updatedContent)
      }
    }
  })
})

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
  }
})
</script>

<template>
  <div class="app-container">
    <div class="toolbar">
      <div class="tool-button">
        <i class="fas fa-file"></i>
        <span>New</span>
      </div>
      <div class="tool-button">
        <i class="fas fa-folder-open"></i>
        <span>Open</span>
      </div>
      <div class="tool-button">
        <i class="fas fa-save"></i>
        <span>Save</span>
      </div>
      <div class="tool-button">
        <i class="fas fa-sync"></i>
        <span>Compare</span>
      </div>
      <div class="tool-button">
        <i class="fas fa-cog"></i>
        <span>Settings</span>
      </div>
    </div>
    <div class="editor-container">
      <div ref="editorContainer" class="json-editor-component"></div>
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

.tool-button:hover {
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
  min-width: 0; /* 防止flex子项溢出 */
}

.json-editor-component {
  flex: 1;
  height: 100%;
  overflow: auto;
  min-width: 0; /* 防止flex子项溢出 */
}

/* 自定义编辑器样式 */
:root {
  --jse-theme-color: #2c3e50;
  --jse-theme-color-highlight: #34495e;
}

.json-editor-component :deep(.jse-main) {
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 100%;
}

.json-editor-component :deep(.jse-main) button {
  background-color: var(--jse-theme-color);
  color: white;
}

.json-editor-component :deep(.jse-main) button:hover {
  background-color: var(--jse-theme-color-highlight);
}
</style>
