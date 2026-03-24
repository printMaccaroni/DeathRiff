#!/usr/bin/env node
/**
 * Lighthouse evaluator for Flappy Bird
 * Serves the game on port 3000, runs Lighthouse headless,
 * exits 0 if composite score >= 95, else exits 1.
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const TARGET_SCORE = 95;

// Simple static file server
function startServer() {
  const server = http.createServer((req, res) => {
    let filePath = path.join(process.cwd(), req.url === '/' ? 'index.html' : req.url);
    // Security: stay within cwd
    if (!filePath.startsWith(process.cwd())) {
      res.writeHead(403); res.end(); return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

async function runLighthouse() {
  // Check index.html exists
  if (!fs.existsSync(path.join(process.cwd(), 'index.html'))) {
    console.error('ERROR: index.html not found in', process.cwd());
    process.exit(1);
  }

  let server;
  try {
    server = await startServer();
    console.log(`Server started on http://localhost:${PORT}`);

    // Run Lighthouse
    const outFile = path.join(process.cwd(), '.omc', 'lighthouse-report.json');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });

    console.log('Running Lighthouse...');
    try {
      execSync(
        `npx --yes lighthouse http://localhost:${PORT} --output=json --output-path="${outFile}" --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`,
        { stdio: 'pipe', timeout: 120000 }
      );
    } catch (e) {
      // Lighthouse may exit non-zero even on success — check the file
      if (!fs.existsSync(outFile)) {
        console.error('Lighthouse failed to produce output:', e.message);
        process.exit(1);
      }
    }

    const report = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    const perf = report.categories.performance.score * 100;
    const a11y = report.categories.accessibility.score * 100;
    const bp = report.categories['best-practices'].score * 100;
    const composite = Math.round((perf + a11y + bp) / 3);

    console.log(`\n=== Lighthouse Results ===`);
    console.log(`Performance:     ${Math.round(perf)}`);
    console.log(`Accessibility:   ${Math.round(a11y)}`);
    console.log(`Best Practices:  ${Math.round(bp)}`);
    console.log(`Composite Score: ${composite} (target: ${TARGET_SCORE}+)`);
    console.log(`Result: ${composite >= TARGET_SCORE ? 'PASS ✓' : 'FAIL ✗'}`);

    process.exit(composite >= TARGET_SCORE ? 0 : 1);
  } finally {
    if (server) server.close();
  }
}

runLighthouse().catch(err => {
  console.error('Evaluator error:', err);
  process.exit(1);
});
