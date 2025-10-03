const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = {
  server: {
    middleware: {
      1: createProxyMiddleware("/api", {
        target: "http://127.0.0.1:8000/",
        changeOrigin: true,
      }),
    },
  },
};