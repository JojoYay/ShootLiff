/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // env: {
  //   LIFF_ID: "2005609302-AQql19g6",
  //   SERVER_URL: "https://script.google.com/macros/s/AKfycbw7wL2okZJ8z9Vv7G4nQS3asz-pEmoRSJrNMKmI50p2ZsegfcyxWAUwxoVcAHiiYIQWZA/exec"
  // },
  env: {
    LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
    SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL
  },
};

export default nextConfig;
