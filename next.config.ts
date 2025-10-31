import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";

const runtimeCaching = [
  {
    urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\//,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts",
      expiration: {
        maxEntries: 24,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/_next/static/"),
    handler: "CacheFirst",
    options: {
      cacheName: "next-static-assets",
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      },
    },
  },
  {
    urlPattern: ({ url }: { url: URL }) =>
      url.pathname.startsWith("/_next/data/") || url.pathname.includes("/stories/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "story-documents",
      networkTimeoutSeconds: 8,
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      },
    },
  },
  {
    urlPattern: ({ request }: { request: Request }) => request.destination === "audio",
    handler: "CacheFirst",
    options: {
      cacheName: "story-media-assets",
      expiration: {
        maxEntries: 12,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      },
      rangeRequests: true,
    },
  },
];

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheStartUrl: true,
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/_offline",
  },
  runtimeCaching,
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};

export default withNextIntl(withPWA(nextConfig));
