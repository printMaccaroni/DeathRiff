#!/usr/bin/env node
/**
 * Lighthouse evaluator for Flappy Bird
 * Uses Lighthouse Node API directly.
 * Exits 0 if composite score (perf+a11y+best-practices)/3 >= 95, else exits 1.
 */

'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT         = 3000;
const TARGET_SCORE = 95;

// ── Simple static file server ──────────────────────────────────
function startServer() {
  const MIME = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    const safePath = path.normalize(req.url.split('?')[0]);
    const rel      = (safePath === '/' || safePath === path.sep) ? 'index.html' : safePath.replace(/^[\\/]/, '');
    const filePath = path.join(process.cwd(), rel);

    if (!filePath.startsWith(process.cwd())) {
      res.writeHead(403); res.end('Forbidden'); return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext  = path.extname(filePath).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

// ── Main ───────────────────────────────────────────────────────
async function run() {
  if (!fs.existsSync(path.join(process.cwd(), 'index.html'))) {
    console.error('ERROR: index.html not found in', process.cwd());
    process.exit(1);
  }

  let server;
  let chrome;

  try {
    server = await startServer();
    console.log('Server started on http://localhost:' + PORT);

    const { default: lighthouse }      = await import('lighthouse');
    const { launch }                   = await import('chrome-launcher');

    console.log('Launching Chrome headless...');
    chrome = await launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    console.log('Running Lighthouse (port ' + chrome.port + ')...');

    let lhResult;
    try {
      lhResult = await lighthouse('http://localhost:' + PORT, {
        logLevel:       'error',
        output:         'json',
        port:           chrome.port,
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
      });
    } catch (lhErr) {
      // On Windows, Lighthouse sometimes throws EPERM during temp-dir cleanup
      // even after successfully completing the audit.  If we have a partial
      // result object attached to the error, use it.
      const isCleanup = lhErr.code === 'EPERM' || lhErr.code === 'EBUSY' ||
                        (lhErr.message && lhErr.message.includes('lighthouse.'));
      if (isCleanup) {
        console.warn('Warning: Windows temp-dir cleanup error (non-fatal):', lhErr.code || lhErr.message);
        lhResult = lhErr.lhr ? { lhr: lhErr.lhr } : null;
      } else {
        throw lhErr;
      }
    }

    // Kill Chrome
    try { await chrome.kill(); } catch (_) { /* ignore kill errors */ }
    chrome = null;

    if (!lhResult || !lhResult.lhr) {
      console.error('ERROR: Lighthouse did not return results');
      process.exit(1);
    }

    const cats = lhResult.lhr.categories;
    const perf = Math.round(cats.performance['score']       * 100);
    const a11y = Math.round(cats.accessibility['score']     * 100);
    const bp   = Math.round(cats['best-practices']['score'] * 100);
    const comp = Math.round((perf + a11y + bp) / 3);

    // Save report
    const outDir = path.join(process.cwd(), '.omc');
    fs.mkdirSync(outDir, { recursive: true });
    try {
      fs.writeFileSync(path.join(outDir, 'lighthouse-report.json'), lhResult.report || JSON.stringify(lhResult.lhr));
    } catch (_) { /* non-fatal */ }

    console.log('\n=== Lighthouse Results ===');
    console.log('Performance:    ', perf);
    console.log('Accessibility:  ', a11y);
    console.log('Best Practices: ', bp);
    console.log('Composite:      ', comp, '(target: ' + TARGET_SCORE + '+)');
    console.log('Result:', comp >= TARGET_SCORE ? 'PASS ✓' : 'FAIL ✗ (need ' + (TARGET_SCORE - comp) + ' more points)');

    process.exit(comp >= TARGET_SCORE ? 0 : 1);

  } catch (err) {
    console.error('Evaluator error:', err.message || err);
    process.exit(1);
  } finally {
    if (chrome) { try { await chrome.kill(); } catch (_) { /* ignore */ } }
    if (server)  server.close();
  }
}

run();
