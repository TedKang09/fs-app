const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3001;

// CORS 설정
app.use(cors());

// 정적 파일 서빙
app.use(express.static(__dirname));

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// OpenDart API 프록시
app.get('/dart-proxy', async (req, res) => {
    const { crtfc_key, bsns_year, ...otherParams } = req.query;
    const apiUrl = 'https://opendart.fss.or.kr/api/list.json';
    const queryString = new URLSearchParams({
        crtfc_key,
        ...otherParams,
    }).toString();
    const fullUrl = `${apiUrl}?${queryString}`;

    console.log(`프록시 요청: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('프록시 오류:', error);
        res.status(500).json({ 
            error: 'Failed to fetch data from DART API',
            message: error.message 
        });
    }
});

// 재무정보 API 프록시
app.get('/financial-proxy', async (req, res) => {
    const { crtfc_key, bsns_year, ...otherParams } = req.query;
    const apiUrl = 'https://opendart.fss.or.kr/api/fnlttSinglAcnt.json';
    const queryString = new URLSearchParams({
        crtfc_key,
        bsns_year,
        ...otherParams,
    }).toString();
    const fullUrl = `${apiUrl}?${queryString}`;

    console.log(`재무정보 프록시 요청: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('재무정보 프록시 오류:', error);
        res.status(500).json({ 
            error: 'Failed to fetch financial data from DART API',
            message: error.message 
        });
    }
});

// 회사정보 API 프록시
app.get('/company-proxy', async (req, res) => {
    const { crtfc_key, corp_code, ...otherParams } = req.query;
    const apiUrl = 'https://opendart.fss.or.kr/api/company.json';
    const queryString = new URLSearchParams({
        crtfc_key,
        corp_code,
        ...otherParams,
    }).toString();
    const fullUrl = `${apiUrl}?${queryString}`;

    console.log(`회사정보 프록시 요청: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('회사정보 프록시 오류:', error);
        res.status(500).json({ 
            error: 'Failed to fetch company data from DART API',
            message: error.message 
        });
    }
});

// 범용 API 프록시
app.get('/api/*', async (req, res) => {
    const apiPath = req.params[0];
    const apiUrl = `https://opendart.fss.or.kr/api/${apiPath}`;
    const queryString = new URLSearchParams(req.query).toString();
    const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;

    console.log(`범용 프록시 요청: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('범용 프록시 오류:', error);
        res.status(500).json({ 
            error: 'Failed to fetch data from DART API',
            message: error.message 
        });
    }
});

// 서버 상태 확인
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        port: PORT,
        timestamp: new Date().toISOString(),
        endpoints: [
            '/dart-proxy - 공시정보 API',
            '/financial-proxy - 재무정보 API',
            '/company-proxy - 회사정보 API',
            '/api/* - 범용 API 프록시'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Express 프록시 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📱 브라우저에서 http://localhost:${PORT} 접속`);
    console.log(`🔧 API 프록시: http://localhost:${PORT}/dart-proxy`);
    console.log(`📊 서버 상태: http://localhost:${PORT}/status`);
});

console.log('💡 사용법:');
console.log('1. 브라우저에서 http://localhost:3001 접속');
console.log('2. API 호출 예시:');
console.log('   - 공시정보: /dart-proxy?crtfc_key=YOUR_KEY&bgn_de=20240101&end_de=20240101');
console.log('   - 재무정보: /financial-proxy?crtfc_key=YOUR_KEY&corp_code=00126380&bsns_year=2023');
console.log('   - 회사정보: /company-proxy?crtfc_key=YOUR_KEY&corp_code=00126380'); 