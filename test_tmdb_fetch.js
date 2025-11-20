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

console.log('Testing TMDB API fetch...\n');

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('\n=== FULL RESPONSE ===');

        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));

            console.log('\n=== ANALYSIS ===');
            if (parsed.error) {
                console.log('❌ ERROR RESPONSE:', parsed.error);
            } else if (parsed.core_recommendations) {
                console.log('✅ SUCCESS: Received', parsed.core_recommendations.length, 'core recommendations');
                console.log('✅ SUCCESS: Received', parsed.additional_picks.length, 'additional picks');
                console.log('\nFirst movie title:', parsed.core_recommendations[0]?.title || 'N/A');
                console.log('Source:', parsed.core_recommendations[0]?.source || 'N/A');
                console.log('Verified:', parsed.core_recommendations[0]?.verified || 'N/A');
            } else {
                console.log('⚠️ UNEXPECTED RESPONSE FORMAT');
            }
        } catch (e) {
            console.log('Raw response (not JSON):', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error);
});

req.write(payload);
req.end();
