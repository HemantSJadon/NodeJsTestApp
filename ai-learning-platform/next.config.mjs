/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-markdown", "remark-gfm"],
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk", "@supabase/supabase-js"],
  },
};

export default nextConfig;
