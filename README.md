# My Movie Watch

Curated, language-first movie recommendations powered by TMDB with a secure backend proxy.

## Requirements

- Node.js 18+
- TMDB API key

## Setup

1. Install dependencies:
   ```bash
   npm install express axios
   ```
   (Add `cors` if you run the frontend from a different origin.)

2. Create a `.env` file in the project root and set your API key:
   ```bash
   TMDB_API_KEY=your_tmdb_key_here
   ```

3. Start the server:
   ```bash
   node server/index.js
   ```

4. Visit `http://localhost:3000` to use the app.

## Project Structure

- `server/index.js`: Express server with `/api/recommend` proxy endpoint.
- `public/index.html`: UI shell.
- `public/styles.css`: Styling and responsive layout.
- `public/app.js`: Frontend logic, TMDB calls via proxy, modal interactions.

## Notes

- The TMDB key never touches the frontend; all calls go through `/api/recommend`.
- If TMDB fails or no key is provided, the server responds with curated fallback data (`verified: false`).
- The frontend also contains a lightweight fallback list for complete resilience.

