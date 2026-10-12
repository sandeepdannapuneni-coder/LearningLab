// Tiny, stateless access-code gate for the ICSE Arena static site.
//
// The site itself (GitHub Pages) is 100% static, so the real access code
// must never ship to the browser — this Worker holds it as a server-side
// secret (env.ACCESS_CODE) and is the only thing that ever compares against
// it. A correct code gets a signed, time-limited token (HMAC-SHA256 over its
// own expiry, keyed by env.TOKEN_SECRET) instead of the code itself; the
// client stores that token and asks this Worker to re-verify it on later
// visits. Because the client can never compute a valid signature without
// TOKEN_SECRET, it can't forge a token by just writing to localStorage —
// unlike a plain "isLoggedIn = true" flag would allow.
//
// Two secrets are required (set via `wrangler secret put`), never committed:
//   ACCESS_CODE  — the code you give to students
//   TOKEN_SECRET — a random signing key (not shared with anyone)

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

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

    if (!env.ACCESS_CODE || !env.TOKEN_SECRET) {
      // Secrets not configured yet — fail closed, not open.
      return json({ ok: false, error: "Server not configured" }, 500, origin);
    }

    if (body.action === "login") {
      const submitted = String(body.code || "").trim().toLowerCase();
      const expected = String(env.ACCESS_CODE).trim().toLowerCase();
      if (!submitted || submitted !== expected) {
        return json({ ok: false, error: "Invalid access code" }, 401, origin);
      }
      const expiresAt = Date.now() + TOKEN_TTL_MS;
      const token = await hmacHex(String(expiresAt), env.TOKEN_SECRET);
      return json({ ok: true, token, expiresAt }, 200, origin);
    }

    if (body.action === "verify") {
      const { token, expiresAt } = body;
      if (!token || !expiresAt || Date.now() > Number(expiresAt)) {
        return json({ ok: false }, 200, origin);
      }
      const expected = await hmacHex(String(expiresAt), env.TOKEN_SECRET);
      return json({ ok: expected === token }, 200, origin);
    }

    return json({ ok: false, error: "Unknown action" }, 400, origin);
  },
};
