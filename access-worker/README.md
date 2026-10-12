# ICSE Arena — Access Code Worker

A tiny Cloudflare Worker that validates the student access code server-side,
so the real code never ships to the browser. Free tier, no sleep/cold-start
delay (unlike Render-style hosts), works alongside the static GitHub Pages
site.

## One-time setup (you need to do this part — it needs your own accounts/login)

1. **Create a free Cloudflare account** at https://dash.cloudflare.com/sign-up
   if you don't have one.

2. **Log in with Wrangler** (Cloudflare's CLI) from this folder:
   ```
   cd access-worker
   npx wrangler login
   ```
   This opens a browser window to authorize — approve it there.

3. **Set your two secrets** (you'll be prompted to type each value; nothing
   is echoed to the terminal and neither value is ever committed to git):
   ```
   npx wrangler secret put ACCESS_CODE
   ```
   Type the actual code you want to give students, e.g. `ICSE2026` — pick
   whatever you like.
   ```
   npx wrangler secret put TOKEN_SECRET
   ```
   Type any long random string (e.g. mash the keyboard for 30+ characters).
   This one is never shown to anyone, including students — it's just what
   signs the session tokens.

4. **Deploy:**
   ```
   npx wrangler deploy
   ```
   Wrangler will print your Worker's live URL, something like:
   ```
   https://icse-arena-access.<your-subdomain>.workers.dev
   ```

5. **Plug that URL into the site.** Open `../index.html`, find the line:
   ```js
   const ACCESS_WORKER_URL = "REPLACE_WITH_YOUR_WORKER_URL";
   ```
   and replace it with the URL from step 4. Commit and push that change.

## Changing the access code later

Just re-run `npx wrangler secret put ACCESS_CODE` with the new value and
`npx wrangler deploy` again — no site changes needed. Anyone already logged
in stays logged in until their session token expires (currently 7 days —
see `TOKEN_TTL_MS` in `src/index.js`), at which point they're prompted for
the access code again. You can't instantly revoke one specific student's
still-active session without extra work — not expected to matter for this
use case, since the longest anyone can be using a now-changed code for is
one week.

## Why this approach

- The site itself stays 100% static (GitHub Pages, free, no backend to run).
- The actual access code lives only as a Cloudflare secret — never in a
  committed file, never sent to the browser, never visible via "View Source."
- A logged-in session is a signed token the browser can't forge (it doesn't
  know `TOKEN_SECRET`), so someone can't bypass the gate by just setting a
  flag in `localStorage` via devtools.
