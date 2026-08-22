import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_PORT_ATTEMPTS = 50;

// file di root project yang boleh disajikan ke dashboard
const ROOT_FILES = ['igo_data.json'];

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

function getRequestedPort() {
    const arg = process.argv.slice(2).find(a => a.startsWith('--port='));
    if (arg) return parseInt(arg.split('=')[1]);
    if (process.env.PORT) return parseInt(process.env.PORT);
    return 3000;
}

function startServer(port, attemptsLeft, onReady) {
    const server = http.createServer(handleRequest);

    server.on('error', err => {
        if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
            console.log(`Port ${port} sudah dipakai, mencoba port ${port + 1}...`);
            startServer(port + 1, attemptsLeft - 1, onReady);
        } else if (err.code === 'EADDRINUSE') {
            console.error(`Tidak menemukan port kosong setelah ${MAX_PORT_ATTEMPTS} percobaan. Tutup aplikasi lain atau tentukan port manual: npm run serve -- --port=<port>`);
            process.exit(1);
        } else {
            console.error('Server error:', err.message);
            process.exit(1);
        }
    });

    server.listen(port, () => onReady(port));
}

function handleRequest(req, res) {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath;

    // file data dari root project (di luar public/)
    const rootFile = ROOT_FILES.find(f => urlPath === `/${f}`);
    if (rootFile) {
        filePath = path.join(__dirname, rootFile);
    } else {
        filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));

        // cegah directory traversal
        if (!filePath.startsWith(PUBLIC_DIR)) {
            res.writeHead(403);
            return res.end('Forbidden');
        }

        if (urlPath === '/' || !path.extname(filePath)) {
            filePath = path.join(PUBLIC_DIR, 'index.html');
        }
    }

    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 Not Found');
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

const requestedPort = getRequestedPort();
startServer(requestedPort, MAX_PORT_ATTEMPTS, port => {
    console.log('=================================');
    console.log('  Gio-desu Dashboard');
    console.log(`  http://localhost:${port}`);
    console.log('=================================');
});
