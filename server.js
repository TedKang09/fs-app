import http from 'http';
import https from 'https';
import { URL, fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경변수 로드 (Render.com 환경 변수 우선)
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your_api_key_here';
try {
    // fs는 이미 import되어 있음
    const configPath = './config.env';
    if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const apiKeyMatch = configContent.match(/GEMINI_API_KEY=(.+)/);
        if (apiKeyMatch && !process.env.GEMINI_API_KEY) {
            GEMINI_API_KEY = apiKeyMatch[1].trim();
        }
    }
} catch (error) {
    console.log('config.env 파일을 읽을 수 없습니다. 기본값을 사용합니다.');
}

const PORT = process.env.PORT || 3001;

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
        serveFile(res, 'financial-visualization.html');
        return;
    }

    if (req.url === '/express-test.html') {
        serveFile(res, 'express-test.html');
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

    if (req.url === '/server-status.html') {
        serveFile(res, 'server-status.html');
        return;
    }

    if (req.url === '/debug-simple.html') {
        serveFile(res, 'debug-simple.html');
        return;
    }

    if (req.url === '/cors-test.html') {
        serveFile(res, 'cors-test.html');
        return;
    }

    if (req.url === '/proxy-test.html') {
        serveFile(res, 'proxy-test.html');
        return;
    }

    if (req.url === '/opendart-dashboard.html') {
        serveFile(res, 'opendart-dashboard.html');
        return;
    }

    if (req.url === '/corp-codes-downloader.html') {
        serveFile(res, 'corp-codes-downloader.html');
        return;
    }

    if (req.url === '/financial-visualization.html') {
        serveFile(res, 'financial-visualization.html');
        return;
    }

    if (req.url === '/debug-api.html') {
        serveFile(res, 'debug-api.html');
        return;
    }

    // 회사코드 데이터베이스 저장
    if (req.url === '/save-corp-codes' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const filePath = path.join(__dirname, 'corpCodes.json');
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                
                res.writeHead(200, corsHeaders);
                res.end(JSON.stringify({ success: true, message: '회사코드 데이터베이스 저장 완료' }));
            } catch (error) {
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ error: '저장 실패', message: error.message }));
            }
        });
        return;
    }

    // 회사코드 데이터베이스 조회
    if (req.url === '/corp-codes') {
        try {
            const filePath = path.join(__dirname, 'corpCodes.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                res.writeHead(200, corsHeaders);
                res.end(data);
            } else {
                res.writeHead(404, corsHeaders);
                res.end(JSON.stringify({ error: '회사코드 데이터베이스가 없습니다' }));
            }
        } catch (error) {
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ error: '조회 실패', message: error.message }));
        }
        return;
    }

    // API 프록시 요청 처리
    if (req.url.startsWith('/api/')) {
        handleApiProxy(req, res);
        return;
    }

    // Dart 프록시 요청 처리
    if (req.url.startsWith('/dart-proxy')) {
        handleDartProxy(req, res);
        return;
    }

    // Gemini AI 재무제표 분석
    if (req.url === '/analyze-financials' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const analysis = await analyzeFinancialData(data);
                
                res.writeHead(200, corsHeaders);
                res.end(JSON.stringify({ 
                    success: true, 
                    analysis: analysis 
                }));
            } catch (error) {
                console.error('Gemini API 오류:', error);
                res.writeHead(500, corsHeaders);
                res.end(JSON.stringify({ 
                    error: '분석 실패', 
                    message: error.message 
                }));
            }
        });
        return;
    }

    // 서버 상태 확인
    if (req.url === '/status') {
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify({
            status: 'running',
            port: PORT,
            timestamp: new Date().toISOString(),
            endpoints: [
                '/api/* - 범용 API 프록시',
                '/dart-proxy - 공시정보 API',
                '/status - 서버 상태'
            ]
        }));
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

    console.log(`API 프록시 요청: ${targetUrl}`);

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
        console.error('API 프록시 오류:', err);
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    proxyReq.end();
}

// Dart 프록시 처리
function handleDartProxy(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const query = parsedUrl.query;
    
    const targetUrl = `https://opendart.fss.or.kr/api/list.json?${new URLSearchParams(query).toString()}`;

    console.log(`Dart 프록시 요청: ${targetUrl}`);

    const options = {
        hostname: 'opendart.fss.or.kr',
        path: `/api/list.json?${new URLSearchParams(query).toString()}`,
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
        console.error('Dart 프록시 오류:', err);
        res.writeHead(500, corsHeaders);
        res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    proxyReq.end();
}

server.listen(PORT, () => {
    console.log(`🚀 Express 프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📱 서버가 포트 ${PORT}에서 실행 중입니다`);
    console.log(`🔧 API 프록시: /api/`);
    console.log(`📊 서버 상태: /status`);
    console.log(`🤖 Gemini API 키: ${GEMINI_API_KEY.substring(0, 10)}...`);
});

console.log('💡 사용법:');
console.log(`1. 브라우저에서 서버에 접속하세요`);
console.log('2. API 호출 예시:');
console.log('   - 범용 API: /api/list.json?crtfc_key=YOUR_KEY&bgn_de=20240101&end_de=20240101');
console.log('   - Dart 프록시: /dart-proxy?crtfc_key=YOUR_KEY&bgn_de=20240101&end_de=20240101');
console.log('   - AI 분석: POST /analyze-financials');

// 재무제표 분석 함수 (Gemini API 우선, 실패 시 로컬 분석)
async function analyzeFinancialData(financialData) {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
            console.log('Gemini API 키가 설정되어 있지 않습니다. 로컬 분석을 사용합니다.');
            return generateLocalAnalysis(financialData);
        }
        // Gemini API 호출
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `아래의 재무제표 데이터를 분석해줘:\n${JSON.stringify(financialData)}`
                        }]
                    }]
                })
            }
        );
        const result = await response.json();
        if (
            result &&
            result.candidates &&
            result.candidates[0] &&
            result.candidates[0].content &&
            result.candidates[0].content.parts &&
            result.candidates[0].content.parts[0].text
        ) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.log('Gemini API 응답이 올바르지 않습니다. 로컬 분석을 사용합니다.');
            return generateLocalAnalysis(financialData);
        }
    } catch (error) {
        console.error('Gemini API 호출 오류:', error);
        return generateLocalAnalysis(financialData);
    }
}

// 로컬 재무제표 분석 함수
function generateLocalAnalysis(financialData) {
    const revenue = financialData.revenue ? (financialData.revenue / 1000000000000).toFixed(1) : 'N/A';
    const operatingIncome = financialData.operatingIncome ? (financialData.operatingIncome / 1000000000000).toFixed(1) : 'N/A';
    const netIncome = financialData.netIncome ? (financialData.netIncome / 1000000000000).toFixed(1) : 'N/A';
    const totalAssets = financialData.totalAssets ? (financialData.totalAssets / 1000000000000).toFixed(1) : 'N/A';
    const totalLiabilities = financialData.totalLiabilities ? (financialData.totalLiabilities / 1000000000000).toFixed(1) : 'N/A';
    const totalEquity = financialData.totalEquity ? (financialData.totalEquity / 1000000000000).toFixed(1) : 'N/A';
    
    const operatingMargin = financialData.operatingMargin ? financialData.operatingMargin.toFixed(1) : 'N/A';
    const netMargin = financialData.netMargin ? financialData.netMargin.toFixed(1) : 'N/A';
    const debtRatio = financialData.debtRatio ? financialData.debtRatio.toFixed(1) : 'N/A';
    const roe = financialData.roe ? financialData.roe.toFixed(1) : 'N/A';

    return `
## 📊 재무제표 분석 결과 (로컬 분석)

### 💰 수익성 분석
- 매출액: ${revenue}조원
- 영업이익: ${operatingIncome}조원
- 당기순이익: ${netIncome}조원
- 매출액 대비 영업이익률: ${operatingMargin}%
- 매출액 대비 순이익률: ${netMargin}%

### 🏗️ 재무 건전성 분석
- 총자산: ${totalAssets}조원
- 총부채: ${totalLiabilities}조원
- 자본총계: ${totalEquity}조원
- 부채비율: ${debtRatio}%
- ROE(자기자본이익률): ${roe}%

### 💡 종합 평가
${getFinancialHealthAssessment(operatingMargin, netMargin, debtRatio, roe)}

### 🔍 주요 특징
${getKeyFeatures(financialData)}

### ⚠️ 주의사항
- 이 분석은 로컬에서 생성된 기본 분석입니다.
- 더 정확한 분석을 위해서는 Gemini API 할당량이 복구된 후 다시 시도해주세요.
- 재무제표 데이터는 참고용이며, 투자 결정 시 전문가 상담을 권장합니다.
`;
}

function getFinancialHealthAssessment(operatingMargin, netMargin, debtRatio, roe) {
    let assessment = '';
    
    if (operatingMargin > 10) {
        assessment += '✅ 영업이익률이 양호합니다 (10% 이상).\n';
    } else if (operatingMargin > 5) {
        assessment += '⚠️ 영업이익률이 보통 수준입니다 (5-10%).\n';
    } else {
        assessment += '❌ 영업이익률이 낮습니다 (5% 미만).\n';
    }
    
    if (debtRatio < 50) {
        assessment += '✅ 부채비율이 안전한 수준입니다 (50% 미만).\n';
    } else if (debtRatio < 100) {
        assessment += '⚠️ 부채비율이 주의가 필요한 수준입니다 (50-100%).\n';
    } else {
        assessment += '❌ 부채비율이 높은 수준입니다 (100% 이상).\n';
    }
    
    if (roe > 10) {
        assessment += '✅ ROE가 양호합니다 (10% 이상).\n';
    } else if (roe > 5) {
        assessment += '⚠️ ROE가 보통 수준입니다 (5-10%).\n';
    } else {
        assessment += '❌ ROE가 낮습니다 (5% 미만).\n';
    }
    
    return assessment;
}

function getKeyFeatures(financialData) {
    const features = [];
    
    if (financialData.revenue > 100000000000000) { // 10조원 이상
        features.push('• 대규모 매출을 기록하는 대기업입니다.');
    }
    
    if (financialData.operatingMargin > 15) {
        features.push('• 높은 영업이익률로 수익성이 우수합니다.');
    }
    
    if (financialData.debtRatio < 30) {
        features.push('• 낮은 부채비율로 재무 건전성이 양호합니다.');
    }
    
    if (financialData.roe > 15) {
        features.push('• 높은 ROE로 자본 효율성이 우수합니다.');
    }
    
    if (features.length === 0) {
        features.push('• 재무 지표가 보통 수준입니다.');
    }
    
    return features.join('\n');
} 