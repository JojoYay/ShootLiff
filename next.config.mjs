/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
    SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    GA_ID: process.env.NEXT_PUBLIC_GA_ID
  },
  images: {
       remotePatterns: [
           {
             protocol: 'https',
             hostname: 'lh3.googleusercontent.com',
             port: '',
             pathname: '/d/**',
           },
         ],
  },  
};

export default nextConfig;
