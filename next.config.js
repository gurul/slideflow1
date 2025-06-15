/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add PDF.js worker
    config.resolve.alias.canvas = false;
    
    return config;
  },
  // Remove the API route body size limit
}

module.exports = nextConfig 