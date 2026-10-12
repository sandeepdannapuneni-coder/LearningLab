// Tiny, stateless access-code gate for the ICSE Arena static site.
//
// The site itself (GitHub Pages) is 100% static, so the real passcode must
// never ship to the browser — this Worker is the only thing that ever
// checks it. Rather than one static code you must remember to change, the
// valid passcode AUTO-ROTATES every week (Monday 00:00 UTC): it's derived
// as HMAC-SHA256(PASSCODE_SEED, weekIndex), so a brand-new passcode exists
// automatically with zero manual action, and nothing about last week's
// passcode works this week. A correct login gets a signed, time-limited
// session token (HMAC-SHA256 over its own expiry, keyed by TOKEN_SECRET)
// instead of the passcode itself; the client stores that token and asks
// this Worker to re-verify it on later visits. Because the client can
// never compute a valid signature without TOKEN_SECRET, it can't forge a
// token by just writing to localStorage — unlike a plain "isLoggedIn =
// true" flag would allow.
//
// Three secrets are required (set via `wrangler secret put`), never
// committed:
//   PASSCODE_SEED — derives this week's passcode; never shown to anyone
//   TOKEN_SECRET  — a random signing key for session tokens
//   ADMIN_KEY     — only you know this; lets you look up the current
//                   week's passcode via the "admin-passcode" action

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — session lasts a week either way
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const REFERENCE_MONDAY_UTC_MS = Date.UTC(1970, 0, 5); // 1970-01-05 was a Monday — anchors rotation to Mondays

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

async function hmacHex(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function currentWeekIndex(now) {
  return Math.floor((now - REFERENCE_MONDAY_UTC_MS) / WEEK_MS);
}

function weekStartMs(weekIndex) {
  return REFERENCE_MONDAY_UTC_MS + weekIndex * WEEK_MS;
}

// A 6-character, easy-to-type-and-read passcode (uppercase letters + digits,
// ambiguous characters like O/0 and I/1 excluded) derived purely from the
// week index and the seed — nothing stored, nothing to rotate by hand.
const PASSCODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function passcodeForWeek(weekIndex, seed) {
  const hash = await hmacHex("week:" + weekIndex, seed);
  // Walk the hex digest in 2-char chunks, map each byte onto the alphabet.
  let code = "";
  for (let i = 0; i < 6; i++) {
    const byte = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
    code += PASSCODE_ALPHABET[byte % PASSCODE_ALPHABET.length];
  }
  return code;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return json({ ok: false, error: "Bad request" }, 400, origin);
    }

    if (!env.PASSCODE_SEED || !env.TOKEN_SECRET || !env.ADMIN_KEY) {
      // Secrets not configured yet — fail closed, not open.
      return json({ ok: false, error: "Server not configured" }, 500, origin);
    }

    const now = Date.now();
    const weekIndex = currentWeekIndex(now);

    if (body.action === "login") {
      const submitted = String(body.code || "").trim().toUpperCase();
      // Accept this week's passcode, or the previous week's for a one-week
      // grace window — so anyone who got the code just before a Monday
      // rollover isn't locked out mid-session.
      const current = await passcodeForWeek(weekIndex, env.PASSCODE_SEED);
      const previous = await passcodeForWeek(weekIndex - 1, env.PASSCODE_SEED);

      if (!submitted || !(constantTimeEqual(submitted, current) || constantTimeEqual(submitted, previous))) {
        return json({ ok: false, error: "Invalid access code" }, 401, origin);
      }
      const expiresAt = now + TOKEN_TTL_MS;
      const token = await hmacHex(String(expiresAt), env.TOKEN_SECRET);
      return json({ ok: true, token, expiresAt }, 200, origin);
    }

    if (body.action === "verify") {
      const { token, expiresAt } = body;
      if (!token || !expiresAt || now > Number(expiresAt)) {
        return json({ ok: false }, 200, origin);
      }
      const expected = await hmacHex(String(expiresAt), env.TOKEN_SECRET);
      return json({ ok: constantTimeEqual(expected, token) }, 200, origin);
    }

    if (body.action === "admin-passcode") {
      if (!body.adminKey || !constantTimeEqual(String(body.adminKey), String(env.ADMIN_KEY))) {
        return json({ ok: false, error: "Invalid admin key" }, 401, origin);
      }
      const current = await passcodeForWeek(weekIndex, env.PASSCODE_SEED);
      const nextRotationAt = weekStartMs(weekIndex + 1);
      return json({ ok: true, passcode: current, nextRotationAt }, 200, origin);
    }

    return json({ ok: false, error: "Unknown action" }, 400, origin);
  },
};
