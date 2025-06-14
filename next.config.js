/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add PDF.js worker
    config.resolve.alias.canvas = false;
    
    return config;
  },
  // Increase the API route body size limit
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}

module.exports = nextConfig 