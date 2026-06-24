# MoodWeave

> **Match your mood. Make the music.**

MoodWeave is a clean, minimal web app that lets you set four mood sliders and
generates a personalized Spotify playlist that matches how you feel right now —
saved directly to your Spotify account.

Live at **[moodweave.app](https://moodweave.app)** · Repo: **[github.com/Loewfizzle/moodweave](https://github.com/Loewfizzle/moodweave)**

---

## The four mood dimensions

| Slider | Low end | High end |
| ------ | ------- | -------- |
| **Energy** | Calm | Energetic |
| **Mood** | Dark | Light |
| **Focus** | Background | Main Character |
| **Edge** | Safe | Weird |

Each is a 0–100 value. Together they describe a mood, which we translate into a
playlist.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4** (CSS-first config — theme tokens live in `app/globals.css`, no `tailwind.config.js`)
- **Spotify Web API** for login and playlist creation
- **Vercel** hosting with the custom domain `moodweave.app` (continuous deploy from `main`)

---

## Status at a glance

✅ Foundation, UI, and full Spotify login all working.
🚧 **Now building:** turning the four sliders into an actual saved playlist.

---

## Roadmap & progress

### ✅ Phase 0 — Foundation
- Next.js 16 + Tailwind v4 project, renamed to `moodweave`
- Git + GitHub repo, Vercel project, `moodweave.app` domain wired up
- Continuous deployment from `main`

### ✅ Phase 1 — UI foundation
- Always-dark theme (`zinc-950` base) with violet/teal accent tokens
- Mobile-first layout (a priority throughout)
- Four reusable mood sliders (`MoodSlider`, a controlled component)
- Shared mood state in one object (`MoodWeaver`)
- "Weave Playlist" button with a temporary local result panel

### ↩️ Phase 2 — Reactive background (explored, then removed)
- Built an intensity-driven background tint + pulsing orb that reacted to
  Energy + Edge. Decided it didn't fit the app and **removed it** to keep
  things calm and minimal. Kept here in history as a deliberate design choice.

### ✅ Phase 3 — Spotify authentication
- **Spotify OAuth only** for v1 (Authorization Code flow). Supabase deferred.
- `GET /api/auth/login` → redirects to Spotify with minimal scopes + CSRF `state`
- `GET /api/auth/callback/spotify` → verifies state, exchanges code for tokens,
  stores them in `httpOnly` cookies
- Homepage shows **"Connected as [name]"** via an authenticated `/me` call

### 🚧 Phase 4 — Playlist generation (current)
Because Spotify deprecated `/recommendations` and audio-features for new apps
(see Constraints below), we use the **Search API** instead.
- **A. Mood → search terms** — pure function mapping sliders to search queries
- **B. Token refresh** — silently renew expired access tokens (in a route handler)
- **C. Weave route** — `POST /api/weave`: search → create playlist → add tracks
- **D. Wire the button** — "Weave Playlist" calls the route, shows the result

### ⬜ Phase 5 — Polish & production
- Loading / error / empty states, refined result view
- Production env vars in Vercel, production redirect URI, final domain checks

---

## How it works (architecture)

```
app/
├─ layout.tsx                       Root layout, fonts, metadata
├─ page.tsx                         Homepage (Server Component): reads session,
│                                   shows "Connected as…" or "Connect Spotify"
├─ globals.css                      Tailwind v4 theme tokens + slider styles
├─ components/
│  ├─ MoodSlider.tsx                Controlled slider (value + onChange props)
│  └─ MoodWeaver.tsx                Client component: owns mood state + button
├─ lib/
│  └─ spotify.ts                    Server helper: getSpotifyProfile() → /me
└─ api/auth/
   ├─ login/route.ts                Start OAuth: redirect to Spotify
   └─ callback/spotify/route.ts     Finish OAuth: tokens → httpOnly cookies
```

**Auth flow:** `login` sends you to Spotify with a random `state` (stored in a
cookie). Spotify redirects back to `callback`, which checks the `state`,
exchanges the `code` for access + refresh tokens (server-side, using the client
secret), and stores them in `httpOnly` cookies. The homepage reads the access
token and calls `/me` to confirm you're connected.

---

## Local development

```bash
npm install
npm run dev
```

Then open **`http://127.0.0.1:3000`**.

> ⚠️ **Use `127.0.0.1`, not `localhost`.** The Spotify redirect URI is registered
> as `127.0.0.1`, and browsers treat `localhost` and `127.0.0.1` as **separate
> sites with separate cookie jars**. Mixing them means the app won't see your
> login. Pick `127.0.0.1` and stick with it in dev.

### Environment variables
Copy `.env.example` to `.env.local` and fill in your Spotify credentials:

```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback/spotify
```

These are **server-only** (no `NEXT_PUBLIC_` prefix), so the secret never
reaches the browser. `.env.local` is git-ignored. Restart the dev server after
changing it.

The same redirect URI must be registered in the
[Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → your
app → Settings. Production additionally uses
`https://moodweave.app/api/auth/callback/spotify`.

---

## Key decisions & constraints

- **Spotify-only login for v1.** Saving a playlist requires Spotify OAuth anyway,
  so it doubles as app sign-in. Supabase/Google accounts can be added later.
- **No `/recommendations` or audio-features.** Spotify
  [deprecated these for new apps](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)
  (Nov 2024). We map moods to **search queries** and use the Search API instead.
- **Always-dark, calm, minimal.** No reactive background; mobile-first everywhere.

## Project conventions

- Commit and push after each working step (continuous history + auto-deploy).
- This is a customized Next.js 16 — read the bundled docs in
  `node_modules/next/dist/docs/` before using framework APIs, since conventions
  differ from older versions (e.g. `cookies()` is async).
