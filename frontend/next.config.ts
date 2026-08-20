import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../"),
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.youthcamping.in',
      },
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
        protocol: 'https',
        hostname: 'youthcamping.online',
      },
      {
        protocol: 'https',
        hostname: 'www.youthcamping.in',
      },
      {
        protocol: 'https',
        hostname: 'youthcamping.in',
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
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
