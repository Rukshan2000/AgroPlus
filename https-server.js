#!/usr/bin/env node
const https = require('https');
const { createServer } = require('https-localhost');
const fs = require('fs');
const path = require('path');

// Create HTTPS server with self-signed cert
const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

const app = require('next')({ dev: true, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https.createServer(options, (req, res) => {
    handle(req, res);
  }).listen(3443, () => {
    const ip = require('os').networkInterfaces();
    const addresses = Object.values(ip)
      .flat()
      .filter(addr => addr.family === 'IPv4' && !addr.internal)
      .map(addr => addr.address);
    
    console.log('\n✅ HTTPS Server running at:');
    console.log(`   https://localhost:3443`);
    addresses.forEach(addr => {
      console.log(`   https://${addr}:3443`);
    });
    console.log('\n⚠️  Browser may warn about self-signed certificate - click "Advanced" and continue\n');
  });
});
