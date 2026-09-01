/**
 * Ledger sync backend — Cloudflare Worker + KV (free tier).
 *
 * Stores one JSON blob per account name. The app pushes its whole store
 * after every change and pulls on login; newest `updatedAt` wins.
 *
 * Auth: a single shared secret (LEDGER_KEY) sent as `x-ledger-key`.
 * That gates the API to people you gave the key to; per-account PINs
 * stay client-side. Good enough for family/friends, not for strangers.
 *
 * Deploy (once, free):
 *   1. npm i -g wrangler && wrangler login
 *   2. In backend/: wrangler kv namespace create LEDGER   (paste id into wrangler.toml)
 *   3. wrangler secret put LEDGER_KEY                      (choose a passphrase)
 *   4. wrangler deploy                                     (prints your https URL)
 *   5. In the app: Settings link → enter that URL + key.
 */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,PUT,OPTIONS",
  "access-control-allow-headers": "content-type,x-ledger-key",
};

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    const m = url.pathname.match(/^\/account\/([\w.~@+-]{1,64})$/);
    if (!m) return json({ error: "not found" }, 404);

    if ((req.headers.get("x-ledger-key") || "") !== env.LEDGER_KEY)
      return json({ error: "bad key" }, 401);

    const key = "acct:" + m[1].toLowerCase();

    if (req.method === "GET") {
      const v = await env.LEDGER.get(key);
      return v ? new Response(v, { headers: { "content-type": "application/json", ...CORS } })
               : json({ entries: [], debts: [], budgets: {}, updatedAt: 0 });
    }

    if (req.method === "PUT") {
      const body = await req.text();
      if (body.length > 512 * 1024) return json({ error: "too large" }, 413);
      let d; try { d = JSON.parse(body); } catch { return json({ error: "bad json" }, 400); }
      if (!d || !Array.isArray(d.entries)) return json({ error: "bad shape" }, 400);
      // last-writer-wins on updatedAt, so a stale device can't clobber newer data
      const cur = await env.LEDGER.get(key, "json");
      if (cur && (cur.updatedAt || 0) > (d.updatedAt || 0)) return json(cur, 409);
      await env.LEDGER.put(key, body);
      return json({ ok: true });
    }
    return json({ error: "method" }, 405);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "content-type": "application/json", ...CORS },
  });
}
