/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/note/:path*',
        destination: 'https://note.com/api/:path*',
      },
    ]
  },
};

export default nextConfig;
