const selectors = {
  language: document.getElementById('languageSelect'),
  genre: document.getElementById('genreSelect'),
  age: document.getElementById('ageSelect'),
  recommendBtn: document.getElementById('recommendButton'),
  refreshBtn: document.getElementById('refreshButton'),
  retryBtn: document.getElementById('retryButton'),
  statusPanel: document.getElementById('statusPanel'),
  statusMessage: document.getElementById('statusMessage'),
  primaryGrid: document.getElementById('primaryGrid'),
  additionalRow: document.getElementById('additionalRow'),
  sourceBadge: document.getElementById('sourceBadge'),
  modal: document.getElementById('movieModal'),
  modalBody: document.getElementById('modalBody')
};

const templates = {
  card: document.getElementById('movieCardTemplate'),
  compact: document.getElementById('compactCardTemplate')
};

const FRONTEND_FALLBACK = [
  {
    title: 'Aurora Point',
    release_year: 2020,
    imdb_rating: 7.5,
    main_cast: ['Ivy Walsh', 'Kento Mori', 'Sahana Iyer'],
    genre: 'Drama, Sci-Fi',
    age_rating: 'PG-13',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'A memory architect rebuilds fading constellations before humanity forgets its stories.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Blue Hour Bazaar',
    release_year: 2019,
    imdb_rating: 7.2,
    main_cast: ['Shreya Kapoor', 'Leo Huang', 'Elena Ortiz'],
    genre: 'Fantasy',
    age_rating: 'PG',
    poster_url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=500&q=80',
    platforms: ['Stream on StoryBox'],
    one_sentence_summary: 'Travelers barter memories at a desert market that appears once per decade.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Mirage Run',
    release_year: 2018,
    imdb_rating: 6.9,
    main_cast: ['Nina Ford', 'Arjun Rao'],
    genre: 'Action',
    age_rating: 'UA',
    poster_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'Bike messengers race corporate drones through hallucinated cityscapes.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Letters to Lyra',
    release_year: 2021,
    imdb_rating: 7.9,
    main_cast: ['Yara Sung', 'Mateo Cruz', 'Esha Raghavan'],
    genre: 'Romance',
    age_rating: 'PG',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80',
    platforms: ['Stream on IndiePlay'],
    one_sentence_summary: 'Pen pals meet during a citywide blackout and must finish each other’s stories.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Parallel Pantry',
    release_year: 2017,
    imdb_rating: 7.1,
    main_cast: ['Haruto Abe', 'Meera Jaffrey'],
    genre: 'Comedy, Family',
    age_rating: 'PG',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'A pop-up supper club cooks meals from alternate timelines.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Silent Orbit',
    release_year: 2016,
    imdb_rating: 7.0,
    main_cast: ['Liam Reed', 'Naomi Park'],
    genre: 'Thriller',
    age_rating: 'R',
    poster_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'A linguist uncovers sabotage on a satellite listening post.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Ghostwriter Club',
    release_year: 2015,
    imdb_rating: 6.8,
    main_cast: ['Sohee Kim', 'Ethan Blake'],
    genre: 'Mystery',
    age_rating: 'PG-13',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'Teens finish unfinished novels to solve the author’s disappearance.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Red River Radio',
    release_year: 2014,
    imdb_rating: 6.7,
    main_cast: ['Daniela Silva', 'Mohan Iyer'],
    genre: 'Drama',
    age_rating: 'PG-13',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'Pirate broadcasters send coded love letters to listeners.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Cosmic Choir',
    release_year: 2013,
    imdb_rating: 7.4,
    main_cast: ['Hana Yoon', 'Rajeev Malik'],
    genre: 'Fantasy, Music',
    age_rating: 'PG',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'A choir tunes nebulae while outrunning silence.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  },
  {
    title: 'Lagoon Files',
    release_year: 2012,
    imdb_rating: 7.0,
    main_cast: ['Elio Vargas', 'Akira Tan'],
    genre: 'Crime',
    age_rating: 'R',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80',
    platforms: ['Currently not available on major OTTs'],
    one_sentence_summary: 'Detectives decode radio chatter buried under ocean waves.',
    verified: false,
    source: 'GENERATED_FALLBACK'
  }
];

let lastPayload = null;
let latestTraceId = null;

const setStatus = (message, visible = true, isError = false) => {
  selectors.statusMessage.textContent = message;
  selectors.statusMessage.className = isError ? 'error' : 'info';
  selectors.statusPanel.hidden = !visible;
};

const toggleLoading = (isLoading) => {
  selectors.recommendBtn.disabled = isLoading;
  selectors.recommendBtn.textContent = isLoading ? 'Curating...' : 'Get Recommendations';
  selectors.retryBtn.disabled = isLoading;
  selectors.refreshBtn.disabled = isLoading;
};

const formatRating = (value) => (typeof value === 'number' ? value.toFixed(1) : value || 'N/A');

const formatUiMovie = (movie) => ({
  title: movie.title || 'Untitled',
  releaseYear: movie.release_year ?? 'N/A',
  rating: movie.imdb_rating ?? 'N/A',
  cast: movie.main_cast || [],
  genre: movie.genre || 'N/A',
  certification: movie.age_rating || 'N/A',
  platforms: Array.isArray(movie.platforms) && movie.platforms.length
    ? movie.platforms
    : ['Currently not available on major OTTs'],
  summary: movie.one_sentence_summary || 'No overview available.',
  poster: movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster',
  verified: Boolean(movie.verified),
  source: movie.source || 'TMDB'
});

const buildMovieCard = (movie) => {
  const clone = templates.card.content.cloneNode(true);
  const img = clone.querySelector('img');
  img.src = movie.poster;
  img.alt = `${movie.title} poster`;

  const badge = clone.querySelector('.badge');
  badge.textContent = movie.verified ? 'Verified via TMDB' : 'Unverified fallback';
  badge.className = movie.verified ? 'badge badge-verified' : 'badge badge-unverified';

  clone.querySelector('h3').textContent = movie.title;
  clone.querySelector('.year').textContent = movie.releaseYear || 'N/A';
  clone.querySelector('.meta').textContent = `${movie.genre} • IMDb ${formatRating(movie.rating)} • ${movie.certification}`;
  clone.querySelector('.cast').textContent = `Cast: ${movie.cast.length ? movie.cast.join(', ') : 'Not available'}`;
  clone.querySelector('button').addEventListener('click', () => openModal(movie));

  return clone;
};

const buildCompactCard = (movie) => {
  const clone = templates.compact.content.cloneNode(true);
  clone.querySelector('.title').textContent = movie.title;
  clone.querySelector('.meta').textContent = `${movie.releaseYear} • IMDb ${formatRating(movie.rating)}`;
  clone.querySelector('button').addEventListener('click', () => openModal(movie));
  return clone;
};

const renderResults = ({ primary, additional }, verified = true, debugMessage = '') => {
  selectors.primaryGrid.innerHTML = '';
  selectors.additionalRow.innerHTML = '';

  primary.forEach((movie) => selectors.primaryGrid.appendChild(buildMovieCard(movie)));
  additional.forEach((movie) => selectors.additionalRow.appendChild(buildCompactCard(movie)));

  selectors.sourceBadge.textContent = verified ? 'Verified via TMDB' : 'Fallback mode';
  selectors.sourceBadge.className = verified ? 'badge badge-info' : 'badge badge-unverified';

  if (debugMessage) {
    setStatus(debugMessage, true, true);
  }
};

const openModal = (movie) => {
  selectors.modalBody.innerHTML = `
    <h3 id="modalTitle">${movie.title}</h3>
    <p class="detail-row"><strong>Released:</strong> ${movie.releaseYear}</p>
    <p class="detail-row"><strong>Rating:</strong> IMDb ${formatRating(movie.rating)} | ${movie.certification}</p>
    <p class="detail-row"><strong>Genres:</strong> ${movie.genre}</p>
    <p class="detail-row"><strong>Cast:</strong> ${movie.cast.length ? movie.cast.join(', ') : 'N/A'}</p>
    <p class="detail-row"><strong>Availability:</strong> ${movie.platforms.join(', ')}</p>
    <p>${movie.summary}</p>
  `;
  selectors.modal.classList.add('open');
  selectors.modal.setAttribute('aria-hidden', 'false');
};

const closeModal = () => {
  selectors.modal.classList.remove('open');
  selectors.modal.setAttribute('aria-hidden', 'true');
};

const applyFrontendFallback = () => {
  const mapped = FRONTEND_FALLBACK.map(formatUiMovie);
  const data = {
    primary: mapped.slice(0, 5),
    additional: mapped.slice(5, 10)
  };
  renderResults(data, false, 'Showing offline fallback list.');
};

const interpretApiResponse = (payload) => {
  if (payload.core_recommendations && payload.additional_picks) {
    return {
      traceId: payload.trace_id || null,
      primary: payload.core_recommendations.map(formatUiMovie),
      additional: payload.additional_picks.map(formatUiMovie),
      verified: payload.core_recommendations.every((movie) => movie.verified) &&
        payload.additional_picks.every((movie) => movie.verified),
      debug: payload.debug || '',
      metrics: payload.metrics
    };
  }

  if (payload.primary && payload.additional) {
    // backwards compatibility
    const legacyMap = (movie) => formatUiMovie({
      title: movie.title,
      release_year: movie.releaseYear,
      imdb_rating: movie.rating,
      main_cast: movie.cast,
      genre: Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres,
      age_rating: movie.certification,
      poster_url: movie.poster,
      platforms: typeof movie.availability === 'string' ? [movie.availability] : movie.availability,
      one_sentence_summary: movie.overview,
      verified: movie.verified,
      source: movie.verified ? 'TMDB' : 'GENERATED_FALLBACK'
    });

    return {
      traceId: payload.trace_id || null,
      primary: payload.primary.map(legacyMap),
      additional: payload.additional.map(legacyMap),
      verified: payload.verified,
      debug: payload.debug || '',
      metrics: payload.metrics || null
    };
  }

  return null;
};

// Do not expose internal metrics or trace identifiers to end users.
// Return a simple, user-friendly status message instead.
const buildStatusMessage = (meta) => {
  if (!meta) return 'Verified picks powered by TMDB.';
  // If response came from cache, show a concise note; otherwise show default.
  if (meta.metrics && meta.metrics.from_cache) {
    return 'Serving cached recommendations.';
  }
  return 'Verified picks powered by TMDB.';
};

const fetchRecommendations = async (skipCache = false) => {
  setStatus('Finding cinematic gems for you...');
  toggleLoading(true);

  const payload = {
    language: selectors.language.value,
    genre: selectors.genre.value,
    age_preference: selectors.age.value
  };
  
  // Add refresh flag to bypass cache and get different results
  if (skipCache) {
    payload.refresh = true;
    payload._timestamp = Date.now(); // Add timestamp to ensure unique request
  }
  
  lastPayload = payload;

  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Server unavailable');
    }

    const json = await response.json();
    const interpreted = interpretApiResponse(json);

    if (!interpreted) {
      throw new Error('Unexpected server response');
    }

    latestTraceId = interpreted.traceId;
    renderResults(
      { primary: interpreted.primary, additional: interpreted.additional },
      interpreted.verified,
      interpreted.debug || ''
    );

    const statusMessage = buildStatusMessage({
      metrics: interpreted.metrics,
      traceId: interpreted.traceId
    });
    setStatus(statusMessage || 'Verified picks powered by TMDB.', true, !interpreted.verified);
  } catch (error) {
    console.error(error);
    applyFrontendFallback();
  } finally {
    toggleLoading(false);
  }
};

selectors.recommendBtn.addEventListener('click', () => fetchRecommendations(false));
selectors.refreshBtn.addEventListener('click', () => {
  // Check if user has made selections, if not use current form values
  const hasSelections = selectors.language.value && selectors.genre.value && selectors.age.value;
  
  if (hasSelections || lastPayload) {
    fetchRecommendations(true); // Skip cache to get fresh, different results
  } else {
    setStatus('Pick preferences first, then click "Get Recommendations".', true, true);
  }
});

selectors.retryBtn.addEventListener('click', fetchRecommendations);
selectors.modal.addEventListener('click', (event) => {
  if (event.target.dataset.closeModal !== undefined) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

window.addEventListener('load', () => {
  setStatus('Choose your language, genre, and age preference to begin.', true, false);
});

