/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const workerApiUrl = process.env.WORKER_API_URL;
    if (workerApiUrl) {
      return {
        beforeFiles: [
          {
            source: "/api/:path*",
            destination: `${workerApiUrl}/api/:path*`,
          },
        ],
      };
    }
    return [];
  },
};

export default nextConfig;
