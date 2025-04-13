import loader from '@monaco-editor/loader';
import * as monaco from 'monaco-editor';

// 配置Monaco编辑器加载器
export function configureMonacoLoader() {
  // 检查是否运行在uTools环境中
  const isUTools = typeof window !== 'undefined' && window.utools;
  
  if (isUTools) {
    // 在uTools环境中，直接使用我们打包的Monaco编辑器
    loader.config({
      monaco: monaco
    });
    console.log('已为uTools环境配置Monaco编辑器，使用本地打包版本');
  }
  
  return loader;
}

// 初始化Monaco编辑器
export async function initMonaco() {
  try {
    // 对于uTools环境，直接返回导入的monaco对象
    if (typeof window !== 'undefined' && window.utools) {
      return monaco;
    }
    
    const configuredLoader = configureMonacoLoader();
    const monacoInstance = await configuredLoader.init();
    return monacoInstance;
  } catch (error) {
    console.error('Monaco编辑器加载失败:', error);
    throw error;
  }
} 