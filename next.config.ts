// next.config.ts
import type { NextConfig } from "next";

// To properly type webpack configuration
type WebpackConfigContext = {
  isServer: boolean;
};

const nextConfig: NextConfig = {
  // The experimental config should match NextConfig's expected structure
  experimental: {
    // appDir is no longer experimental in newer Next.js versions
    // Remove this if using Next.js 13.4 or newer
  },
  webpack: (config, { isServer }: WebpackConfigContext) => {
    // Fix for firebase admin issues in client-side builds
    if (!isServer) {
      // Replace node: imports with empty modules in client-side code
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        process: false,
        util: false,
        "stream/web": false,
        "node:crypto": false,
        "node:fs": false,
        "node:path": false,
        "node:process": false,
        "node:stream": false,
        "node:util": false,
        "node:os": false,
        "node:url": false,
        "node:zlib": false,
        "node:http": false,
        "node:https": false,
        "node:buffer": false,
      };
    }
    
    return config;
  },
  transpilePackages: ['lodash-es', 'lodash.clonedeep'],
};

export default nextConfig;