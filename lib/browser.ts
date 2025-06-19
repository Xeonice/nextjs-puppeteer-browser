import { chromium } from 'playwright';

export async function createBrowser() {
  const isProduction = process.env.VERCEL_ENV === 'production';
  
  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  };

  if (isProduction) {
    // 在 Vercel 生产环境使用远程 Chromium 二进制文件
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
        '--single-process',
        '--no-zygote'
      ];
      console.log('Using remote @sparticuz/chromium for Vercel deployment');
    } catch (error) {
      console.log('Failed to load @sparticuz/chromium, using default Chromium:', error);
      // 如果 @sparticuz/chromium 加载失败，使用默认配置
      launchOptions.args.push('--single-process', '--no-zygote');
    }
  }

  return await chromium.launch(launchOptions);
}

// 获取随机 User-Agent
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0'
];

export function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
} 