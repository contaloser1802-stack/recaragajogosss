import type {NextConfig} from 'next';
import WebpackObfuscator from 'webpack-obfuscator';
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
      {
        protocol: 'https',
        hostname: 'recargarjogo.help',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverRuntimeConfig: {
    BUCKPAY_API_TOKEN: process.env.BUCKPAY_API_TOKEN,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    GHOSTPAY_SECRET_KEY: process.env.GHOSTPAY_SECRET_KEY,
    UTMIFY_API_URL: process.env.UTMIFY_API_URL,
    UTMIFY_API_TOKEN: process.env.UTMIFY_API_TOKEN,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator({
          compact: true,
          controlFlowFlattening: false,
          deadCodeInjection: false,
          debugProtection: false,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: false,
          renameGlobals: false,
          selfDefending: true,
          simplify: true,
          splitStrings: false,
          stringArray: true,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayThreshold: 0.75,
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
        }, [])
      );
    }
    return config;
  },
};

export default nextConfig;
