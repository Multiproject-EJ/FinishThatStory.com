declare module "next-pwa" {
  import type { NextConfig } from "next";

  type NextPwaOptions = {
    cacheStartUrl?: boolean;
    dest?: string;
    disable?: boolean;
    dynamicStartUrl?: boolean;
    fallbacks?: Record<string, string>;
    reloadOnOnline?: boolean;
    scope?: string;
    sw?: string;
  } & Record<string, unknown>;

  export default function withPWA(
    options?: NextPwaOptions,
  ): (nextConfig?: NextConfig) => NextConfig;
}
