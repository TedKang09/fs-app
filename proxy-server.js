const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// CORS 헤더 설정
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

// 프록시 서버 생성
const server = http.createServer((req, res) => {
    // CORS preflight 요청 처리
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // 정적 파일 서빙
    if (req.url === '/' || req.url === '/index.html') {
        serveFile(res, 'index.html');
        return;
    }

    if (req.url === '/api-test.html') {
        serveFile(res, 'api-test.html');
        return;
    }

    if (req.url === '/company-downloader.html') {
        serveFile(res, 'company-downloader.html');
        return;
    }

    if (req.url === '/quick-test.html') {
        serveFile(res, 'quick-test.html');
        return;
    }

    if (req.url === '/cors-test.html') {
        serveFile(res, 'cors-test.html');
        return;
    }

    // API 프록시 요청 처리
    if (req.url.startsWith('/api/')) {
        handleApiProxy(req, res);
        return;
    }

    // 404 처리
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({ error: 'Not Found' }));
});

// 정적 파일 서빙
function serveFile(res, filename) {
    const filePath = path.join(__dirname, filename);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, corsHeaders);
            res.end(JSON.stringify({ error: 'File not found' }));
            return;
        }

        const ext = path.extname(filename);
        let contentType = 'text/html';
        
        if (ext === '.js') contentType = 'application/javascript';
        else if (ext === '.css') contentType = 'text/css';
        else if (ext === '.json') contentType = 'application/json';

        res.writeHead(200, {
            ...corsHeaders,
            'Content-Type': contentType
        });
        res.end(data);
    });
}

// API 프록시 처리
function handleApiProxy(req, res) {
    const apiUrl = req.url.replace('/api/', '');
    const targetUrl = `https://opendart.fss.or.kr/api/${apiUrl}`;

    console.log(`프록시 요청: ${targetUrl}`);

    const options = {
        hostname: 'opendart.fss.or.kr',
        path: `/api/${apiUrl}`,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        
        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            res.writeHead(200, corsHeaders);
            res.end(data);
        });
    });

    proxyReq.on('error', (err) => {
        console.error('프록시 오류:', err);
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    proxyReq.end();
}

server.listen(PORT, () => {
    console.log(`🚀 프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📱 브라우저에서 http://localhost:${PORT} 접속`);
    console.log(`🔧 API 프록시: http://localhost:${PORT}/api/`);
});

console.log('💡 사용법:');
console.log('1. 브라우저에서 http://localhost:3000 접속');
console.log('2. API 호출 시 /api/ 경로 사용');
console.log('3. 예: http://localhost:3000/api/list.json?crtfc_key=YOUR_KEY'); 