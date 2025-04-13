// 检查是否在Node.js环境
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

// 条件导入Node.js模块
let fs, path;
if (isNodeEnvironment) {
  try {
    fs = require('fs');
    path = require('path');
    console.log('Node.js 模块已加载');
  } catch (e) {
    console.error('无法加载Node.js模块:', e);
  }
}

// 直接在全局作用域创建一些调试函数
console.log('preload.js 加载中...');

// 检查uTools对象是否可用
const isUToolsAvailable = typeof window !== 'undefined' && window.utools;
console.log('uTools 对象:', isUToolsAvailable ? '存在' : '不存在');

// 记录启动日志
try {
  console.log('preload.js 已加载成功');
} catch (e) {
  console.error('preload.js 加载出错:', e);
}

// 读取JSON文件
window.readJSONFile = (filePath) => {
  if (!isNodeEnvironment || !fs) {
    console.error('无法读取文件: Node.js环境不可用');
    return { success: false, error: 'Node.js环境不可用' };
  }
  
  try {
    console.log('开始读取文件:', filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('文件读取成功');
    return { success: true, content };
  } catch (error) {
    console.error('文件读取失败:', error);
    return { success: false, error: error.message };
  }
};

// 将JSON内容保存到文件
window.saveJSONFile = (filePath, content) => {
  if (!isNodeEnvironment || !fs) {
    console.error('无法保存文件: Node.js环境不可用');
    return { success: false, error: 'Node.js环境不可用' };
  }
  
  try {
    console.log('开始保存文件:', filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('文件保存成功');
    
    return { success: true };
  } catch (error) {
    console.error('文件保存失败:', error);
    return { success: false, error: error.message };
  }
};

// 选择文件
window.selectFile = (options) => {
  if (!isUToolsAvailable) {
    console.error('无法选择文件: uTools环境不可用');
    return { success: false, error: 'uTools环境不可用' };
  }
  
  console.log('调用文件选择...');
  try {
    const filePaths = window.utools.showOpenDialog(options);
    console.log('文件选择结果:', filePaths);
    if (filePaths && filePaths.length > 0) {
      return { success: true, filePath: filePaths[0] };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('文件选择错误:', error);
    return { success: false, error: error.message };
  }
};

// 复制内容到剪贴板
window.copyToClipboard = (text) => {
  if (!isUToolsAvailable) {
    console.error('无法复制到剪贴板: uTools环境不可用');
    // 尝试使用浏览器API
    try {
      navigator.clipboard.writeText(text);
      console.log('使用浏览器API复制成功');
      return { success: true };
    } catch (e) {
      console.error('复制失败:', e);
      return { success: false, error: '复制API不可用' };
    }
  }
  
  console.log('复制到剪贴板...');
  try {
    window.utools.copyText(text);
    console.log('复制成功');
    
    return { success: true };
  } catch (error) {
    console.error('复制失败:', error);
    return { success: false, error: error.message };
  }
};

// 设置窗口大小
window.setWindowSize = (width, height) => {
  if (!isUToolsAvailable) {
    console.error('无法设置窗口大小: uTools环境不可用');
    return { success: false, error: 'uTools环境不可用' };
  }
  
  console.log('设置窗口大小:', width, height);
  try {
    // 使用正确的 API: window.utools.setExpendHeight 或 setMainWindowSize
    if (typeof window.utools.setMainWindowSize === 'function') {
      window.utools.setMainWindowSize({ width, height });
    } else if (typeof window.utools.setExpendHeight === 'function') {
      // 部分版本的 uTools 使用这个 API
      window.utools.setExpendHeight(height);
      // 注意：这个 API 只能设置高度，无法设置宽度
    } else {
      throw new Error('uTools 设置窗口大小的 API 不可用');
    }
    
    console.log('窗口大小设置成功');
    return { success: true };
  } catch (error) {
    console.error('窗口大小设置失败:', error);
    return { success: false, error: error.message };
  }
};

// 创建事件总线（如果不存在）
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
  };
  console.log('事件总线已初始化');
} 