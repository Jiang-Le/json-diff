const fs = require('fs');
const path = require('path');

// 直接在全局作用域创建一些调试函数
console.log('preload.js 加载中...');
console.log('uTools 对象:', utools ? '存在' : '不存在');

// 移除系统通知测试
try {
  // 记录启动日志
  console.log('preload.js 已加载成功');
} catch (e) {
  console.error('preload.js 加载出错:', e);
}

// 读取JSON文件
window.readJSONFile = (filePath) => {
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
  try {
    console.log('开始保存文件:', filePath);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('文件保存成功');
    
    // 移除系统通知调用，让Vue应用处理通知
    return { success: true };
  } catch (error) {
    console.error('文件保存失败:', error);
    return { success: false, error: error.message };
  }
};

// 选择文件
window.selectFile = (options) => {
  console.log('调用文件选择...');
  try {
    const filePaths = utools.showOpenDialog(options);
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
  console.log('复制到剪贴板...');
  try {
    utools.copyText(text);
    console.log('复制成功');
    
    // 移除系统通知调用，让Vue应用处理通知
    return { success: true };
  } catch (error) {
    console.error('复制失败:', error);
    return { success: false, error: error.message };
  }
};

// 设置窗口大小
window.setWindowSize = (width, height) => {
  console.log('设置窗口大小:', width, height);
  try {
    utools.setExpendSize(width, height);
    console.log('窗口大小设置成功');
    return { success: true };
  } catch (error) {
    console.error('窗口大小设置失败:', error);
    return { success: false, error: error.message };
  }
}; 