/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
  // onnxruntime-web / @ricky0123/vad-web ship .wasm + .onnx assets that need
  // to be served as static files rather than bundled.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },
};

export default nextConfig;
