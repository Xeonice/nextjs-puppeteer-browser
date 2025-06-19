# Vercel 部署故障排除指南

## 常见错误及解决方案

### 1. "@sparticuz/chromium/bin" 目录不存在错误

**错误信息**:
```
The input directory "/var/task/node_modules/@sparticuz/chromium/bin" does not exist. Please provide the location of the brotli files.
```

**原因**: @sparticuz/chromium 包在 Vercel 环境中的二进制文件路径问题。

**解决方案**:

#### 方案 A: 使用远程 Chromium 二进制文件（推荐）
项目已配置使用远程 Chromium 二进制文件：
```typescript
const remoteChromiumUrl = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';
launchOptions.executablePath = await chromiumBinary.default.executablePath(remoteChromiumUrl);
```

#### 方案 B: 切换到 Puppeteer Core + Chrome AWS Lambda
如果远程方案仍有问题，可以切换到更稳定的组合：

1. 安装依赖：
```bash
npm uninstall @sparticuz/chromium
npm install chrome-aws-lambda@10.1.0 puppeteer-core@10.1.0
```

2. 更新代码：
```typescript
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath,
  headless: chromium.headless,
});
```

#### 方案 C: 使用 Browserless 服务
对于高频使用，推荐使用专业的浏览器服务：
```typescript
const browser = await playwright.chromium.connect({
  wsEndpoint: 'wss://chrome.browserless.io?token=YOUR_TOKEN'
});
```

### 2. 函数超时错误

**错误信息**: 504 Gateway Timeout

**解决方案**:
1. 确保 `vercel.json` 配置了足够的超时时间
2. 升级到 Vercel Pro 获得 60 秒超时
3. 优化页面加载策略：
   - 使用 `blockResources` 阻止不必要资源
   - 减少等待时间
   - 使用更小的视口尺寸

### 3. 内存不足错误

**解决方案**:
1. 在 `vercel.json` 中增加内存配置：
```json
{
  "functions": {
    "app/api/screenshot/route.ts": {
      "memory": 1024
    }
  }
}
```

2. 优化浏览器参数：
```typescript
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--single-process',
  '--no-zygote'
]
```

### 4. 包大小超限错误

**错误信息**: Serverless Function exceeds the maximum size limit

**解决方案**:
1. 使用 `serverExternalPackages` 排除大型包
2. 使用动态导入减少包大小
3. 考虑使用 `@sparticuz/chromium-min` 替代完整版本

## 环境变量配置

### 必需的环境变量
```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
CHROMIUM_PATH=""
```

### 可选的环境变量
```bash
# 用于调试
DEBUG=pw:*
# 设置用户代理
USER_AGENT="Mozilla/5.0 (compatible; ScreenshotBot/1.0)"
```

## 部署前检查清单

### 1. 依赖检查
- [ ] `@sparticuz/chromium` 已安装
- [ ] `playwright` 已安装
- [ ] `next.config.ts` 已配置 `serverExternalPackages`

### 2. 配置文件检查
- [ ] `vercel.json` 存在且配置正确
- [ ] 函数超时时间已设置（推荐 60 秒）
- [ ] 内存限制已设置（推荐 1024MB）

### 3. 代码检查
- [ ] 使用环境检测 `process.env.VERCEL_ENV === 'production'`
- [ ] 使用动态导入加载 @sparticuz/chromium
- [ ] 包含错误处理和回退机制
- [ ] 及时关闭浏览器实例

### 4. 测试检查
- [ ] 本地构建成功 `npm run build`
- [ ] 本地开发环境正常 `npm run dev`
- [ ] API 端点响应正常

## 性能优化建议

### 1. 冷启动优化
```typescript
// 预热浏览器实例
let browserInstance: Browser | null = null;

export async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await createBrowser();
  }
  return browserInstance;
}
```

### 2. 并发控制
```typescript
// 限制并发请求数量
const MAX_CONCURRENT = 3;
const semaphore = new Semaphore(MAX_CONCURRENT);

await semaphore.acquire();
try {
  // 截图逻辑
} finally {
  semaphore.release();
}
```

### 3. 缓存策略
```typescript
// 简单的内存缓存
const cache = new Map();
const cacheKey = `${url}-${width}-${height}`;

if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

## 监控和调试

### 1. 日志记录
```typescript
console.log('Screenshot request:', { 
  url, 
  timestamp: new Date().toISOString(),
  userAgent: req.headers['user-agent']
});

console.time('screenshot-duration');
// 截图逻辑
console.timeEnd('screenshot-duration');
```

### 2. 错误跟踪
```typescript
try {
  // 截图逻辑
} catch (error) {
  console.error('Screenshot failed:', {
    error: error.message,
    stack: error.stack,
    url,
    timestamp: new Date().toISOString()
  });
  
  // 发送到错误跟踪服务
  // await sendToSentry(error);
}
```

### 3. 性能监控
```typescript
const startTime = Date.now();
// 截图逻辑
const duration = Date.now() - startTime;

console.log('Performance metrics:', {
  duration,
  memoryUsage: process.memoryUsage(),
  url
});
```

## 生产环境最佳实践

1. **使用 Vercel Pro**: 获得更长的超时时间和更多内存
2. **实现重试机制**: 对失败的请求进行重试
3. **添加速率限制**: 防止滥用和过载
4. **监控使用情况**: 跟踪成功率和响应时间
5. **定期更新依赖**: 保持 Chromium 版本最新
6. **备用方案**: 准备降级策略和备用服务

## 联系支持

如果问题仍然存在：
1. 检查 Vercel 控制台的函数日志
2. 查看 GitHub Issues 寻找类似问题
3. 考虑使用专业的浏览器自动化服务 