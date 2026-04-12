import { createRequire } from "module"

const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ── Server-only packages ──────────────────────────────────────────────────
  // mongodb v7 and its dependency chain (gcp-metadata → node-fetch) use
  // node: protocol imports that webpack cannot bundle. Marking them as
  // serverExternalPackages tells Next.js to require() them at runtime.
  serverExternalPackages: ["mongodb", "bcryptjs"],

  webpack: (config, { isServer }) => {
    const webpack = require("webpack")

    // ── node: protocol fix ────────────────────────────────────────────────
    // mongodb v6+ dependency chain uses `node:https`, `node:path`, etc.
    // Strip the `node:` prefix so webpack resolves them as normal built-ins.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "")
      })
    )

    if (!isServer) {
      // Client build: stub out all Node.js built-ins
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        net: false,
        tls: false,
        fs: false,
        http: false,
        https: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        zlib: false,
      }
    }

    return config
  },
}

export default nextConfig
