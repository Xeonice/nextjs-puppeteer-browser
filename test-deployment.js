#!/usr/bin/env node

/**
 * Vercel 部署测试脚本
 * 用于测试截图 API 在生产环境中的功能
 */

const https = require('https');
const http = require('http');

// 测试配置
const TEST_CONFIG = {
  // 本地测试
  local: {
    baseUrl: 'http://localhost:3000',
    name: '本地环境'
  },
  // Vercel 生产环境测试（替换为你的域名）
  production: {
    baseUrl: 'https://your-app.vercel.app',
    name: 'Vercel 生产环境'
  }
};

// 测试用例
const TEST_CASES = [
  {
    name: '基础截图 - Example.com',
    endpoint: '/api/screenshot',
    data: {
      url: 'https://example.com',
      width: 800,
      height: 600,
      quality: 80
    }
  },
  {
    name: '高级截图 - GitHub',
    endpoint: '/api/screenshot/advanced',
    data: {
      url: 'https://github.com',
      width: 1200,
      height: 800,
      fullPage: false,
      quality: 85,
      blockResources: ['font', 'media']
    }
  },
  {
    name: '百度截图测试',
    endpoint: '/api/screenshot/advanced',
    data: {
      url: 'https://www.baidu.com',
      width: 1024,
      height: 768,
      fullPage: true,
      quality: 90
    }
  }
];

/**
 * 发送 HTTP 请求
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 65000 // 65 秒超时
    };

    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: result
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 运行单个测试
 */
async function runTest(environment, testCase) {
  const { baseUrl, name: envName } = environment;
  const { name: testName, endpoint, data } = testCase;
  
  console.log(`\n🧪 测试: ${testName} (${envName})`);
  console.log(`📍 URL: ${baseUrl}${endpoint}`);
  console.log(`📊 数据: ${JSON.stringify(data, null, 2)}`);
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${baseUrl}${endpoint}`, data);
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  耗时: ${duration}ms`);
    console.log(`📈 状态码: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      if (response.body.success) {
        const screenshotSize = response.body.screenshot ? 
          Math.round(response.body.screenshot.length / 1024) : 0;
        console.log(`✅ 成功! 截图大小: ${screenshotSize}KB`);
        
        if (response.body.metadata) {
          console.log(`📋 元数据:`, {
            dimensions: response.body.metadata.dimensions,
            attempts: response.body.metadata.attempts,
            userAgent: response.body.metadata.userAgent?.substring(0, 50) + '...'
          });
        }
        
        return { success: true, duration, size: screenshotSize };
      } else {
        console.log(`❌ 失败: ${response.body.error}`);
        console.log(`🔍 详情: ${response.body.details}`);
        return { success: false, error: response.body.error };
      }
    } else {
      console.log(`❌ HTTP 错误: ${response.statusCode}`);
      console.log(`🔍 响应: ${JSON.stringify(response.body, null, 2)}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`⏱️  耗时: ${duration}ms`);
    console.log(`💥 错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始 Vercel 部署测试...\n');
  
  const results = {};
  
  for (const [envKey, environment] of Object.entries(TEST_CONFIG)) {
    console.log(`\n🌍 环境: ${environment.name}`);
    console.log('='.repeat(50));
    
    results[envKey] = {};
    
    for (const testCase of TEST_CASES) {
      const result = await runTest(environment, testCase);
      results[envKey][testCase.name] = result;
      
      // 测试间隔，避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 输出测试总结
  console.log('\n📊 测试总结');
  console.log('='.repeat(50));
  
  for (const [envKey, envResults] of Object.entries(results)) {
    const envName = TEST_CONFIG[envKey].name;
    console.log(`\n🌍 ${envName}:`);
    
    let successCount = 0;
    let totalDuration = 0;
    let totalSize = 0;
    
    for (const [testName, result] of Object.entries(envResults)) {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration || 0;
      const size = result.size || 0;
      
      console.log(`  ${status} ${testName}: ${duration}ms, ${size}KB`);
      
      if (result.success) {
        successCount++;
        totalDuration += duration;
        totalSize += size;
      }
    }
    
    const totalTests = Object.keys(envResults).length;
    const successRate = Math.round((successCount / totalTests) * 100);
    const avgDuration = successCount > 0 ? Math.round(totalDuration / successCount) : 0;
    
    console.log(`  📈 成功率: ${successRate}% (${successCount}/${totalTests})`);
    console.log(`  ⏱️  平均耗时: ${avgDuration}ms`);
    console.log(`  📦 总截图大小: ${totalSize}KB`);
  }
  
  console.log('\n🎉 测试完成!');
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, runTest, TEST_CASES, TEST_CONFIG }; 