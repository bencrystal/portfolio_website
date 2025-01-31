/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add proper handling for p5.js
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    
    // Add rule for p5.js
    config.module.rules.push({
      test: /p5\.min\.js$/,
      loader: 'exports-loader',
      options: {
        type: 'commonjs',
        exports: 'single p5',
      },
    });

    return config;
  },
  // Add transpilePackages if needed
  transpilePackages: ['p5'],
  // Add this to help with the build process
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig 