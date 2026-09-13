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
    esmExternals: 'loose',
    // pdfjs-dist's ESM build breaks under webpack bundling; load it via Node.
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
    // pdfjs polyfills DOMMatrix from @napi-rs/canvas via a dynamic require
    // that Vercel's file tracing misses, so the native binary never ships and
    // prod PDF conversion dies with "DOMMatrix is not defined". Force it in.
    outputFileTracingIncludes: {
      '/api/inkdrop': [
        './node_modules/@napi-rs/canvas/**/*',
        './node_modules/@napi-rs/canvas-linux-x64-gnu/**/*',
      ],
    },
  },
  // /scribe is an alias for the todo list.
  redirects: async () => {
    return [
      { source: '/scribe', destination: '/list', permanent: false },
      { source: '/scribe/:token', destination: '/list/:token', permanent: false },
    ]
  },
  // Add cache control
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig 