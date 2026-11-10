import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { createApp } from '../src/app.js';

const SECRET = 'test-app-secret';

function sign(body) {
  return 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function withServer(app, fn) {
  const server = await listen(app);
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

function appFor(overrides = {}) {
  const calls = { generate: 0, owner: [], graph: [] };
  const app = createApp({
    apiKey: 'test-key',
    loadCatalog: async () => ({ ok: true, stale: false, items: [], updated: '' }),
    generate: async () => {
      calls.generate += 1;
      return 'Giá lấy từ danh mục.';
    },
    facebook: {
      settings: { verifyToken: 'verify-me', appSecret: SECRET, pageToken: 'page-token' },
      sendOwner: async (text) => { calls.owner.push(text); },
      fetchImpl: async (_url, init) => {
        calls.graph.push(JSON.parse(init.body));
        return new Response('{}', { status: 200 });
      },
      now: () => 1_700_000_000_000,
      ...overrides,
    },
  });
  return { app, calls };
}

async function post(base, app, payload) {
  const body = JSON.stringify(payload);
  const res = await fetch(base + '/webhook/facebook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': sign(body),
      origin: 'https://evil.example',
    },
    body,
  });
  await app.locals.drainFacebook();
  return res;
}

test('Facebook xác thực webhook và từ chối chữ ký sai', async () => {
  const { app } = appFor();
  await withServer(app, async (base) => {
    const ok = await fetch(base + '/webhook/facebook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=12345', {
      headers: { origin: 'https://evil.example' },
    });
    assert.equal(ok.status, 200);
    assert.equal(await ok.text(), '12345');
    const badToken = await fetch(base + '/webhook/facebook?hub.mode=subscribe&hub.verify_token=sai&hub.challenge=12345');
    assert.equal(badToken.status, 403);

    const body = JSON.stringify({ object: 'page', entry: [] });
    const rejected = await fetch(base + '/webhook/facebook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=deadbeef' },
      body,
    });
    assert.equal(rejected.status, 403);
  });
});

test('echo do bot gửi thì bỏ qua, không gọi Gemini', async () => {
  const { app, calls } = appFor();
  await withServer(app, async (base) => {
    const res = await post(base, app, {
      object: 'page',
      entry: [{ messaging: [{ sender: { id: 'PAGE' }, recipient: { id: 'USER1' }, message: { is_echo: true, text: 'Mộc Quả đã báo', metadata: 'mocqua-bot' } }] }],
    });
    assert.equal(res.status, 200);
    assert.equal(calls.generate, 0);
    assert.deepEqual(calls.owner, []);
    assert.deepEqual(calls.graph, []);
  });
});

test('khách xin gặp người thật thì tạm dừng bot', async () => {
  const { app, calls } = appFor();
  await withServer(app, async (base) => {
    const first = await post(base, app, {
      object: 'page',
      entry: [{ messaging: [{ sender: { id: 'USER2' }, recipient: { id: 'PAGE' }, message: { text: 'Cho mình gặp nhân viên' } }] }],
    });
    assert.equal(first.status, 200);
    assert.equal(calls.generate, 0);
    assert.match(calls.owner[0], /người thật|Facebook cần người thật/);
    assert.match(JSON.stringify(calls.graph), /đã báo nhân viên/);
    const second = await post(base, app, {
      object: 'page',
      entry: [{ messaging: [{ sender: { id: 'USER2' }, recipient: { id: 'PAGE' }, message: { text: 'Xoài giá bao nhiêu?' } }] }],
    });
    assert.equal(second.status, 200);
    assert.equal(calls.generate, 0);
  });
});

test('thiếu biến Facebook thì webhook không làm gì', async () => {
  let called = false;
  const app = createApp({
    facebook: {
      settings: { verifyToken: '', appSecret: '', pageToken: '' },
      generate: async () => { called = true; return 'x'; },
    },
  });
  await withServer(app, async (base) => {
    const verify = await fetch(base + '/webhook/facebook?hub.mode=subscribe&hub.verify_token=x&hub.challenge=1');
    assert.equal(verify.status, 403);
    const res = await fetch(base + '/webhook/facebook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).skipped, true);
    assert.equal(called, false);
  });
});
