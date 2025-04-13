const fs = require('fs');
const path = require('path');

// 直接在全局作用域创建一些调试函数
console.log('preload.js 加载中...');
console.log('uTools 对象:', utools ? '存在' : '不存在');

// 直接调用一次通知测试
try {
  utools.showNotification('preload.js 已加载', 'JSON比较工具');
  console.log('测试通知已发送');
} catch (e) {
  console.error('测试通知失败:', e);
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
    
    // 直接调用通知
    try {
      utools.showNotification('文件已保存成功', 'JSON比较工具');
      console.log('保存通知发送成功');
    } catch (err) {
      console.error('保存通知发送失败:', err);
    }
    
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
    
    // 直接调用通知API
    try {
      utools.showNotification('内容已复制到剪贴板', 'JSON比较工具');
      console.log('复制通知发送成功');
    } catch (err) {
      console.error('复制通知发送失败:', err);
    }
    
    return { success: true };
  } catch (error) {
    console.error('复制失败:', error);
    return { success: false, error: error.message };
  }
};

// 重新封装通知功能，直接使用uTools API
window.showNotification = (message, title = 'JSON比较工具') => {
  console.log('发送通知:', title, message);
  try {
    // 直接调用uTools API
    utools.showNotification(message, title);
    console.log('通知发送成功');
    return true;
  } catch (error) {
    console.error('通知发送失败:', error);
    // 尝试第二种方法
    try {
      require('electron').remote.dialog.showMessageBox({
        type: 'info',
        title: title,
        message: message
      });
      console.log('通过Electron对话框显示通知');
      return true;
    } catch (e) {
      console.error('所有通知方法都失败:', e);
      return false;
    }
  }
};

// 为主进程导出通知方法，方便直接调用
window.utils = {
  showNotification: (message, title) => {
    return window.showNotification(message, title);
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