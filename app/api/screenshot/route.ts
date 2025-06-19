import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { put } from '@vercel/blob';

// 常见的User-Agent列表
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15'
];

// 针对特定网站的配置 - 优化版本，减少等待时间
const SITE_CONFIGS = {
  'baidu.com': {
    waitTime: 2000, // 从3秒减少到2秒
    userAgent: USER_AGENTS[0],
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  },
  'zhihu.com': {
    waitTime: 2500, // 从4秒减少到2.5秒
    userAgent: USER_AGENTS[0],
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    }
  },
  'toutiao.com': {
    waitTime: 3000, // 从5秒减少到3秒
    userAgent: USER_AGENTS[0],
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
      'Sec-Ch-Ua-Platform': '"macOS"'
    }
  },
  'default': {
    waitTime: 1500, // 从2秒减少到1.5秒
    userAgent: USER_AGENTS[0],
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  }
};

function getSiteConfig(url: string) {
  try {
    const domain = new URL(url).hostname;
    for (const [site, config] of Object.entries(SITE_CONFIGS)) {
      if (domain.includes(site)) {
        return config;
      }
    }
    return SITE_CONFIGS.default;
  } catch {
    return SITE_CONFIGS.default;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, width = 1920, height = 1080, fullPage = false, quality = 80, fastMode = false } = await request.json();

    if (!url) {
      const errorResponse = NextResponse.json({ error: 'URL is required' }, { status: 400 });
      errorResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
      return errorResponse;
    }

    // 获取网站特定配置
    let siteConfig = getSiteConfig(url);

    // 快速模式：大幅减少等待时间
    if (fastMode) {
      siteConfig = {
        ...siteConfig,
        waitTime: Math.min(siteConfig.waitTime / 3, 800) // 等待时间减少到1/3，最少0.8秒
      };
    }

    // 检测环境并配置 Chromium
    const isProduction = process.env.VERCEL_ENV === 'production';
    const launchOptions: any = {
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
        '--disable-renderer-backgrounding'
      ]
    };

    // 在生产环境使用 Vercel 兼容的 Chromium
    if (isProduction) {
      try {
        const chromiumBinary = await import('@sparticuz/chromium');
        // 使用远程 Chromium 二进制文件
        const remoteChromiumUrl = 'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar';
        launchOptions.executablePath = await chromiumBinary.default.executablePath(remoteChromiumUrl);
        launchOptions.args = [
          ...chromiumBinary.default.args,
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
        ];
        console.log('Using remote @sparticuz/chromium for Vercel deployment');
      } catch (error) {
        console.log('Failed to load @sparticuz/chromium, using default Chromium');
        // 如果 @sparticuz/chromium 加载失败，使用默认配置
        launchOptions.args.push('--single-process', '--no-zygote');
      }
    }

    // 启动浏览器
    const browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      viewport: { width, height },
      userAgent: siteConfig.userAgent,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      // 模拟真实设备
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      // 额外的反检测设置
      javaScriptEnabled: true,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: siteConfig.headers
    });

    // 添加反检测脚本
    await context.addInitScript(() => {
      // 覆盖webdriver检测
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // 覆盖plugins检测
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // 覆盖languages检测
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en'],
      });

      // 覆盖chrome检测
      Object.defineProperty(window, 'chrome', {
        get: () => ({
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        }),
      });

      // 覆盖permissions检测
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: 'denied' } as PermissionStatus) :
          originalQuery(parameters)
      );
    });

    const page = await context.newPage();

    // 拦截一些不必要的资源以提高速度
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      // 对于某些网站，可以选择性地阻止图片、字体等资源
      if (['image', 'font', 'media'].includes(resourceType)) {
        // 可以根据需要启用或禁用
        // route.abort();
        route.continue();
      } else {
        route.continue();
      }
    });

    // 导航到页面
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 等待页面加载完成
    await page.waitForTimeout(siteConfig.waitTime);

    await page.addStyleTag({
      content: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap');
        * {
          font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      `
    });

    // 滚动页面以触发懒加载
    if (fullPage) {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              resolve(null);
            }
          }, 100);
        });
      });
      
      // 滚回顶部
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
    }

    // 截图
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality,
      fullPage,
      animations: 'disabled'
    });

    await browser.close();

    // 上传到 Vercel Blob 存储
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const domain = new URL(url).hostname.replace(/\./g, '-');
    const filename = `screenshot-${domain}-${timestamp}.jpeg`;

    try {
      const blob = await put(filename, screenshot, {
        access: 'public',
        addRandomSuffix: true,
        contentType: 'image/jpeg'
      });

      const response = NextResponse.json({
        success: true,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        metadata: {
          originalUrl: url,
          timestamp: new Date().toISOString(),
          dimensions: { width, height },
          fullPage,
          quality,
          filename: blob.pathname,
          storage: 'vercel-blob'
        }
      });

      // 设置正确的字符编码头
      response.headers.set('Content-Type', 'application/json; charset=utf-8');
      
      return response;

    } catch (blobError) {
      console.error('Blob upload error:', blobError);
      
      // 如果 Blob 上传失败，回退到 base64
      const base64Screenshot = screenshot.toString('base64');
      
      const response = NextResponse.json({
        success: true,
        screenshot: `data:image/jpeg;base64,${base64Screenshot}`,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          dimensions: { width, height },
          fullPage,
          quality,
          storage: 'base64-fallback',
          blobError: blobError instanceof Error ? blobError.message : String(blobError)
        }
      });

      response.headers.set('Content-Type', 'application/json; charset=utf-8');
      return response;
    }

  } catch (error) {
    console.error('Screenshot error:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to capture screenshot', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
    
    // 设置正确的字符编码头
    errorResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    return errorResponse;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    const errorResponse = NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    errorResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
    return errorResponse;
  }

  try {
    const width = parseInt(searchParams.get('width') || '1920');
    const height = parseInt(searchParams.get('height') || '1080');
    const fullPage = searchParams.get('fullPage') === 'true';
    const quality = parseInt(searchParams.get('quality') || '80');

    // 复用POST方法的逻辑
    const mockRequest = {
      json: async () => ({ url, width, height, fullPage, quality })
    } as NextRequest;

    return await POST(mockRequest);
  } catch (error) {
    console.error('Screenshot error:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to capture screenshot', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
    
    // 设置正确的字符编码头
    errorResponse.headers.set('Content-Type', 'application/json; charset=utf-8');
    
    return errorResponse;
  }
} 