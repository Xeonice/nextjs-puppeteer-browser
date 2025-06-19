import { chromium } from 'playwright';
import chromiumBinary from '@sparticuz/chromium';

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
      '--disable-features=VizDisplayCompositor'
    ]
  };

  if (isProduction) {
    // 在 Vercel 生产环境使用 @sparticuz/chromium
    launchOptions.executablePath = await chromiumBinary.executablePath();
    launchOptions.args = [
      ...chromiumBinary.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ];
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