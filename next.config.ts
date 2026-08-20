import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Marketplace product thumbnails are bundled locally in
     public/marketplace/products/ (see `npm run fetch:images`), so no
     remote image hosts need to be configured. */

  /* The CyberSource SDK is a generated CommonJS package that reads files and
     resolves modules at runtime — bundling it into the route handler breaks it.
     Let Node `require` it instead. */
  serverExternalPackages: ['cybersource-rest-client'],
};

export default nextConfig;
