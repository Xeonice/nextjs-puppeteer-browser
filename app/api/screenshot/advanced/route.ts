import { NextRequest, NextResponse } from 'next/server';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

// 更多的User-Agent轮换
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
];

// 网站特定的反爬虫配置
const ANTI_DETECTION_CONFIGS = {
  'baidu.com': {
    waitTime: 5000,
    scrollDelay: 2000,
    retryAttempts: 3,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }
  },
  'zhihu.com': {
    waitTime: 6000,
    scrollDelay: 3000,
    retryAttempts: 5,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    }
  },
  'toutiao.com': {
    waitTime: 7000,
    scrollDelay: 3500,
    retryAttempts: 4,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Ch-Ua-Full-Version-List': '"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.6099.109", "Google Chrome";v="120.0.6099.109"'
    }
  },
  'taobao.com': {
    waitTime: 4000,
    scrollDelay: 2500,
    retryAttempts: 4,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  },
  'default': {
    waitTime: 2000,
    scrollDelay: 1000,
    retryAttempts: 2,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  }
};

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getSiteConfig(url: string) {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    for (const [site, config] of Object.entries(ANTI_DETECTION_CONFIGS)) {
      if (domain.includes(site)) {
        return config;
      }
    }
    return ANTI_DETECTION_CONFIGS.default;
  } catch {
    return ANTI_DETECTION_CONFIGS.default;
  }
}

// 随机延迟函数
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// 模拟人类滚动行为
async function humanLikeScroll(page: Page, scrollDelay: number): Promise<void> {
  await page.evaluate(async (delay) => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = Math.floor(Math.random() * 200) + 100; // 随机滚动距离
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve(null);
        }
      }, delay + Math.random() * 200); // 随机延迟
    });
  }, scrollDelay);
}

// 添加更强的反检测脚本
async function addAntiDetectionScript(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    // 1. 覆盖 webdriver 检测
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // 2. 覆盖 automation 相关属性
    Object.defineProperty(window, 'outerHeight', {
      get: () => window.innerHeight,
    });
    
    Object.defineProperty(window, 'outerWidth', {
      get: () => window.innerWidth,
    });

    // 3. 模拟真实的插件
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format" },
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin"
        }
      ],
    });

    // 4. 覆盖 permissions API
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: 'denied' } as PermissionStatus) :
        originalQuery(parameters)
    );

    // 5. 覆盖 chrome 对象
    Object.defineProperty(window, 'chrome', {
      get: () => ({
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {
          isInstalled: false,
        }
      }),
    });

    // 6. 覆盖 Notification 权限
    Object.defineProperty(Notification, 'permission', {
      get: () => 'default',
    });

    // 7. 模拟真实的语言设置
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en-US', 'en'],
    });

    // 8. 覆盖 WebGL 指纹
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      // 返回常见的显卡信息
      if (parameter === 37445) {
        return 'Intel Open Source Technology Center';
      }
      if (parameter === 37446) {
        return 'Mesa DRI Intel(R) UHD Graphics (Coffeelake 3x8 GT2)';
      }
      return getParameter.call(this, parameter);
    };

    // 9. 随机化 canvas 指纹
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type, encoderOptions) {
      const dataURL = originalToDataURL.call(this, type, encoderOptions);
      // 轻微修改canvas数据
      return dataURL.replace(/data:image\/png;base64,/, 'data:image/png;base64,' + Math.random().toString(36).substr(2, 1));
    };
  });
}

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;
  
  try {
    const { 
      url, 
      width = 1920, 
      height = 1080, 
      fullPage = false, 
      quality = 80,
      waitForSelector,
      blockResources = [],
      customHeaders = {}
    } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const siteConfig = getSiteConfig(url);
    const userAgent = getRandomUserAgent();

    // 启动浏览器，使用更多反检测参数
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-blink-features=AutomationControlled',
        '--disable-ipc-flooding-protection',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-report-upload',
        '--disable-breakpad'
      ]
    });

    const context = await browser.newContext({
      viewport: { 
        width: width + Math.floor(Math.random() * 100), // 随机化视口
        height: height + Math.floor(Math.random() * 100) 
      },
      userAgent,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        ...siteConfig.headers,
        ...customHeaders
      }
    });

    // 添加反检测脚本
    await addAntiDetectionScript(context);

    const page = await context.newPage();

    // 设置页面超时
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    // 资源拦截
    await page.route('**/*', async (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      const url = request.url();

      // 阻止指定的资源类型
      if (blockResources.includes(resourceType)) {
        return route.abort();
      }

      // 阻止一些常见的分析和广告脚本
      if (url.includes('google-analytics') || 
          url.includes('googletagmanager') || 
          url.includes('doubleclick') ||
          url.includes('facebook.com/tr') ||
          url.includes('baidu.com/tj') ||
          url.includes('cnzz.com')) {
        return route.abort();
      }

      route.continue();
    });

    let attempt = 0;
    let screenshot: Buffer | null = null;

    // 重试机制
    while (attempt < siteConfig.retryAttempts && !screenshot) {
      try {
        attempt++;
        
        // 随机延迟
        await randomDelay(1000, 3000);

        // 导航到页面
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 45000
        });

        // 等待页面加载
        await page.waitForTimeout(siteConfig.waitTime);

        // 如果指定了选择器，等待该元素出现
        if (waitForSelector) {
          await page.waitForSelector(waitForSelector, { timeout: 10000 });
        }

        // 模拟人类行为：随机移动鼠标
        await page.mouse.move(
          Math.random() * width, 
          Math.random() * height
        );

        // 如果是全页截图，进行智能滚动
        if (fullPage) {
          await humanLikeScroll(page, siteConfig.scrollDelay);
          
          // 滚回顶部
          await page.evaluate(() => window.scrollTo(0, 0));
          await randomDelay(1000, 2000);
        }

        // 截图
        screenshot = await page.screenshot({
          type: 'jpeg',
          quality,
          fullPage,
          animations: 'disabled'
        });

        break; // 成功则跳出重试循环

      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error);
        
        if (attempt < siteConfig.retryAttempts) {
          // 等待后重试
          await randomDelay(2000, 5000);
          
          // 重新加载页面
          try {
            await page.reload({ waitUntil: 'domcontentloaded' });
          } catch (reloadError) {
            console.log('Reload failed, continuing with retry...');
          }
        } else {
          throw error;
        }
      }
    }

    if (!screenshot) {
      throw new Error('Failed to capture screenshot after all retry attempts');
    }

    await browser.close();

    // 返回结果
    const base64Screenshot = screenshot.toString('base64');

    return NextResponse.json({
      success: true,
      screenshot: `data:image/jpeg;base64,${base64Screenshot}`,
      metadata: {
        url,
        timestamp: new Date().toISOString(),
        dimensions: { width, height },
        fullPage,
        quality,
        attempts: attempt,
        userAgent
      }
    });

  } catch (error) {
    console.error('Advanced screenshot error:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to capture screenshot', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 