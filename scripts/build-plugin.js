/**
 * uTools插件打包脚本
 * 将构建后的文件打包为upx格式
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// 插件目录
const PLUGIN_DIR = path.resolve(__dirname, '../dist');
// 输出目录
const OUTPUT_DIR = path.resolve(__dirname, '../release');
// 读取插件信息
const pluginInfo = require('../plugin.json');
// 打包文件名
const PLUGIN_NAME = `${pluginInfo.name}-v${pluginInfo.version}.upx`;

async function main() {
  try {
    // 确保输出目录存在
    fs.ensureDirSync(OUTPUT_DIR);
    
    // 创建输出流
    const output = fs.createWriteStream(path.join(OUTPUT_DIR, PLUGIN_NAME));
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    // 监听完成事件
    output.on('close', () => {
      const size = archive.pointer();
      console.log(`打包完成: ${PLUGIN_NAME}`);
      console.log(`文件大小: ${(size / 1024 / 1024).toFixed(2)} MB`);
    });
    
    // 监听警告
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('警告:', err);
      } else {
        throw err;
      }
    });
    
    // 监听错误
    archive.on('error', (err) => {
      throw err;
    });
    
    // 连接输出流
    archive.pipe(output);
    
    // 添加整个dist目录
    archive.directory(PLUGIN_DIR, false);
    
    // 完成打包
    await archive.finalize();
    
    console.log('插件已打包完成，可以在uTools开发者工具中加载测试');
    
  } catch (err) {
    console.error('打包失败:', err);
    process.exit(1);
  }
}

main(); 