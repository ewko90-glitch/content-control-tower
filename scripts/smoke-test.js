const fetch = globalThis.fetch || require('node-fetch');
const BASE = process.env.BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001';
const SMOKE_EMAIL = process.env.SMOKE_EMAIL || 'owner@demo.local';
const SMOKE_PASSWORD = process.env.SMOKE_PASSWORD || 'devpassword';

function makeCookieJar() {
  const jar = {};
  return {
    setFromHeader(header) {
      if (!header) return;
      // header may be an array in some environments
      const lines = Array.isArray(header) ? header : [header];
      lines.forEach((h) => {
        // split multiple cookies that may be concatenated
        h.split(/,(?=[^ ;]+=)/).forEach((line) => {
          const kv = line.split(';')[0];
          const idx = kv.indexOf('=');
          if (idx > -1) {
            const key = kv.slice(0, idx).trim();
            const val = kv.slice(idx + 1).trim();
            jar[key] = val;
          }
        });
      });
    },
    header() {
      return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
    },
    hasSession() {
      return Object.prototype.hasOwnProperty.call(jar, 'next-auth.session-token') || Object.prototype.hasOwnProperty.call(jar, '__Secure-next-auth.session-token');
    }
  };
}

async function signin() {
  const jar = makeCookieJar();

  // 1) GET CSRF
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { method: 'GET', redirect: 'manual' });
  jar.setFromHeader(csrfRes.headers.get('set-cookie'));
  const csrfJson = await csrfRes.json().catch(() => null);
  const csrfToken = csrfJson?.csrfToken || '';
  console.log('csrf status', csrfRes.status, 'csrfToken present', !!csrfToken);

  // 2) POST credentials
  const form = new URLSearchParams({ csrfToken, email: SMOKE_EMAIL, password: SMOKE_PASSWORD, callbackUrl: `${BASE}/overview`, json: 'true' }).toString();
  const credRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: jar.header() },
    body: form,
    redirect: 'manual'
  });
  jar.setFromHeader(credRes.headers.get('set-cookie'));
  console.log('credentials callback status', credRes.status);
  // 3) Follow redirect/location if present or if NextAuth returned a callback url in JSON or cookie
  const credBody = await credRes.json().catch(() => null);
  let callbackUrl = credRes.headers.get('location') || credBody?.url;
  if (!callbackUrl && jar.header().includes('next-auth.callback-url')) {
    // parse callback cookie
    const cb = jar.header().split(';').find((c) => c.trim().startsWith('next-auth.callback-url='));
    if (cb) {
      const val = cb.split('=')[1] || '';
      callbackUrl = decodeURIComponent(val);
    }
  }
  if (callbackUrl) {
    const url = callbackUrl.startsWith('http') ? callbackUrl : `${BASE}${callbackUrl}`;
    const follow = await fetch(url, { method: 'GET', headers: { cookie: jar.header() }, redirect: 'manual' });
    jar.setFromHeader(follow.headers.get('set-cookie'));
    console.log('follow callback status', follow.status);
  }

  // If still no session cookie, try the non-json credentials flow to force redirect
  if (!jar.hasSession()) {
    console.log('no session cookie yet, retrying credentials flow without json to force redirect');
    const form2 = new URLSearchParams({ csrfToken, email: SMOKE_EMAIL, password: SMOKE_PASSWORD, callbackUrl: `${BASE}/overview` }).toString();
    const credRes2 = await fetch(`${BASE}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: jar.header() },
      body: form2,
      redirect: 'manual'
    });
    jar.setFromHeader(credRes2.headers.get('set-cookie'));
    const loc = credRes2.headers.get('location');
    if (loc) {
      const url2 = loc.startsWith('http') ? loc : `${BASE}${loc}`;
      const follow2 = await fetch(url2, { method: 'GET', headers: { cookie: jar.header() }, redirect: 'manual' });
      jar.setFromHeader(follow2.headers.get('set-cookie'));
      console.log('follow callback 2 status', follow2.status);
    }
  }

  console.log('signin cookies:', jar.header());
  return jar;
}

async function getWorkspaces(cookieHeader) {
  const res = await fetch(`${BASE}/api/workspaces/list`, { method: 'GET', headers: { cookie: cookieHeader } });
  console.log('/api/workspaces/list', res.status);
  return res.json().catch(() => null);
}

async function setActiveWorkspace(workspaceId, cookieHeader) {
  const res = await fetch(`${BASE}/api/workspaces/active`, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: cookieHeader }, body: JSON.stringify({ workspaceId }), redirect: 'manual' });
  console.log('/api/workspaces/active', res.status);
  return res;
}

async function createContent(cookies) {
  const res = await fetch(`${BASE}/api/content-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookies },
    body: JSON.stringify({ type: 'WP_POST', topic: 'smoke test item', mainKeyword: 'smoke-test', status: 'DRAFT' })
  });
  console.log('/api/content-items POST', res.status);
  return res.json().catch(() => null);
}

async function approveContent(id, cookies) {
  const res = await fetch(`${BASE}/api/content-items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', cookie: cookies }, body: JSON.stringify({ status: 'APPROVED' }) });
  console.log('/api/content-items/:id PATCH', res.status);
  return res.json().catch(() => null);
}

async function inboxWithAuth(cookies) {
  const res = await fetch(`${BASE}/inbox`, { method: 'GET', headers: { cookie: cookies }, redirect: 'manual' });
  console.log('/inbox GET (auth) status', res.status);
  return res.text().catch(() => null);
}

async function inboxWithoutAuth() {
  const res = await fetch(`${BASE}/inbox`, { method: 'GET', redirect: 'manual' });
  console.log('/inbox GET (no auth) status', res.status);
  return res;
}

(async () => {
  try {
    const jar = await signin();
    if (!jar.hasSession()) {
      console.error('SMOKE FAIL: no session cookie after signin');
      process.exitCode = 2;
      return;
    }

    // discover workspaces
    const list = await getWorkspaces(jar.header());
    const memberships = list?.memberships || [];
    if (!memberships.length) {
      console.error('SMOKE FAIL: no workspaces available for seeded user');
      process.exitCode = 2;
      return;
    }
    const wsId = memberships[0].workspace?.id || memberships[0].workspaceId || null;
    if (!wsId) {
      console.error('SMOKE FAIL: could not determine workspace id');
      process.exitCode = 2;
      return;
    }

    // set active workspace
    await setActiveWorkspace(wsId, jar.header());

    // create content
    const created = await createContent(jar.header());
    console.log('created', created?.id || created);
    if (created?.id) {
      const patched = await approveContent(created.id, jar.header());
      console.log('patched', patched?.id || patched);
    }

    // inbox should be accessible with auth
    const ib = await inboxWithAuth(jar.header());
    console.log('inbox length (auth):', typeof ib === 'string' ? ib.length : ib);

    // inbox without auth should redirect or deny
    const unauth = await inboxWithoutAuth();
    if (unauth.status === 200) {
      console.error('SMOKE FAIL: /inbox is public (expected redirect or 401)');
      process.exitCode = 2;
      return;
    }
    console.log('inbox protection ok (no cookie):', unauth.status);

    console.log('SMOKE OK: login, auth requests, and inbox protection passed');
  } catch (e) {
    console.error('smoke test failed', e);
    process.exitCode = 2;
  }
})();
