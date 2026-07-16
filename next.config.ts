import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kuynsixmbibajgobcdel.supabase.co",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
    ],
  },
};

export default nextConfig;
