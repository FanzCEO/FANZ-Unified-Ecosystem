const http = require('http');
const port = process.env.PORT || 8080;
const banner = process.env.FEATURE_BANNER === 'true';
const server = http.createServer((req, res) => {
  if (req.url === '/healthz' || req.url === '/readyz') {
    res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ok:true}));
  }
  if (req.url === '/metrics') {
    res.writeHead(200, {'Content-Type':'text/plain'}); return res.end('golden_requests_total 1\n');
  }
  res.writeHead(200, {'Content-Type':'application/json'});
  res.end(JSON.stringify({service:'golden-api', banner, ts:new Date().toISOString()}));
});
server.listen(port, '0.0.0.0', () => console.log(`golden-api on ${port}`));
