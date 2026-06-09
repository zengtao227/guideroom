/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['192.168.68.53'],
  }),
};

export default nextConfig;
