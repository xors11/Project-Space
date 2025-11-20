const http = require('http');
const data = JSON.stringify({ language: 'English', genre: 'Romance', age: 'All Ages' });
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/recommend',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};
const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});
req.on('error', (e) => { console.error('Error:', e); });
req.write(data);
req.end();
