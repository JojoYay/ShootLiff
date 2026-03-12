/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
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
