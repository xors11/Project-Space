require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const MAX_DETAIL_FETCH = Number(process.env.MAX_DETAIL_FETCH) || 20;
const CACHE_TTL_MS = 5 * 60 * 1000;
const FAILURE_WINDOW_MS = 60 * 1000;
const CIRCUIT_OPEN_MS = 60 * 1000;
const REQUEST_TIME_BUDGET_MS = 8000;

const axiosClient = axios.create({ timeout: 6000 });
const responseCache = new Map();
const failureTimestamps = [];
let circuitOpenUntil = 0;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const LANGUAGE_MAP = {
  english: 'en',
  telugu: 'te',
  hindi: 'hi',
  tamil: 'ta',
  malayalam: 'ml',
  kannada: 'kn',
  korean: 'ko',
  japanese: 'ja',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  italian: 'it'
};

const GENRE_MAP = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  thriller: 53,
  war: 10752,
  western: 37
};

const FALLBACK_MOVIES = [
  
  {
    title: 'Monsoon Rhapsody',
    release_year: 2020,
    imdb_rating: 7.8,
    main_cast: ['Riya Menon', 'Arjun Varma', 'Mira Chawla', 'Suhail Idris', 'Gautam Roy'],
    genre: 'Romance, Musical',
    age_rating: 'PG-13',
    platforms: ['Stream on IndiePlay'],
    one_sentence_summary: 'Two touring musicians rediscover their roots during a storm-soaked coastal journey and fall back in love with music.',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Neon Pulse',
    release_year: 2018,
    imdb_rating: 7.1,
    main_cast: ['Kenji Watanabe', 'Lila Brooks', 'Nathan Cole', 'Ivy Chen', 'Marco Ruiz'],
    genre: 'Sci-Fi, Action',
    age_rating: 'R',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'In a neon-drenched megacity, a courier must deliver a device capable of rebooting the entire grid before corrupt forces seize it.',
    poster_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Echoes of Everwood',
    release_year: 2021,
    imdb_rating: 8.1,
    main_cast: ['Joanne Pike', 'Mateo Silva', 'Anika Bose', 'Priyanka Verma', 'Leo Hart'],
    genre: 'Fantasy, Adventure',
    age_rating: 'PG',
    platforms: ['Stream on StoryBox'],
    one_sentence_summary: 'Siblings discover a timeless forest portal and must broker peace between rival clans to protect the realm.',
    poster_url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Cobalt Horizon',
    release_year: 2017,
    imdb_rating: 6.9,
    main_cast: ['Marcus Hale', 'Soo-jin Park', 'Ibrahim Khan', 'Alia Davies', 'Victor Ren'],
    genre: 'Action, Thriller',
    age_rating: 'UA',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'An ex-specialist races to stop a rogue satellite before it weaponizes the aurora borealis over major cities.',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Paper Lanterns',
    release_year: 2016,
    imdb_rating: 7.6,
    main_cast: ['Keiko Arai', 'Min-ho Lee', 'Sonal Vaid', 'Hannah Clarke', 'Yusef Ali'],
    genre: 'Drama, Family',
    age_rating: 'PG',
    platforms: ['Stream on HearthFlix'],
    one_sentence_summary: 'Three families reconnect during a lantern festival as long-hidden generational secrets rise to the surface.',
    poster_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Orbital Garden',
    release_year: 2022,
    imdb_rating: 8.2,
    main_cast: ['Amaya Trujillo', 'Dev Patel', 'Sora Kim', 'Isabella Rossi', 'Noah Adeyemi'],
    genre: 'Sci-Fi, Drama',
    age_rating: 'PG-13',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'Botanists aboard an orbital greenhouse race to deliver a final harvest that could save Earth from famine.',
    poster_url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Laugh Lines',
    release_year: 2015,
    imdb_rating: 6.8,
    main_cast: ['Nisha Rao', 'Tim O’Neil', 'Farah Malik', 'Connor West', 'Hiromi Sato'],
    genre: 'Comedy',
    age_rating: 'PG-13',
    platforms: ['Stream on LaffNow'],
    one_sentence_summary: 'Stand-up comics on a cross-country train tour rediscover why they started telling jokes as they heal old rifts.',
    poster_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Crimson Alley',
    release_year: 2014,
    imdb_rating: 7.0,
    main_cast: ['Irene Kwon', 'Abhay Thakur', 'Luis Prado', 'Mei Lin', 'Caleb Scott'],
    genre: 'Crime, Mystery',
    age_rating: 'R',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'A detective duo hunts an art thief who hides clues inside the murals they painstakingly restore.',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Seafoam Skies',
    release_year: 2013,
    imdb_rating: 7.3,
    main_cast: ['Jia Li', 'Anirudh Kamath', 'Sophia Miles', 'Ken Matsuda', 'Rafael Costa'],
    genre: 'Adventure, Family',
    age_rating: 'PG',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'A motley crew restores vintage seaplanes to compete in a legendary island race and reclaim their legacy.',
    poster_url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=600&q=80'
  }
];

const MOCK_RESPONSE = {
  language: 'English',
  genre: 'Comedy',
  age_preference: 'All Ages',
  core_recommendations: [
    {
      title: 'Sample Laugh Riot',
      release_year: 2021,
      imdb_rating: 7.3,
      main_cast: ['Actor A', 'Actor B', 'Actor C'],
      genre: 'Comedy',
      age_rating: 'U/A',
      platforms: ['Netflix'],
      one_sentence_summary: 'A quick-witted ensemble keeps a neighborhood laughing while saving their community theater.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample1.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Neighborhood Notes',
      release_year: 2020,
      imdb_rating: 7.8,
      main_cast: ['Actor D', 'Actor E', 'Actor F'],
      genre: 'Comedy, Drama',
      age_rating: 'PG',
      platforms: ['Amazon Prime Video'],
      one_sentence_summary: 'Two rival musicians write anonymous letters that bring their block together.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample2.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Lunch Break Legends',
      release_year: 2019,
      imdb_rating: 7.5,
      main_cast: ['Actor G', 'Actor H', 'Actor I'],
      genre: 'Comedy',
      age_rating: 'PG-13',
      platforms: ['Hulu'],
      one_sentence_summary: 'Office workers turn their cafeteria into a late-night improv stage to unwind.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample3.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Parallel Pranks',
      release_year: 2018,
      imdb_rating: 7.1,
      main_cast: ['Actor J', 'Actor K', 'Actor L'],
      genre: 'Comedy, Sci-Fi',
      age_rating: 'PG-13',
      platforms: ['Disney Plus'],
      one_sentence_summary: 'Roommates discover mirrored apartments across timelines and wage a prank war.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample4.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Weekend Whispers',
      release_year: 2017,
      imdb_rating: 7.0,
      main_cast: ['Actor M', 'Actor N', 'Actor O'],
      genre: 'Comedy, Romance',
      age_rating: 'PG',
      platforms: ['Apple TV'],
      one_sentence_summary: 'Neighbors swap anonymous voice memos and fall for each other’s wit.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample5.jpg',
      verified: true,
      source: 'TMDB'
    }
  ],
  additional_picks: [
    {
      title: 'City Cafe Chronicles',
      release_year: 2016,
      imdb_rating: 6.9,
      main_cast: ['Actor P', 'Actor Q', 'Actor R'],
      genre: 'Comedy',
      age_rating: 'PG',
      platforms: ['Netflix'],
      one_sentence_summary: 'Cafe regulars stage mini-plays from overheard conversations.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample6.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Signal Swap',
      release_year: 2022,
      imdb_rating: 7.6,
      main_cast: ['Actor S', 'Actor T', 'Actor U'],
      genre: 'Comedy, Adventure',
      age_rating: 'PG-13',
      platforms: ['HBO Max'],
      one_sentence_summary: 'Gamers hack a radio tower and accidentally start a citywide treasure hunt.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample7.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Deadline Detours',
      release_year: 2015,
      imdb_rating: 6.8,
      main_cast: ['Actor V', 'Actor W', 'Actor X'],
      genre: 'Comedy',
      age_rating: 'PG',
      platforms: ['Peacock'],
      one_sentence_summary: 'Reporters stuck on a freeway produce a podcast that accidentally solves a mystery.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample8.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Festival Fakes',
      release_year: 2014,
      imdb_rating: 6.7,
      main_cast: ['Actor Y', 'Actor Z', 'Actor AA'],
      genre: 'Comedy',
      age_rating: 'PG-13',
      platforms: ['Paramount+'],
      one_sentence_summary: 'Roommates create fake films to sneak into a festival and end up winning hearts.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample9.jpg',
      verified: true,
      source: 'TMDB'
    },
    {
      title: 'Balcony Broadcast',
      release_year: 2013,
      imdb_rating: 6.9,
      main_cast: ['Actor AB', 'Actor AC', 'Actor AD'],
      genre: 'Comedy',
      age_rating: 'PG',
      platforms: ['Netflix'],
      one_sentence_summary: 'Roommates run a secret balcony radio show that unites tenants across the block.',
      poster_url: 'https://image.tmdb.org/t/p/w500/sample10.jpg',
      verified: true,
      source: 'TMDB'
    }
  ],
  metrics: {
    tmdb_calls: 0,
    detail_calls: 0,
    from_cache: false
  }
};

const sanitizeInput = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed.length) return fallback;
  if (!/^[\w\s\-\+&]+$/i.test(trimmed)) {
    throw new Error('Invalid input characters detected');
  }
  return trimmed;
};

const titleCase = (value) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ') || value;

const normalizeLanguage = (value = 'English') => {
  const sanitized = sanitizeInput(value, 'English').toLowerCase();
  const code = LANGUAGE_MAP[sanitized] || sanitized.slice(0, 2);
  return { label: titleCase(value || 'English'), code };
};

const normalizeGenre = (value = 'Surprise Me') => {
  const sanitized = sanitizeInput(value, 'Surprise Me');
  const lowered = sanitized.toLowerCase();
  return lowered === 'surprise me' ? 'Surprise Me' : titleCase(sanitized);
};

const normalizeAgePreference = (value = 'All Ages') => {
  const sanitized = sanitizeInput(value, 'All Ages').toLowerCase();
  return sanitized === '18+' || sanitized === '18plus' ? '18+' : 'All Ages';
};

const deriveCertification = (releaseDates = [], preferredCountry) => {
  const priority = preferredCountry ? [preferredCountry, 'IN', 'US', 'GB'] : ['IN', 'US', 'GB'];
  for (const country of priority) {
    const match = releaseDates.find((entry) => entry.iso_3166_1 === country);
    if (match) {
      const rated = match.release_dates.find((rel) => rel.certification);
      if (rated && rated.certification) {
        return rated.certification;
      }
    }
  }
  for (const entry of releaseDates) {
    const rated = entry.release_dates.find((rel) => rel.certification);
    if (rated && rated.certification) {
      return rated.certification;
    }
  }
  return 'N/A';
};

const derivePlatforms = (providers = {}) => {
  const preferredRegions = ['IN', 'US', 'GB'];
  const names = new Set();
  for (const region of preferredRegions) {
    const data = providers[region];
    if (!data) continue;
    ['flatrate', 'buy', 'rent', 'ads'].forEach((bucket) => {
      (data[bucket] || []).forEach((provider) => names.add(provider.provider_name));
    });
  }
  if (!names.size) {
    return ['Currently not available on major OTTs'];
  }
  return Array.from(names);
};

const trimSummary = (text = 'No overview available.') => {
  const trimmed = text.trim();
  if (trimmed.length <= 220) return trimmed;
  return `${trimmed.slice(0, 217).trimEnd()}...`;
};

const cloneFallbackMovies = () =>
  FALLBACK_MOVIES.map((movie) => ({
    ...movie,
    imdb_rating: movie.imdb_rating ?? 'N/A',
    main_cast: movie.main_cast || [],
    platforms: movie.platforms || ['Currently not available on major OTTs'],
    poster_url: movie.poster_url || null,
    verified: false,
    source: 'GENERATED_FALLBACK'
  }));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientError = (error) => {
  if (!error.response) return true;
  return error.response.status >= 500;
};

const scrubFailureLog = () => {
  const now = Date.now();
  while (failureTimestamps.length && now - failureTimestamps[0] > FAILURE_WINDOW_MS) {
    failureTimestamps.shift();
  }
};

const recordFailure = () => {
  const now = Date.now();
  failureTimestamps.push(now);
  scrubFailureLog();
  if (failureTimestamps.length > 3) {
    circuitOpenUntil = now + CIRCUIT_OPEN_MS;
  }
};

const isCircuitOpen = () => Date.now() < circuitOpenUntil;

const cacheKey = ({ languageCode, genreLabel, agePreference }) =>
  `${languageCode}|${genreLabel.toLowerCase()}|${agePreference}`;

const getCachedResult = (key) => {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCachedResult = (key, data) => {
  responseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
};

const withRetries = async (requestFn) => {
  let attempt = 0;
  let delayMs = 200;
  while (attempt < 3) {
    try {
      return await requestFn();
    } catch (error) {
      attempt += 1;
      if (attempt >= 3 || !isTransientError(error)) {
        throw error;
      }
      await delay(delayMs);
      delayMs *= 2;
    }
  }
  throw new Error('Unexpected retry loop exit');
};

// Fisher-Yates shuffle algorithm for randomizing array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const fetchFromTmdb = async (params, traceId, isRefresh = false) => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY missing');
  }

  const metrics = { tmdb_calls: 0, detail_calls: 0, from_cache: false };
  const discoverUrl = 'https://api.themoviedb.org/3/discover/movie';
  const allValidMovies = [];
  let currentPage = 1;
  const maxPages = 10; // Try up to 10 pages to get enough valid results (especially for niche genres)
  const targetCount = 10;
  
  // For refresh requests, start from a random page to get different results
  if (isRefresh) {
    currentPage = Math.floor(Math.random() * 3) + 1; // Start from page 1-3 randomly
  }

  // Fetch multiple pages until we have enough valid movies or run out of pages
  while (allValidMovies.length < targetCount && currentPage <= maxPages) {
    const discoverResponse = await withRetries(() =>
      axiosClient.get(discoverUrl, {
        params: {
          api_key: TMDB_API_KEY,
          sort_by: 'popularity.desc',
          include_adult: params.agePreference === '18+',
          include_video: false,
          page: currentPage,
          'vote_count.gte': params.languageCode === 'en' ? 50 : 20, // Lower threshold for non-English languages
          with_original_language: params.languageCode,
          ...(params.genreId ? { with_genres: params.genreId } : {})
        },
        headers: { 'X-Trace-Id': traceId }
      })
    );
    metrics.tmdb_calls += 1;

    const candidates = discoverResponse.data.results || [];
    if (!candidates.length) {
      break; // No more results available
    }

    // Fetch details for candidates from this page
    const limited = candidates.slice(0, MAX_DETAIL_FETCH);
    const detailRequests = limited.map((movie) =>
      withRetries(() =>
        axiosClient.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
          params: {
            api_key: TMDB_API_KEY,
            append_to_response: 'credits,watch/providers,release_dates'
          },
          headers: { 'X-Trace-Id': traceId }
        })
      )
        .then((detailResponse) => ({
          summary: movie,
          detail: detailResponse.data
        }))
        .catch(() => null)
    );

    const detailResults = await Promise.all(detailRequests);
    metrics.detail_calls += detailRequests.length;
    metrics.tmdb_calls += detailRequests.length;

    // Format and validate each movie - formatMovie will return null for invalid matches
    const formatted = detailResults
      .filter(Boolean)
      .map(({ summary, detail }) => formatMovie(summary, detail, params))
      .filter((movie) => movie !== null); // Remove nulls (invalid/mismatched movies)

    // Add valid movies to our collection
    allValidMovies.push(...formatted);

    // If we got fewer results than expected, there might be no more pages
    if (candidates.length < 20) {
      break;
    }

    currentPage += 1;
  }

  // For refresh requests, shuffle results to return different movies each time
  const finalMovies = isRefresh ? shuffleArray(allValidMovies) : allValidMovies;

  return { movies: finalMovies, metrics };
};

const formatMovie = (summary, detail, params) => {
  if (!detail) return null;
  
  // CRITICAL: Validate language match - reject if original_language doesn't match
  const movieLanguage = (detail.original_language || summary.original_language || '').toLowerCase();
  const requestedLanguage = params.languageCode.toLowerCase();
  if (movieLanguage !== requestedLanguage) {
    // Log for debugging (can be removed in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] Rejected movie "${summary.title || 'Unknown'}" - language mismatch: ${movieLanguage} !== ${requestedLanguage}`);
    }
    return null; // Reject movies that don't match the requested language
  }

  // CRITICAL: Validate genre match if genre was specified (not "Surprise Me")
  // Use STRICT matching - movie MUST have the requested genre ID
  if (params.genreLabel && params.genreLabel !== 'Surprise Me' && params.genreId) {
    const movieGenreIds = detail.genres?.map((g) => g.id) || [];
    const movieGenreNames = detail.genres?.map((g) => g.name.toLowerCase()) || [];
    const requestedGenreLower = params.genreLabel.toLowerCase();
    
    // PRIMARY: Must match by exact genre ID - this is the most reliable
    const matchesId = movieGenreIds.includes(params.genreId);
    
    // For Sci-Fi and Horror, ONLY accept ID match (no name fallback) to prevent false positives
    const strictGenres = ['sci-fi', 'horror', 'science fiction'];
    const isStrictGenre = strictGenres.includes(requestedGenreLower);
    
    if (isStrictGenre) {
      // For strict genres, ONLY accept if ID matches exactly
      if (!matchesId) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEBUG] Rejected movie "${summary.title || 'Unknown'}" - strict genre mismatch: requested ${params.genreLabel} (ID: ${params.genreId}), found genre IDs: ${movieGenreIds.join(', ')}`);
        }
        return null;
      }
    } else {
      // For other genres, allow name matching as fallback
      const genreNameMap = {
        'romance': ['romance', 'romantic'],
        'comedy': ['comedy'],
        'action': ['action'],
        'drama': ['drama'],
        'thriller': ['thriller'],
        'fantasy': ['fantasy'],
        'crime': ['crime'],
        'adventure': ['adventure'],
        'animation': ['animation', 'animated'],
        'family': ['family'],
        'mystery': ['mystery']
      };
      
      let matchesName = false;
      if (!matchesId) {
        const validNames = genreNameMap[requestedGenreLower] || [requestedGenreLower];
        matchesName = movieGenreNames.some((movieGenreName) => 
          validNames.some((validName) => movieGenreName === validName)
        );
      }
      
      if (!matchesId && !matchesName) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEBUG] Rejected movie "${summary.title || 'Unknown'}" - genre mismatch: requested ${params.genreLabel} (ID: ${params.genreId}), found genres: ${movieGenreNames.join(', ')}`);
        }
        return null;
      }
    }
  }

  const releaseYear = summary.release_date ? Number(summary.release_date.slice(0, 4)) : 'N/A';
  const rating = Number.isFinite(summary.vote_average) ? Number(summary.vote_average.toFixed(2)) : 'N/A';
  const cast = (detail.credits?.cast || []).slice(0, 5).map((actor) => actor.name).filter(Boolean);
  const genres = detail.genres?.map((g) => g.name).join(', ') || 'N/A';
  const certification = deriveCertification(detail.release_dates?.results || [], params.country);
  const platforms = derivePlatforms(detail['watch/providers']?.results || {});
  const posterUrl = summary.poster_path ? `https://image.tmdb.org/t/p/w500${summary.poster_path}` : null;
  const summaryText = trimSummary(detail.overview || summary.overview || 'No overview available.');
  const ageGate = certification ? certification.toUpperCase() : 'N/A';

  // CRITICAL: Age preference validation
  if (params.agePreference === 'All Ages') {
    if (detail.adult) return null;
    if (['R', 'NC-17', 'A', '18+', '18A'].includes(ageGate)) {
      return null;
    }
  }

  // Only mark as verified if all critical fields are present
  const verified =
    rating !== 'N/A' && cast.length > 0 && posterUrl !== null && ageGate !== 'N/A' && summaryText.length > 0;

  const source = platforms.includes('Currently not available on major OTTs') ? 'TMDB' : 'TMDB+JUSTWATCH';

  return {
    title: summary.title || summary.original_title || 'Untitled',
    release_year: releaseYear,
    imdb_rating: rating,
    main_cast: cast,
    genre: genres,
    age_rating: ageGate,
    platforms,
    one_sentence_summary: summaryText,
    poster_url: posterUrl,
    verified,
    source
  };
};

const ensureTenMovies = (movies, params) => {
  // Only use fallbacks if we have fewer than 10 valid TMDB movies
  // This function should ONLY be called when we truly need to fill gaps
  if (movies.length >= 10) {
    return movies.slice(0, 10);
  }

  const needed = 10 - movies.length;
  const clonedFallback = cloneFallbackMovies();
  const filled = [...movies];
  
  // Only add fallbacks if absolutely necessary
  // Mark them clearly as unverified fallbacks
  for (let idx = 0; idx < needed && idx < clonedFallback.length; idx += 1) {
    filled.push({
      ...clonedFallback[idx],
      verified: false,
      source: 'GENERATED_FALLBACK'
    });
  }
  
  return filled.slice(0, 10);
};

const splitRecommendations = (movies) => ({
  core_recommendations: movies.slice(0, 5),
  additional_picks: movies.slice(5, 10)
});

const buildDebugMessage = (messages) => messages.filter(Boolean).join(' | ');

const buildFallbackResponse = (traceId, inputs = {}, reason) => {
  const languageLabel = inputs.languageLabel || 'English';
  const genreLabel = inputs.genreLabel || 'Surprise Me';
  const agePreference = inputs.agePreference || 'All Ages';
  const payload = splitRecommendations(ensureTenMovies([], { languageCode: inputs.languageCode || 'en', genreLabel, agePreference }));
  return {
    trace_id: traceId,
    language: languageLabel,
    genre: genreLabel,
    age_preference: agePreference,
    ...payload,
    debug: reason,
    metrics: {
      tmdb_calls: 0,
      detail_calls: 0,
      from_cache: false
    }
  };
};

const buildMockResponse = (traceId, inputs) => ({
  trace_id: traceId,
  language: inputs.languageLabel,
  genre: inputs.genreLabel,
  age_preference: inputs.agePreference,
  core_recommendations: MOCK_RESPONSE.core_recommendations,
  additional_picks: MOCK_RESPONSE.additional_picks,
  metrics: MOCK_RESPONSE.metrics
});

const buildValidationResponse = (traceId, inputs) => ({
  trace_id: traceId,
  valid: true,
  schema: 'recommendation-response-v2',
  normalized_input: {
    language: inputs.languageLabel,
    genre: inputs.genreLabel,
    age_preference: inputs.agePreference
  }
});

const handleRecommend = async (req, res) => {
  const traceId = req.headers['x-trace-id'] || randomUUID();
  res.set('X-Trace-Id', traceId);

  const startTime = Date.now();
  let inputs = {
    languageLabel: 'English',
    languageCode: 'en',
    genreLabel: 'Surprise Me',
    agePreference: 'All Ages'
  };

  try {
    const requestBody = req.body || {};
    const query = req.query || {};
    const languageInput = requestBody.language || query.language || 'English';
    const genreInput = requestBody.genre || query.genre || 'Surprise Me';
    const ageInput = requestBody.age_preference || requestBody.age || query.age_preference || 'All Ages';
    const mockMode = requestBody.mock === true || query.mock === 'true';
    const validateOnly = requestBody.validate === true || query.validate === 'true';
    const countryPreference = req.headers['x-country'] ? String(req.headers['x-country']).toUpperCase() : undefined;

    const { label: languageLabel, code: languageCode } = normalizeLanguage(languageInput);
    const genreLabel = normalizeGenre(genreInput);
    const agePreference = normalizeAgePreference(ageInput);

    inputs = { languageLabel, languageCode, genreLabel, agePreference, country: countryPreference };

    if (validateOnly) {
      return res.json(buildValidationResponse(traceId, inputs));
    }

    if (mockMode) {
      return res.json(buildMockResponse(traceId, inputs));
    }

    if (isCircuitOpen()) {
      const debug = 'Circuit breaker open; served deterministic fallback.';
      return res.json(buildFallbackResponse(traceId, inputs, debug));
    }

    const genreId = GENRE_MAP[genreLabel.toLowerCase()] || null;
    const isRefresh = requestBody.refresh === true || query.refresh === 'true';
    const cacheIdentifier = cacheKey({ languageCode, genreLabel, agePreference });
    
    // Skip cache if refresh is requested
    const cached = isRefresh ? null : getCachedResult(cacheIdentifier);

    if (cached) {
      const response = {
        trace_id: traceId,
        language: languageLabel,
        genre: genreLabel,
        age_preference: agePreference,
        ...cached.payload,
        metrics: {
          tmdb_calls: 0,
          detail_calls: 0,
          from_cache: true
        }
      };
      if (cached.debug) {
        response.debug = cached.debug;
      }
      return res.json(response);
    }

    if (!TMDB_API_KEY) {
      const response = buildFallbackResponse(traceId, inputs, 'TMDB_API_KEY missing; used GENERATED_FALLBACK');
      return res.json(response);
    }

    const { movies, metrics } = await fetchFromTmdb({ languageCode, genreId, genreLabel, agePreference, country: countryPreference }, traceId, isRefresh);

    // Validate that we got valid, filtered movies
    const validMovies = movies.filter((movie) => {
      // Double-check validation: ensure language matches and it's from TMDB
      if (!movie || !movie.title || movie.title === 'Untitled' || movie.source === 'GENERATED_FALLBACK') {
        return false;
      }
      
      // CRITICAL: Double-check genre match for strict genres (Sci-Fi, Horror)
      if (genreLabel && genreLabel !== 'Surprise Me' && genreId) {
        const requestedGenreLower = genreLabel.toLowerCase();
        const strictGenres = ['sci-fi', 'horror', 'science fiction'];
        const isStrictGenre = strictGenres.includes(requestedGenreLower);
        
        if (isStrictGenre) {
          // For strict genres, verify the genre string contains the requested genre
          const movieGenres = (movie.genre || '').toLowerCase();
          const genreKeywords = {
            'sci-fi': ['science fiction', 'sci-fi', 'science-fiction'],
            'horror': ['horror']
          };
          
          const keywords = genreKeywords[requestedGenreLower] || [requestedGenreLower];
          const hasGenre = keywords.some(keyword => movieGenres.includes(keyword));
          
          if (!hasGenre) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[DEBUG] Post-filter rejected "${movie.title}" - genre string doesn't match: ${movie.genre}`);
            }
            return false;
          }
        }
      }
      
      return true;
    });

    // CRITICAL: Only use fallbacks if we have ZERO valid TMDB results
    // If we have ANY valid TMDB movies, we MUST try to get more before using fallbacks
    if (!validMovies.length) {
      recordFailure();
      const response = buildFallbackResponse(
        traceId,
        inputs,
        `TMDB returned no valid movies matching filters (language: ${languageLabel}, genre: ${genreLabel}, age: ${agePreference}); used GENERATED_FALLBACK`
      );
      return res.json(response);
    }

    // CRITICAL: Only use fallbacks if we have ZERO valid TMDB results
    // If we have ANY valid results, show ONLY those (even if less than 10)
    // This prevents irrelevant fallback movies from appearing when user requests specific genres
    let finalMovies;
    let fallbackCount = 0;
    
    if (validMovies.length === 0) {
      // Only use fallbacks if we have zero valid results
      finalMovies = ensureTenMovies([], { languageCode, genreLabel, agePreference });
      fallbackCount = finalMovies.length;
    } else {
      // Use ONLY valid TMDB movies - don't pad with irrelevant fallbacks
      // Return what we have, even if less than 10
      finalMovies = validMovies.slice(0, 10);
    }
    
    const payload = splitRecommendations(finalMovies);
    const debugMessages = [];
    
    // Add debug message explaining the results
    if (fallbackCount > 0) {
      debugMessages.push(`No valid ${languageLabel} ${genreLabel} movies found. Showing fallback recommendations.`);
    } else if (validMovies.length < 10) {
      debugMessages.push(`Found ${validMovies.length} valid ${languageLabel} ${genreLabel} movies. Showing all available results (no irrelevant movies added).`);
    } else {
      debugMessages.push(`Found ${validMovies.length} valid ${languageLabel} ${genreLabel} movies matching your filters.`);
    }
    
    const elapsed = Date.now() - startTime;
    if (elapsed > REQUEST_TIME_BUDGET_MS) {
      debugMessages.push('Request exceeded time budget; returned best available results.');
    }

    const response = {
      trace_id: traceId,
      language: languageLabel,
      genre: genreLabel,
      age_preference: agePreference,
      ...payload,
      metrics: {
        ...metrics,
        from_cache: false
      }
    };

    if (debugMessages.length) {
      response.debug = buildDebugMessage(debugMessages);
    }

    // Only cache if we have valid TMDB results (no fallbacks or minimal fallbacks)
    // Don't cache refresh requests or responses that are mostly fallbacks
    const fallbackRatio = finalMovies.filter((m) => m.source === 'GENERATED_FALLBACK').length / finalMovies.length;
    if (!isRefresh && fallbackRatio < 0.5) { // Only cache if less than 50% are fallbacks and not a refresh request
      setCachedResult(cacheIdentifier, {
        payload,
        debug: response.debug || null
      });
    }

    return res.json(response);
  } catch (error) {
    recordFailure();
    const debugMessage =
      error.message === 'Invalid input characters detected'
        ? 'Invalid input detected; served fallback.'
        : `TMDB transient failures: ${error.message}`;
    const fallbackResponse = buildFallbackResponse(traceId, inputs, debugMessage);
    return res.json(fallbackResponse);
  }
};

app.post('/api/recommend', handleRecommend);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  if (req.method !== 'GET') {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

