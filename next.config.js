/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is the correct way:
    // Only modify externals on the server build
    if (isServer) {
      // Safely add 'onnxruntime-node' to the existing externals array
      config.externals.push('onnxruntime-node');
    }

    // Always return the config
    return config;
  },
};

// Use export default for .js files in an ESM project
export default nextConfig;