import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Marketplace product thumbnails are bundled locally in
     public/marketplace/products/ (see `npm run fetch:images`), so no
     remote image hosts need to be configured. */
};

export default nextConfig;
