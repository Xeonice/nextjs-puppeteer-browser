'use client';

import { useState } from 'react';

export default function ScreenshotPage() {
  const [url, setUrl] = useState('');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [fullPage, setFullPage] = useState(false);
  const [quality, setQuality] = useState(80);
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const predefinedUrls = [
    { name: '百度搜索', url: 'https://www.baidu.com' },
    { name: '知乎首页', url: 'https://www.zhihu.com' },
    { name: '今日头条', url: 'https://www.toutiao.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Google', url: 'https://www.google.com' },
  ];

  const handleScreenshot = async () => {
    if (!url) {
      setError('请输入 URL');
      return;
    }

    setLoading(true);
    setError(null);
    setScreenshot(null);

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          width,
          height,
          fullPage,
          quality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '截图失败');
      }

      setScreenshot(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '截图失败');
    } finally {
      setLoading(false);
    }
  };

  const downloadScreenshot = () => {
    if (!screenshot) return;

    const link = document.createElement('a');
    link.href = screenshot;
    link.download = `screenshot-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">网页截图工具</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* URL 输入 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网址 URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 预设网址 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                或选择预设网址
              </label>
              <div className="flex flex-wrap gap-2">
                {predefinedUrls.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setUrl(preset.url)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 宽度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                宽度 (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min="320"
                max="3840"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 高度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                高度 (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min="240"
                max="2160"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 质量 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片质量: {quality}%
              </label>
              <input
                type="range"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                min="10"
                max="100"
                className="w-full"
              />
            </div>

            {/* 全页截图 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fullPage"
                checked={fullPage}
                onChange={(e) => setFullPage(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="fullPage" className="ml-2 block text-sm text-gray-700">
                全页截图
              </label>
            </div>
          </div>

          {/* 截图按钮 */}
          <div className="mt-6">
            <button
              onClick={handleScreenshot}
              disabled={loading || !url}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '截图中...' : '开始截图'}
            </button>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 截图结果 */}
        {screenshot && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">截图结果</h2>
              <button
                onClick={downloadScreenshot}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                下载图片
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <img
                src={screenshot}
                alt={`Screenshot of ${url}`}
                className="w-full h-auto"
              />
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>截图网址: {url}</p>
            </div>
          </div>
        )}

        {/* 说明 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">功能说明</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>支持对百度、知乎等反爬虫强的网站进行截图</li>
            <li>自动设置合适的 User-Agent 和请求头</li>
            <li>支持自定义分辨率和图片质量</li>
            <li>支持全页截图（包含需要滚动的内容）</li>
            <li>自动处理懒加载内容</li>
            <li>内置反检测机制，提高成功率</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 