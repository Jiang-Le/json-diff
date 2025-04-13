import * as monaco from 'monaco-editor';

// 初始化Monaco编辑器
export async function initMonaco() {
  try {
    // 直接返回monaco实例，因为vite-plugin-monaco-editor已经处理了加载过程
    return monaco;
  } catch (error) {
    console.error('Monaco编辑器加载失败:', error);
    throw error;
  }
} 