<div align="center">
  <h1>🍿 Cinny OTT Streaming Platform</h1>
  <p>A full-stack, personalized media streaming application for Movies, Series, and Anime.</p>
</div>

## 📖 What is this project about?
Cinny is a comprehensive, full-stack OTT (Over-The-Top) media discovery and streaming platform. It provides a seamless viewing experience with a heavy focus on intuitive personalization. It features a custom "Suggested" recommendation engine that dynamically cross-matches exact languages (e.g., Bollywood vs Hollywood) and genre tags to deliver highly accurate suggestions based on the user's watch history.

## 💻 Tech Stack
**Frontend:**
- **React.js (Vite)**: For blazing fast UI rendering and development.
- **Tailwind CSS**: For responsive, modern, and highly-customizable dark-mode styling.
- **Context API**: Global state management for user sessions, themes, and viewing history.

**Backend:**
- **Node.js & Express.js**: Lightweight and fast REST API server.
- **PostgreSQL**: Relational database strictly using `SERIAL` integer IDs for data integrity.
- **`pg` (node-postgres)**: Raw SQL queries for database interactions.
- **bcryptjs & jsonwebtoken (JWT)**: Secure user authentication and password hashing.

## 🔌 External APIs & Data Sources
- **TMDB (The Movie Database) API**: The core metadata engine of the application. TMDB is used to fetch all movie/series details, posters, cast information, and trending lists. The platform heavily utilizes TMDB's `/discover` endpoints to filter content by original language, specific networks (like Netflix or Hotstar), and genres.
- **Video Embed Providers**: The platform integrates third-party iframe embed sources (such as *Videasy*, *Screenscape*, *Vidsrc*, and *Vidlink*) inside the Watch Page to provide actual video playback without hosting heavy media files locally.

## 🧭 Frontend Routes
- `/` **(Home Page)**: Showcases trending hits, platform-specific filters (CineNet, CineHot, etc.), and personalized suggestions.
- `/movies` **(Movies Page)**: Dedicated movie discovery with advanced sorting and a language-locked "Suggested" tab.
- `/series` **(Series Page)**: Discover TV shows globally or filter by specific networks.
- `/anime` **(Anime Page)**: A specialized section pulling content with the `Animation (16)` genre, featuring smart cross-recommendations.
- `/watch/:type/:id` **(Watch Page)**: The media player interface. Embeds multiple video sources, manages server-switching, and handles next-episode auto-play.
- `/search` **(Search Page)**: Real-time global query search for any media.
- `/watchlater` **(Watch Later)**: The user's personal saved watchlist.

## ⚙️ Backend APIs & Routes
All backend routes are prefixed with `/api` and run on port 5000 by default. Routes interacting with user data require a Bearer JWT Token in the Authorization header.

**Authentication:**
- `POST /auth/signup` - Registers a new user with a username and password.
- `POST /auth/login` - Authenticates a user and returns a JWT token.

**Watch History:**
- `GET /history` - Retrieves the user's 100 most recently watched items.
- `POST /history` - Upserts a media item into the watch history (updates timestamp if it exists).
- `DELETE /history` - Clears the user's entire watch history.

**Watch Later:**
- `GET /watchlater` - Fetches the user's saved watchlist.
- `POST /watchlater` - Toggles (Adds/Removes) an item in the watch later list.

**Continue Watching:**
- `GET /continuewatching` - Retrieves TV shows currently in progress.
- `POST /continuewatching` - Updates the user's current season/episode timestamp.
- `DELETE /continuewatching/:item_id/:item_type` - Removes a specific show from the list.
- `DELETE /continuewatching` - Clears all continue watching progress.

## 🔑 Environment Variables Setup
To run this project locally, you will need to create two separate `.env` files.

**1. Backend Environment (`/backend/.env`)**
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinny
JWT_SECRET=your_super_secret_jwt_key
```

**2. Frontend Environment (`/cinny/.env`)**
```env
VITE_TMDB_KEY=your_tmdb_api_v3_key
```

## 🧠 Key Architecture Concepts to Understand

**1. Smart Genre Translation Engine**
TMDB uses entirely different internal Genre IDs for Movies versus TV Shows (e.g., *Action* is `28` for Movies, but *Action & Adventure* is `10759` for TV). If a user watches an Action Movie and navigates to the Series page, the app's internal translation engine automatically converts the movie genre IDs into their exact TV Show equivalents before querying the API. This ensures cross-platform suggestions are flawlessly accurate.

**2. Database Auto-Initialization**
When the Node.js server starts, `db.js` is programmed to automatically connect to the default Postgres instance, check if the `cinny` database exists, create it if it doesn't, and subsequently build all the necessary relational tables (`users`, `watch_history`, `watch_later`, `continue_watching`). No manual SQL setup is required!

**3. "Wood" Language Locking**
To ensure the Indian/Bollywood aesthetic isn't cluttered by generic Hollywood results, the app uses TMDB's `with_original_language` parameter to strictly lock queries to Indian regional languages (`hi|ta|te|ml|kn|bn|pa`) when in "Indian Mode", providing a deeply localized user experience.
