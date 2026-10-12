# ICSE Arena — Access Code Worker

A tiny Cloudflare Worker that validates a weekly, auto-rotating passcode
server-side, so the real passcode never ships to the browser. Free tier, no
sleep/cold-start delay (unlike Render-style hosts), works alongside the
static GitHub Pages site.

**How rotation works:** there's no stored passcode to update by hand. The
Worker derives this week's valid passcode as `HMAC(PASSCODE_SEED, weekIndex)`
— a fixed secret plus the current week number, both fed through a one-way
hash. Every Monday 00:00 UTC, `weekIndex` ticks forward and a brand-new
passcode becomes valid automatically, with the previous week's code still
accepted for one extra week as a grace window (so nobody already mid-login
right at the Monday rollover gets locked out).

## One-time setup (you need to do this part — it needs your own accounts/login)

1. **Create a free Cloudflare account** at https://dash.cloudflare.com/sign-up
   if you don't have one.

2. **Log in with Wrangler** (Cloudflare's CLI) from this folder:
   ```
   cd access-worker
   npx wrangler login
   ```
   This opens a browser window to authorize — approve it there.

3. **Set your three secrets** (you'll be prompted to type each value;
   nothing is echoed to the terminal and none of them are ever committed
   to git):
   ```
   npx wrangler secret put PASSCODE_SEED
   ```
   Type any long random string (mash the keyboard, 30+ characters). This is
   never shown to anyone, including students — it's what the weekly
   passcode is mathematically derived from.
   ```
   npx wrangler secret put TOKEN_SECRET
   ```
   Another long random string, different from the one above — this one
   signs student session tokens.
   ```
   npx wrangler secret put ADMIN_KEY
   ```
   A password only YOU know — this is what you'll type into `admin.html`
   each week to look up the current passcode.

4. **Deploy:**
   ```
   npx wrangler deploy
   ```
   Wrangler will print your Worker's live URL, something like:
   ```
   https://icse-arena-access.<your-subdomain>.workers.dev
   ```

5. **Plug that URL into both files that need it:**
   - `../index.html` — find `const ACCESS_WORKER_URL = "REPLACE_WITH_YOUR_WORKER_URL";`
   - `../admin.html` — find the same line
   Replace both with the URL from step 4, then commit and push.

## Getting this week's passcode

Open `admin.html` (on the live site, e.g.
`https://sandeepdannapuneni-coder.github.io/LearningLab/admin.html`), type
your admin key, and it shows the current passcode plus exactly when it next
rotates. Nothing to configure weekly — it's just a lookup.

## Why this approach

- The site itself stays 100% static (GitHub Pages, free, no backend to run).
- The passcode is never stored anywhere, committed, or sent to the browser
  except at the moment a student actually submits it for checking — it's
  recomputed fresh from the seed on every request.
- A logged-in session is a signed token the browser can't forge (it doesn't
  know `TOKEN_SECRET`), so someone can't bypass the gate by just setting a
  flag in `localStorage` via devtools.
- `admin-passcode` lookups are gated by a separate `ADMIN_KEY` that only you
  know, so a student finding `admin.html` can't use it to read the passcode
  for themselves.
