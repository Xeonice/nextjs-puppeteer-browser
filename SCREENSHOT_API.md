# 网页截图 API 文档

这是一个基于 Playwright 的网页截图 API，专门优化了对百度、知乎等反爬虫强的网站的支持。现在支持 Vercel Blob 存储，截图直接保存到云端。

## 功能特点

### 基础功能
- 支持完整页面截图和视口截图
- 可自定义图片质量和尺寸
- 支持 GET 和 POST 请求
- **🆕 Vercel Blob 存储**：截图直接保存到云端，返回访问 URL
- **🆕 快速模式**：支持 `fastMode` 参数，大幅减少等待时间
- 支持 Base64 回退机制（当 Blob 存储不可用时）

### 反爬虫特性
- 🛡️ **多层反检测机制**：覆盖 webdriver、plugins、chrome 对象等检测点
- 🔄 **User-Agent 轮换**：随机使用不同的浏览器标识
- 🎯 **网站特定配置**：针对百度、知乎、淘宝等网站的专门优化
- 🧠 **智能重试机制**：失败时自动重试，提高成功率
- 🌐 **请求头伪造**：模拟真实浏览器的完整请求头
- 📱 **设备指纹随机化**：随机化 Canvas、WebGL 等指纹信息

## API 接口

### 1. 基础截图接口

**端点**: `/api/screenshot`

#### POST 请求
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.baidu.com",
    "width": 1920,
    "height": 1080,
    "fullPage": false,
    "quality": 80
  }'
```

#### GET 请求
```bash
curl "http://localhost:3000/api/screenshot?url=https://www.baidu.com&width=1920&height=1080&fullPage=true&quality=80"
```

#### 请求参数
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| url | string | 必填 | 要截图的网址 |
| width | number | 1920 | 视口宽度 |
| height | number | 1080 | 视口高度 |
| fullPage | boolean | false | 是否截取完整页面 |
| quality | number | 80 | 图片质量 (10-100) |
| fastMode | boolean | false | **🆕** 快速模式，减少等待时间 |

#### 响应格式

**使用 Vercel Blob 存储时**：
```json
{
  "success": true,
  "url": "https://abc123.public.blob.vercel-storage.com/screenshot-baidu-com-2024-01-01T00-00-00-000Z-xyz789.jpeg",
  "downloadUrl": "https://abc123.public.blob.vercel-storage.com/screenshot-baidu-com-2024-01-01T00-00-00-000Z-xyz789.jpeg",
  "metadata": {
    "originalUrl": "https://www.baidu.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "dimensions": { "width": 1920, "height": 1080 },
    "fullPage": false,
    "quality": 80,
    "filename": "screenshot-baidu-com-2024-01-01T00-00-00-000Z-xyz789.jpeg",
    "storage": "vercel-blob"
  }
}
```

**回退到 Base64 时**：
```json
{
  "success": true,
  "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "metadata": {
    "url": "https://www.baidu.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "dimensions": { "width": 1920, "height": 1080 },
    "fullPage": false,
    "quality": 80,
    "storage": "base64-fallback",
    "blobError": "Error message if blob upload failed"
  }
}
```

### 2. 高级截图接口

**端点**: `/api/screenshot/advanced`

#### POST 请求
```bash
curl -X POST http://localhost:3000/api/screenshot/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.zhihu.com",
    "width": 1920,
    "height": 1080,
    "fullPage": true,
    "quality": 90,
    "waitForSelector": ".App",
    "blockResources": ["image", "font"],
    "customHeaders": {
      "X-Custom-Header": "value"
    }
  }'
```

#### 额外参数
| 参数 | 类型 | 说明 |
|------|------|------|
| waitForSelector | string | 等待指定CSS选择器的元素出现 |
| blockResources | string[] | 阻止加载的资源类型 |
| customHeaders | object | 自定义请求头 |

#### 响应格式
```json
{
  "success": true,
  "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "metadata": {
    "url": "https://www.zhihu.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "dimensions": { "width": 1920, "height": 1080 },
    "fullPage": true,
    "quality": 90,
    "attempts": 2,
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
  }
}
```

## 网站特定优化

### 百度 (baidu.com)
- **等待时间**: 5秒
- **重试次数**: 3次
- **特殊请求头**: 包含 Sec-Fetch-* 系列头部
- **滚动延迟**: 2秒

### 知乎 (zhihu.com)
- **等待时间**: 6秒
- **重试次数**: 5次
- **特殊请求头**: 包含 Sec-Ch-Ua 系列头部
- **滚动延迟**: 3秒

### 今日头条 (toutiao.com)
- **等待时间**: 7秒
- **重试次数**: 4次
- **特殊请求头**: 包含完整的 Sec-Ch-Ua 系列头部和 Full-Version-List
- **滚动延迟**: 3.5秒

### 淘宝 (taobao.com)
- **等待时间**: 2秒（优化后）
- **重试次数**: 2次（优化后）
- **滚动延迟**: 1.5秒（优化后）

## Blob 存储管理

### 3. 列出截图文件

**端点**: `/api/blob/list`

#### GET 请求
```bash
curl "http://localhost:3000/api/blob/list?limit=10&prefix=screenshot"
```

#### 请求参数
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | number | 10 | 返回文件数量限制 |
| prefix | string | screenshot | 文件名前缀过滤 |

#### 响应格式
```json
{
  "success": true,
  "blobs": [
    {
      "url": "https://abc123.public.blob.vercel-storage.com/screenshot-baidu-com-2024-01-01T00-00-00-000Z-xyz789.jpeg",
      "downloadUrl": "https://abc123.public.blob.vercel-storage.com/screenshot-baidu-com-2024-01-01T00-00-00-000Z-xyz789.jpeg",
      "pathname": "screenshot-baidu-com-2024-01-01T00-00-00-000Z-xyz789.jpeg",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 4. 删除截图文件

**端点**: `/api/blob/list`

#### DELETE 请求
```bash
curl -X DELETE "http://localhost:3000/api/blob/list?url=https://abc123.public.blob.vercel-storage.com/screenshot-xyz789.jpeg"
```

#### 请求参数
| 参数 | 类型 | 说明 |
|------|------|------|
| url | string | 要删除的文件 URL |

#### 响应格式
```json
{
  "success": true,
  "message": "Blob deleted successfully",
  "deletedUrl": "https://abc123.public.blob.vercel-storage.com/screenshot-xyz789.jpeg"
}
```

## 使用示例

### JavaScript/TypeScript
```javascript
async function takeScreenshot(url) {
  try {
    const response = await fetch('/api/screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        width: 1920,
        height: 1080,
        fullPage: true,
        quality: 85
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // 显示图片
      const img = document.createElement('img');
      img.src = data.screenshot;
      document.body.appendChild(img);
      
      // 或者下载图片
      const link = document.createElement('a');
      link.href = data.screenshot;
      link.download = 'screenshot.jpg';
      link.click();
    }
  } catch (error) {
    console.error('截图失败:', error);
  }
}

// 使用示例
takeScreenshot('https://www.baidu.com');
```

### Python
```python
import requests
import base64

def take_screenshot(url):
    response = requests.post('http://localhost:3000/api/screenshot', json={
        'url': url,
        'width': 1920,
        'height': 1080,
        'fullPage': True,
        'quality': 85
    })
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            # 解码 base64 图片
            image_data = data['screenshot'].split(',')[1]
            image_bytes = base64.b64decode(image_data)
            
            # 保存图片
            with open('screenshot.jpg', 'wb') as f:
                f.write(image_bytes)
            
            return True
    return False

# 使用示例
take_screenshot('https://www.zhihu.com')
```

### Shell/Bash
```bash
#!/bin/bash

# 基础截图
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.baidu.com","fullPage":true}' \
  | jq -r '.screenshot' \
  | sed 's/data:image\/jpeg;base64,//' \
  | base64 -d > screenshot.jpg

# 高级截图（知乎）
curl -X POST http://localhost:3000/api/screenshot/advanced \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.zhihu.com",
    "fullPage": true,
    "quality": 90,
    "blockResources": ["font", "media"]
  }' | jq -r '.screenshot' | sed 's/data:image\/jpeg;base64,//' | base64 -d > zhihu.jpg
```

## 错误处理

### 常见错误
- `URL is required`: 未提供 URL 参数
- `Failed to capture screenshot`: 截图失败，可能是网络问题或目标网站阻止访问
- `Timeout`: 页面加载超时

### 错误响应格式
```json
{
  "error": "Failed to capture screenshot",
  "details": "Navigation timeout of 30000ms exceeded"
}
```

## 性能优化建议

1. **资源阻止**: 使用 `blockResources` 参数阻止不必要的资源（如图片、字体）以提高速度
2. **质量调整**: 降低 `quality` 参数以减少文件大小
3. **视口优化**: 根据需要调整 `width` 和 `height`
4. **选择性截图**: 使用 `waitForSelector` 等待特定内容加载完成

## 注意事项

1. **合规使用**: 请确保遵守目标网站的robots.txt和使用条款
2. **频率控制**: 避免过于频繁的请求，以免被目标网站封禁
3. **资源消耗**: 截图操作会消耗较多内存和CPU资源
4. **网络依赖**: 需要稳定的网络连接访问目标网站

## 部署和启动

### 本地开发

1. 安装依赖:
```bash
npm install
```

2. 安装 Playwright 浏览器:
```bash
npx playwright install
```

3. 启动开发服务器:
```bash
npm run dev
```

4. 访问测试页面:
```
http://localhost:3000/screenshot
```

### Vercel 部署

项目已针对 Vercel 部署进行全面优化：

#### 特性
- **自动配置**: 包含 `vercel.json` 和 `next.config.ts` 配置文件
- **Chromium 兼容**: 使用 `@sparticuz/chromium` 提供 Vercel 兼容的浏览器二进制文件
- **函数优化**: API 路由配置了 60 秒超时限制
- **无需浏览器安装**: 生产环境自动使用兼容的 Chromium 版本

#### 部署步骤
1. **GitHub 集成** (推荐):
   - 将代码推送到 GitHub
   - 在 Vercel 控制台连接 GitHub 仓库
   - 自动部署和 CI/CD

2. **CLI 部署**:
```bash
npm install -g vercel
vercel --prod
```

3. **环境变量** (可选):
   - `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (已在 vercel.json 中配置)

#### Vercel 配置说明
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

#### 注意事项
- 免费版 Vercel 函数执行时间限制为 10 秒
- Pro 版支持 60 秒超时，推荐用于生产环境
- 首次冷启动可能需要额外时间加载 Chromium

## 技术栈

- **Next.js 15**: React 框架
- **Playwright**: 浏览器自动化
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架 