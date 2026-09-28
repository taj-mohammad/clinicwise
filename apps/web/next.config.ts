import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4100';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cliniqx/shared'],
  // The API is same-origin to the browser, so auth cookies are first-party.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default config;
