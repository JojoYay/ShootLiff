/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    LIFF_ID: process.env.LIFF_ID,
    SERVER_URL: process.env.SERVER_URL
  },
};

export default nextConfig;
