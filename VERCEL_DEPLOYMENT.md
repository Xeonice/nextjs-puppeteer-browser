# Vercel 部署指南

## 项目配置

### 1. 依赖包
- ✅ `@sparticuz/chromium` - Vercel 兼容的 Chromium 二进制文件
- ✅ `playwright` - 浏览器自动化库
- ✅ `next` - Next.js 框架

### 2. 配置文件

#### `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright', '@sparticuz/chromium'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'playwright'];
    }
    return config;
  },
};
```

#### `vercel.json`
```json
{
  "functions": {
    "app/api/screenshot/route.ts": { "maxDuration": 60 },
    "app/api/screenshot/advanced/route.ts": { "maxDuration": 60 }
  },
  "env": {
    "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "1"
  }
}
```

### 3. 环境检测
代码中包含环境检测逻辑：
```typescript
const isProduction = process.env.VERCEL_ENV === 'production';
```

## 部署流程

### 方式一：GitHub 集成（推荐）
1. 将代码推送到 GitHub 仓库
2. 在 Vercel 控制台连接仓库
3. 触发自动部署

### 方式二：CLI 部署
```bash
npm install -g vercel
vercel --prod
```

## 性能优化

### 1. 冷启动优化
- 使用轻量级的 `@sparticuz/chromium` 包
- 配置合适的函数超时时间
- 避免不必要的资源加载

### 2. 内存管理
- 及时关闭浏览器实例
- 使用资源阻止减少内存消耗
- 配置合适的视口大小

## 限制和注意事项

### Vercel 免费版限制
- 函数执行时间：10 秒
- 函数大小：50MB
- 内存：1GB

### Vercel Pro 版
- 函数执行时间：60 秒（已配置）
- 函数大小：250MB
- 内存：3GB

### 使用建议
1. 生产环境推荐使用 Pro 版
2. 测试复杂网站时注意超时设置
3. 监控函数执行时间和内存使用

## 故障排除

### 常见问题

#### 1. "spawn Unknown system error -8"
- **原因**: 本地开发环境与 @sparticuz/chromium 冲突
- **解决**: 使用环境检测，只在生产环境使用 @sparticuz/chromium

#### 2. 函数超时
- **原因**: 页面加载时间过长或网络延迟
- **解决**: 调整 vercel.json 中的 maxDuration 或优化页面加载策略

#### 3. 内存不足
- **原因**: 浏览器实例或页面占用内存过多
- **解决**: 使用资源阻止、减少并发请求、及时清理资源

#### 4. 包大小超限
- **原因**: 依赖包过大
- **解决**: 使用 serverExternalPackages 排除大型包

## 测试验证

### 本地测试
```bash
npm run dev
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### 生产测试
```bash
curl -X POST https://your-vercel-app.vercel.app/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## 监控和日志

### Vercel 控制台
- 查看函数日志
- 监控执行时间
- 查看错误报告

### 自定义监控
```typescript
console.log('Screenshot request:', { url, timestamp: new Date() });
console.log('Browser launch time:', launchTime);
console.log('Screenshot completed:', { success: true, duration });
```

## 最佳实践

1. **错误处理**: 添加完善的错误处理和重试机制
2. **缓存策略**: 考虑实现截图缓存减少重复请求
3. **安全性**: 验证 URL 参数，防止恶意请求
4. **性能监控**: 定期检查函数执行时间和成功率
5. **费用控制**: 监控 Vercel 使用量，避免超出预算

## 版本兼容性

- Next.js: 15.3.4+
- Playwright: 1.53.1+
- @sparticuz/chromium: 137.0.1+
- Node.js: 18+

## 支持的网站

已测试和优化的网站：
- ✅ 百度 (baidu.com)
- ✅ 知乎 (zhihu.com)
- ✅ 今日头条 (toutiao.com)
- ✅ 淘宝 (taobao.com)
- ✅ GitHub (github.com)
- ✅ Google (google.com) 