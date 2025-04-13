/**
 * 清理脚本
 * 删除构建产生的文件和临时文件
 */

const fs = require('fs-extra');
const path = require('path');

// 项目根目录
const ROOT_DIR = path.resolve(__dirname, '../');

// 需要清理的目录
const DIRS_TO_CLEAN = [
  'dist',        // Vite 构建输出
  'release',     // 插件打包输出
  'coverage',    // 测试覆盖率报告
];

// 需要清理的文件模式
const FILE_PATTERNS = [
  '*.log',       // 日志文件
  '*.tsbuildinfo', // TypeScript build info
];

async function cleanDirectories() {
  for (const dir of DIRS_TO_CLEAN) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`清理目录: ${dir}`);
      await fs.remove(dirPath);
    }
  }
}

async function cleanFiles() {
  for (const pattern of FILE_PATTERNS) {
    // 简单模式匹配，仅处理根目录下的文件
    if (pattern.includes('*')) {
      const ext = pattern.replace('*', '');
      const files = fs.readdirSync(ROOT_DIR);
      
      for (const file of files) {
        const filePath = path.join(ROOT_DIR, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile() && file.endsWith(ext)) {
          console.log(`清理文件: ${file}`);
          await fs.remove(filePath);
        }
      }
    }
  }
}

async function main() {
  try {
    console.log('开始清理项目...');
    
    await cleanDirectories();
    await cleanFiles();
    
    console.log('清理完成！');
  } catch (err) {
    console.error('清理过程中出错:', err);
    process.exit(1);
  }
}

main(); 