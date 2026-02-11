const fetch = globalThis.fetch || require('node-fetch');
const BASE = process.env.BASE_URL || 'http://localhost:3001';
const headers = { 'Content-Type': 'application/json' };

async function signin() {
  // Sign in using NextAuth Credentials callback by posting form data.
  const url = `${BASE}/api/auth/callback/credentials`;
  const body = new URLSearchParams({ email: 'owner@demo.local', password: 'devpassword' }).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual'
  });
  const cookies = res.headers.get('set-cookie') || '';
  console.log('signin status', res.status);
  return cookies;
}

async function createContent(cookies) {
  const res = await fetch(`${BASE}/api/content-items`, {
    method: 'POST',
    headers: { ...headers, cookie: cookies },
    body: JSON.stringify({
      type: 'WP_POST',
      topic: 'smoke test item',
      mainKeyword: 'smoke-test',
      status: 'DRAFT'
    })
  });
  console.log('/api/content-items POST', res.status);
  return res.json().catch(() => null);
}

async function approveContent(id, cookies) {
  const res = await fetch(`${BASE}/api/content-items/${id}`, {
    method: 'PATCH',
    headers: { ...headers, cookie: cookies },
    body: JSON.stringify({ status: 'APPROVED' })
  });
  console.log('/api/content-items/:id PATCH', res.status);
  return res.json().catch(() => null);
}

async function inbox(cookies) {
  const res = await fetch(`${BASE}/inbox`, {
    method: 'GET',
    headers: { cookie: cookies }
  });
  console.log('/inbox GET', res.status);
  return res.text().catch(() => null);
}

(async () => {
  try {
    const cookies = await signin();
    const created = await createContent(cookies);
    console.log('created', created?.id || created);
    if (created?.id) {
      const patched = await approveContent(created.id, cookies);
      console.log('patched', patched?.id || patched);
    }
    const ib = await inbox(cookies);
    console.log('inbox length', typeof ib === 'string' ? ib.length : ib);
  } catch (e) {
    console.error('smoke test failed', e);
    process.exitCode = 2;
  }
})();
