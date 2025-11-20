const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/recommend';

const GENRES = [
    'Surprise Me', 'Romance', 'Horror', 'Comedy', 'Crime', 'Action',
    'Drama', 'Fantasy', 'Adventure', 'Family', 'Animation', 'Sci-Fi', 'Thriller'
];

const AGES = ['All Ages', '18+'];

async function runTests() {
    console.log('Starting comprehensive tests...');
    let failures = 0;

    for (const age of AGES) {
        for (const genre of GENRES) {
            try {
                const response = await axios.post(BASE_URL, {
                    genre: genre,
                    age_preference: age,
                    language: 'English'
                });

                const recs = response.data.core_recommendations || [];
                const picks = response.data.additional_picks || [];
                const total = recs.length + picks.length;

                if (total === 0) {
                    console.error(`FAIL: [${genre} | ${age}] -> Found 0 movies.`);
                    failures++;
                } else {
                    // console.log(`PASS: [${genre} | ${age}] -> Found ${total} movies.`);
                }
            } catch (error) {
                console.error(`ERROR testing [${genre} | ${age}]:`, error.message);
                failures++;
            }
        }
    }

    console.log(`Tests completed. Failures: ${failures}`);
}

runTests();
