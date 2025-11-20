const http = require('http');

const payload = JSON.stringify({
    language: 'English',
    genre: 'Comedy',
    age_preference: 'All Ages'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/recommend',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Body:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(payload);
req.end();
