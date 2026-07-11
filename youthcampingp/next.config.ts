import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vl-prod-static.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8888',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8888',
      },
      {
        protocol: 'https',
        hostname: 'youthcamping.online',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: "/about",
        destination: "/about-us",
        permanent: true,
      },
      {
        source: "/tour-packages",
        destination: "/trips",
        permanent: true,
      },
      {
        source: "/tours/:slug",
        destination: "/trips/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
