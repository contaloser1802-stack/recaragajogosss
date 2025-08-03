
import type {NextConfig} from 'next';
require('dotenv').config();

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logodownload.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gematsu.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-gop.garenanow.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's2-ge.glbimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.s3.glbimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'p.novaskin.me',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'payment.boacompra.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'contentgarena-a.akamaihd.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
