// 测试截图 API 的脚本
const fs = require('fs');

async function testScreenshotAPI() {
  const testUrls = [
    'https://www.baidu.com',
    'https://www.zhihu.com',
    'https://www.toutiao.com',
    'https://github.com',
    'https://www.google.com'
  ];

  console.log('🚀 开始测试截图 API...\n');

  for (const url of testUrls) {
    console.log(`📸 正在截图: ${url}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          width: 1920,
          height: 1080,
          fullPage: false,
          quality: 80
        })
      });

      const data = await response.json();

      if (data.success) {
        // 保存截图到文件
        const base64Data = data.screenshot.replace(/^data:image\/jpeg;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `screenshot-${new URL(url).hostname}-${Date.now()}.jpg`;
        
        fs.writeFileSync(filename, buffer);
        console.log(`✅ 截图成功: ${filename}`);
        console.log(`   尺寸: ${data.metadata.dimensions.width}x${data.metadata.dimensions.height}`);
        console.log(`   时间: ${data.metadata.timestamp}\n`);
      } else {
        console.log(`❌ 截图失败: ${data.error}\n`);
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}\n`);
    }
  }

  console.log('🎉 测试完成！');
}

async function testAdvancedAPI() {
  console.log('\n🔧 测试高级截图 API...\n');

  const url = 'https://www.zhihu.com';
  
  try {
    const response = await fetch('http://localhost:3000/api/screenshot/advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        width: 1920,
        height: 1080,
        fullPage: true,
        quality: 90,
        blockResources: ['font', 'media']
      })
    });

    const data = await response.json();

    if (data.success) {
      const base64Data = data.screenshot.replace(/^data:image\/jpeg;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `advanced-screenshot-${new URL(url).hostname}-${Date.now()}.jpg`;
      
      fs.writeFileSync(filename, buffer);
      console.log(`✅ 高级截图成功: ${filename}`);
      console.log(`   重试次数: ${data.metadata.attempts}`);
      console.log(`   User-Agent: ${data.metadata.userAgent.substring(0, 50)}...`);
      console.log(`   全页截图: ${data.metadata.fullPage}`);
    } else {
      console.log(`❌ 高级截图失败: ${data.error}`);
    }
  } catch (error) {
    console.log(`❌ 高级截图请求失败: ${error.message}`);
  }
}

// 检查服务器是否运行
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/screenshot?url=https://httpbin.org/status/200');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 主函数
async function main() {
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ 服务器未运行，请先启动开发服务器:');
    console.log('   npm run dev');
    return;
  }

  await testScreenshotAPI();
  await testAdvancedAPI();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testScreenshotAPI, testAdvancedAPI }; 