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
  const calls = { generate: 0, owner: [], graph: [], prompts: [], systems: [] };
  const app = createApp({
    apiKey: 'test-key',
    loadCatalog: async () => ({ ok: true, stale: false, items: [], updated: '' }),
    generate: async ({ contents, system } = {}) => {
      calls.generate += 1;
      calls.prompts.push(contents?.[0]?.parts?.[0]?.text || '');
      calls.systems.push(system || '');
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
      env: {},
      ...overrides,
    },
  });
  return { app, calls };
}

function createClock(start = 1_700_000_000_000) {
  let t = start;
  let seq = 0;
  const timers = new Map();
  return {
    now: () => t,
    schedule(fn, ms) {
      const id = ++seq;
      timers.set(id, { at: t + ms, fn });
      return id;
    },
    clearSchedule(id) {
      timers.delete(id);
    },
    pending() {
      return timers.size;
    },
    async advance(ms) {
      const target = t + ms;
      for (;;) {
        let chosen = null;
        for (const [id, timer] of timers) {
          if (timer.at <= target && (!chosen || timer.at < chosen.at)) chosen = { id, at: timer.at, fn: timer.fn };
        }
        if (!chosen) break;
        timers.delete(chosen.id);
        t = chosen.at;
        await chosen.fn();
      }
      t = target;
    },
  };
}

function clockedApp(overrides = {}) {
  const clock = createClock();
  return {
    clock,
    ...appFor({
      now: clock.now,
      schedule: clock.schedule,
      clearSchedule: clock.clearSchedule,
      ...overrides,
    }),
  };
}

function textEvent(psid, text) {
  return {
    object: 'page',
    entry: [{ messaging: [{ sender: { id: psid }, recipient: { id: 'PAGE' }, message: { text } }] }],
  };
}

async function send(base, payload) {
  const body = JSON.stringify(payload);
  return fetch(base + '/webhook/facebook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': sign(body),
    },
    body,
  });
}

function waitTick() {
  return new Promise((resolve) => setImmediate(resolve));
}

function replies(calls) {
  return calls.graph.filter((body) => body.message?.text).map((body) => body.message.text);
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

test('webhook trả 200 ngay, gom một tin sau khoảng 4 giây', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp();
  await withServer(app, async (base) => {
    const res = await send(base, textEvent('U1', 'có xoài không'));
    assert.equal(res.status, 200);
    await waitTick();
    assert.equal(calls.generate, 0);
    assert.equal(calls.graph.some((body) => body.sender_action === 'typing_on'), true);
    assert.deepEqual(replies(calls), []);

    await clock.advance(3999);
    assert.equal(calls.generate, 0);
    await clock.advance(1);
    assert.equal(calls.generate, 1);
    assert.deepEqual(replies(calls), ['Giá lấy từ danh mục.']);
    assert.equal(calls.graph.find((body) => body.message?.text).message.metadata, 'mocqua-bot');
    assert.match(calls.prompts[0], /Tin nhắn khách nằm giữa hai dấu/);
    assert.doesNotMatch(calls.prompts[0], /vài tin liên tiếp/);
    assert.match(calls.prompts[0], /<<<\ncó xoài không\n>>>/);
    await app.locals.drainFacebook();
  });
});

test('vài tin sát nhau thành một lần gọi Gemini', { timeout: 4000 }, async () => {
  let loads = 0;
  const { app, calls, clock } = clockedApp({
    loadCatalog: async () => {
      loads += 1;
      return {
        ok: true,
        stale: false,
        updated: '2026-11-14',
        items: [{
          brand: 'Cheers+',
          name: 'Xoài sấy thăng hoa',
          weight: '100g',
          price: 145000,
          url: 'https://mocqua.onrender.com/san-pham/xoai-say-thang-hoa',
        }],
      };
    },
  });
  await withServer(app, async (base) => {
    for (const text of ['chào shop', 'có xoài ko', 'giá sao']) {
      const res = await send(base, textEvent('U2', text));
      assert.equal(res.status, 200);
    }
    await waitTick();
    assert.equal(calls.generate, 0);
    await clock.advance(4000);
    assert.equal(calls.generate, 1);
    assert.equal(loads, 1);
    assert.deepEqual(replies(calls), ['Giá lấy từ danh mục.']);
    assert.match(calls.prompts[0], /vài tin liên tiếp/);
    assert.match(calls.prompts[0], /<<<\nchào shop\ncó xoài ko\ngiá sao\n>>>/);
    assert.match(calls.systems[0], /145000/);
    assert.match(calls.systems[0], /Xoài sấy thăng hoa/);

    await send(base, textEvent('U2', 'còn hàng không'));
    await clock.advance(4000);
    assert.equal(calls.generate, 2);
    assert.equal(loads, 2);
    assert.match(calls.prompts[1], /Khách: chào shop\ncó xoài ko\ngiá sao/);
    assert.match(calls.prompts[1], /Mộc Quả: Giá lấy từ danh mục/);
    assert.doesNotMatch(calls.prompts[1], /vài tin liên tiếp/);
    await app.locals.drainFacebook();
  });
});

test('cùng một webhook nhiều tin vẫn gom một lần', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp();
  await withServer(app, async (base) => {
    const res = await send(base, {
      object: 'page',
      entry: [{
        messaging: ['chào shop', 'có xoài ko', 'giá sao'].map((text) => ({
          sender: { id: 'U3' },
          recipient: { id: 'PAGE' },
          message: { text },
        })),
      }],
    });
    assert.equal(res.status, 200);
    await waitTick();
    await clock.advance(4000);
    assert.equal(calls.generate, 1);
    assert.match(calls.prompts[0], /chào shop\ncó xoài ko\ngiá sao/);
    await app.locals.drainFacebook();
  });
});

test('im lặng tính từ tin cuối, và có trần chờ', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp();
  await withServer(app, async (base) => {
    await send(base, textEvent('U4', 'tin đầu'));
    await clock.advance(3000);
    await send(base, textEvent('U4', 'tin sau'));
    await clock.advance(3000);
    assert.equal(calls.generate, 0);
    await clock.advance(1000);
    assert.equal(calls.generate, 1);
    assert.match(calls.prompts[0], /tin đầu\ntin sau/);

    await send(base, textEvent('U4', 'mốc'));
    await clock.advance(3000);
    await send(base, textEvent('U4', 'nữa'));
    await clock.advance(3000);
    await send(base, textEvent('U4', 'tiếp'));
    await clock.advance(3000);
    await send(base, textEvent('U4', 'cuối'));
    await clock.advance(2999);
    assert.equal(calls.generate, 1);
    await clock.advance(1);
    assert.equal(calls.generate, 2);
    assert.match(calls.prompts[1], /mốc\nnữa\ntiếp\ncuối/);
    await app.locals.drainFacebook();
  });
});

test('một cụm tính một lượt, mặc định 20 lượt mỗi 10 phút', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp();
  await withServer(app, async (base) => {
    for (const text of ['chào shop', 'có xoài ko', 'giá sao', 'còn không', 'ship không']) {
      await send(base, textEvent('U5', text));
    }
    await clock.advance(4000);
    assert.equal(calls.generate, 1);

    for (let i = 0; i < 19; i += 1) {
      await send(base, textEvent('U5', `câu ${i}`));
      await clock.advance(4000);
    }
    assert.equal(calls.generate, 20);

    await send(base, textEvent('U5', 'thêm một câu'));
    await send(base, textEvent('U5', 'và một câu nữa'));
    await waitTick();
    assert.equal(calls.generate, 20);
    assert.deepEqual(replies(calls).filter((text) => text.includes('nhắn hơi nhanh')), [
      'Anh/chị nhắn hơi nhanh. Mộc Quả trả lời tiếp sau ít phút.',
    ]);

    await send(base, textEvent('U6', 'chào shop'));
    await clock.advance(4000);
    assert.equal(calls.generate, 21);
    await app.locals.drainFacebook();
  });
});

test('hết cửa sổ thì trả lời lại, và nhắc nhanh chỉ một lần mỗi cửa sổ', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp({ rateMax: 1, rateWindowMs: 10_000 });
  await withServer(app, async (base) => {
    await send(base, textEvent('U7', 'câu một'));
    await clock.advance(4000);
    assert.equal(calls.generate, 1);

    await send(base, textEvent('U7', 'câu hai'));
    await send(base, textEvent('U7', 'câu ba'));
    await waitTick();
    assert.equal(calls.generate, 1);
    assert.equal(replies(calls).filter((text) => text.includes('nhắn hơi nhanh')).length, 1);

    await clock.advance(9_999);
    await send(base, textEvent('U7', 'vẫn nhanh'));
    await waitTick();
    assert.equal(replies(calls).filter((text) => text.includes('nhắn hơi nhanh')).length, 1);

    await clock.advance(1);
    await send(base, textEvent('U7', 'câu mới'));
    await clock.advance(4000);
    assert.equal(calls.generate, 2);
    await send(base, textEvent('U7', 'lại nhanh'));
    await waitTick();
    assert.equal(replies(calls).filter((text) => text.includes('nhắn hơi nhanh')).length, 2);
    await app.locals.drainFacebook();
  });
});

test('FB_RATE_MAX và FB_RATE_WINDOW_MS chỉnh được', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp({
    env: { FB_RATE_MAX: '2', FB_RATE_WINDOW_MS: '60000' },
  });
  await withServer(app, async (base) => {
    await send(base, textEvent('U8', 'một'));
    await clock.advance(4000);
    await send(base, textEvent('U8', 'hai'));
    await clock.advance(4000);
    assert.equal(calls.generate, 2);
    await send(base, textEvent('U8', 'ba'));
    await waitTick();
    assert.equal(calls.generate, 2);
    assert.equal(replies(calls).filter((text) => text.includes('nhắn hơi nhanh')).length, 1);
    await clock.advance(55_999);
    await send(base, textEvent('U8', 'vẫn trong cửa sổ'));
    await waitTick();
    assert.equal(replies(calls).filter((text) => text.includes('nhắn hơi nhanh')).length, 1);
    await app.locals.drainFacebook();
  });
});

test('xin gặp người hoặc nhân viên xen vào thì hủy cụm đang chờ', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp();
  await withServer(app, async (base) => {
    await send(base, textEvent('U9', 'có xoài không'));
    await send(base, textEvent('U9', 'Cho mình gặp nhân viên'));
    await app.locals.drainFacebook();
    assert.equal(calls.generate, 0);
    assert.match(calls.owner[0], /người thật/);
    assert.match(calls.owner[0], /có xoài không/);
    assert.match(JSON.stringify(calls.graph), /đã báo nhân viên/);
    await clock.advance(12_000);
    assert.equal(calls.generate, 0);

    await send(base, {
      object: 'page',
      entry: [{
        messaging: [{
          sender: { id: 'PAGE' },
          recipient: { id: 'U10' },
          message: { is_echo: true, text: 'Mộc Quả đã báo', metadata: 'mocqua-bot' },
        }],
      }],
    });
    await send(base, textEvent('U10', 'giá xoài'));
    await clock.advance(4000);
    assert.equal(calls.generate, 1);

    await send(base, textEvent('U11', 'có mít không'));
    await send(base, {
      object: 'page',
      entry: [{
        messaging: [{
          sender: { id: 'PAGE' },
          recipient: { id: 'U11' },
          message: { is_echo: true, text: 'để em xem', metadata: 'nhan-vien' },
        }],
      }],
    });
    await app.locals.drainFacebook();
    assert.match(calls.owner.at(-1), /Nhân viên đã trả lời/);
    await clock.advance(12_000);
    assert.equal(calls.generate, 1);
    await send(base, textEvent('U11', 'giá sao'));
    await clock.advance(4000);
    assert.equal(calls.generate, 1);
  });
});

test('nút bấm, đơn hàng và ảnh không bị hoãn 4 giây', { timeout: 4000 }, async () => {
  const { app, calls, clock } = clockedApp();
  await withServer(app, async (base) => {
    const button = await send(base, {
      object: 'page',
      entry: [{
        messaging: [{
          sender: { id: 'U12' },
          recipient: { id: 'PAGE' },
          postback: { title: 'Xem xoài', payload: 'XOAI' },
        }],
      }],
    });
    assert.equal(button.status, 200);
    await app.locals.drainFacebook();
    assert.equal(clock.pending(), 0);
    assert.equal(calls.generate, 1);
    assert.match(calls.prompts[0], /Xem xoài/);
    assert.doesNotMatch(calls.prompts[0], /vài tin liên tiếp/);

    await send(base, textEvent('U13', 'có xoài không'));
    await send(base, textEvent('U13', 'Nguyễn An\n0901234567\n12 đường Lê Lợi phường Bến Nghé'));
    await app.locals.drainFacebook();
    assert.equal(calls.generate, 1);
    assert.match(calls.owner[0], /0901234567/);
    assert.match(calls.owner[0], /có xoài không/);
    assert.match(JSON.stringify(calls.graph), /đã ghi nhận thông tin/);
    await clock.advance(12_000);
    assert.equal(calls.generate, 1);

    await send(base, {
      object: 'page',
      entry: [{
        messaging: [{
          sender: { id: 'U14' },
          recipient: { id: 'PAGE' },
          message: { attachments: [{ type: 'image' }] },
        }],
      }],
    });
    await app.locals.drainFacebook();
    assert.match(calls.owner.at(-1), /ảnh hoặc tệp/);
    assert.match(JSON.stringify(calls.graph), /sẽ xem ảnh/);
    assert.equal(clock.pending(), 0);
    assert.equal(calls.generate, 1);
  });
});
