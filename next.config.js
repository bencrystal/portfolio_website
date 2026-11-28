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
        // pdfjs loads its worker via dynamic import; tracing misses it too.
        './node_modules/pdfjs-dist/legacy/build/**/*',
      ],
    },
  },
  // /scribe is an alias for the todo list.
  redirects: async () => {
    return [
      { source: '/scribe', destination: '/list', permanent: false },
      { source: '/scribe/:token', destination: '/list/:token', permanent: false },
      // /quizbot is the audio-quiz channel dashboard; these are its aliases.
      { source: '/audioquiz', destination: '/quizbot', permanent: false },
      { source: '/playitbyear', destination: '/quizbot', permanent: false },
    ]
  },
  // /index can't be an app route (collides with Next's internal name for /),
  // so the personal page index lives at /pages and /index aliases it.
  rewrites: async () => {
    return [
      { source: '/index', destination: '/pages' },
      // /drgarycrystal is a static preview build (public/drgarycrystal) whose
      // pages are directory index.html files; asset files are matched first.
      { source: '/drgarycrystal', destination: '/drgarycrystal/index.html' },
      { source: '/drgarycrystal/:path*', destination: '/drgarycrystal/:path*/index.html' },
      // Same arrangement for the /modernfamilydentistryjc demo.
      { source: '/modernfamilydentistryjc', destination: '/modernfamilydentistryjc/index.html' },
      { source: '/modernfamilydentistryjc/:path*', destination: '/modernfamilydentistryjc/:path*/index.html' },
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