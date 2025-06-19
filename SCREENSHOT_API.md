# 网页截图 API 文档

这是一个基于 Playwright 的网页截图 API，专门优化了对百度、知乎等反爬虫强的网站的支持。

## 功能特点

### 基础功能
- 支持完整页面截图和视口截图
- 可自定义图片质量和尺寸
- 支持 GET 和 POST 请求
- 返回 Base64 编码的图片

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

#### 响应格式
```json
{
  "success": true,
  "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "metadata": {
    "url": "https://www.baidu.com",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "dimensions": { "width": 1920, "height": 1080 },
    "fullPage": false,
    "quality": 80
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
- **等待时间**: 4秒
- **重试次数**: 4次
- **滚动延迟**: 2.5秒

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

## 技术栈

- **Next.js 15**: React 框架
- **Playwright**: 浏览器自动化
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架 