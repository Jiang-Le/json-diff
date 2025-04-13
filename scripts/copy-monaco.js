/**
 * 复制资源文件到dist目录
 * 确保在uTools环境中可以正确加载图标和编辑器
 */

const fs = require('fs-extra');
const path = require('path');

// 目录路径
const NODE_MODULES_DIR = path.resolve(__dirname, '../node_modules');
const DIST_DIR = path.resolve(__dirname, '../dist');

// 复制 Monaco 编辑器资源
async function copyMonacoResources() {
  try {
    console.log('开始复制 Monaco 编辑器资源...');
    
    // 创建目标目录
    const monacoDestDir = path.resolve(DIST_DIR, 'assets/monaco-editor');
    await fs.ensureDir(monacoDestDir);
    
    // 确保代码已经正确打包，直接使用打包后的文件，不需要从node_modules目录复制
    console.log('已使用vite打包Monaco编辑器，无需额外复制文件');
    
    // 输出一个加载帮助文件，在编辑器加载失败时的回退策略
    const helperScript = `
      // Monaco编辑器加载帮助脚本
      window.MonacoEnvironment = {
        getWorkerUrl: function(moduleId, label) {
          return './editor.worker.js';
        }
      };
    `;
    
    fs.writeFileSync(path.resolve(DIST_DIR, 'monaco-helper.js'), helperScript);
    console.log('已创建Monaco帮助脚本文件');
    
    return true;
  } catch (err) {
    console.error('复制Monaco编辑器资源失败:', err);
    return false;
  }
}

// 复制Material Design Icons字体文件到更容易引用的位置
async function copyMDIFonts() {
  try {
    console.log('开始复制MDI字体文件...');
    
    const MDI_SRC_DIR = path.resolve(NODE_MODULES_DIR, '@mdi/font/fonts');
    const MDI_DEST_DIR = path.resolve(DIST_DIR, 'assets');
    
    // 确保目标目录存在
    await fs.ensureDir(MDI_DEST_DIR);
    
    // 复制字体文件
    const fontFiles = [
      'materialdesignicons-webfont.eot',
      'materialdesignicons-webfont.ttf',
      'materialdesignicons-webfont.woff',
      'materialdesignicons-webfont.woff2'
    ];
    
    for (const file of fontFiles) {
      const srcPath = path.resolve(MDI_SRC_DIR, file);
      const destPath = path.resolve(MDI_DEST_DIR, file);
      
      if (fs.existsSync(srcPath)) {
        await fs.copy(srcPath, destPath);
        console.log(`已复制: ${file}`);
      } else {
        console.warn(`文件不存在: ${srcPath}`);
      }
    }
    
    console.log('MDI字体文件已复制到dist目录');
    return true;
  } catch (err) {
    console.error('复制MDI字体文件失败:', err);
    return false;
  }
}

// 修改index.html，添加Monaco帮助脚本引用
async function updateIndexHtml() {
  try {
    const htmlPath = path.resolve(DIST_DIR, 'index.html');
    if (fs.existsSync(htmlPath)) {
      let content = fs.readFileSync(htmlPath, 'utf8');
      
      // 在head标签中添加monaco-helper.js引用
      if (!content.includes('monaco-helper.js')) {
        content = content.replace(
          '</head>',
          '  <script src="./monaco-helper.js"></script>\n  </head>'
        );
        fs.writeFileSync(htmlPath, content);
        console.log('已更新index.html添加Monaco帮助脚本引用');
      }
    }
    return true;
  } catch (err) {
    console.error('更新index.html失败:', err);
    return false;
  }
}

async function main() {
  try {
    const monacoSuccess = await copyMonacoResources();
    const fontsSuccess = await copyMDIFonts();
    const htmlSuccess = await updateIndexHtml();
    
    if (monacoSuccess && fontsSuccess && htmlSuccess) {
      console.log('所有资源复制和更新完成');
    } else {
      console.warn('资源复制和更新过程存在警告，请检查输出日志');
    }
  } catch (err) {
    console.error('资源复制过程出错:', err);
    process.exit(1);
  }
}

main(); 