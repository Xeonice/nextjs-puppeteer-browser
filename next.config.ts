import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 支持 Vercel 部署的 Playwright/Chromium 配置
  serverExternalPackages: ['playwright', '@sparticuz/chromium'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 避免在服务端打包时出现问题
      config.externals = [...(config.externals || []), 'playwright'];
    }
    return config;
  },
};

export default nextConfig;
