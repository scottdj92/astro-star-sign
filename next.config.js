module.exports = {
  reactStrictMode: true,
  // bundles only the files the server needs, so the droplet runs `node .next/standalone/server.js`
  output: "standalone",
};
