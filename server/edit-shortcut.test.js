import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { editHref } from '../web/js/edit-shortcut.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocqua-edit-'));
process.env.DB_PATH = path.join(dir, 'shop.sqlite');
process.env.ADMIN_PASSWORD = 'edit-shortcut-pass';
process.env.ADMIN_SECRET = 'edit-shortcut-secret';

test('nút Sửa chỉ trỏ đúng chỗ, và không có trong HTML của khách', async () => {
  assert.equal(editHref('/'), '/admin?edit=home');
  assert.equal(editHref('/cua-hang'), '/admin?edit=page&page=shop');
  assert.equal(editHref('/cua-hang', '?cat=thanghoa'), '/admin?edit=page&page=thanghoa');
  assert.equal(editHref('/danh-muc'), '/admin?edit=page&page=catalog');
  assert.equal(editHref('/combo'), '/admin?edit=page&page=combo');
  assert.equal(editHref('/hop-qua'), '/admin?edit=page&page=gift');
  assert.equal(editHref('/san-pham/sau-rieng-say-thang-hoa-yummy'), '/admin?edit=product&id=sau-rieng-say-thang-hoa-yummy');
  assert.equal(editHref('/gio-hang'), '');

  const { createApp } = await import('./index.js');
  const app = createApp();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const anon = await fetch(base + '/');
    assert.equal(anon.status, 200);
    const home = await anon.text();
    assert.match(home, /\/static\/js\/edit-shortcut\.js/);
    assert.doesNotMatch(home, /class="edit-shortcut"|✏️ Sửa/);
    const cart = await (await fetch(base + '/gio-hang')).text();
    assert.doesNotMatch(cart, /edit-shortcut\.js|✏️ Sửa/);
    assert.equal((await fetch(base + '/api/admin/me')).status, 401);
    const login = await fetch(base + '/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'edit-shortcut-pass' }),
    });
    const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
    assert.equal((await fetch(base + '/api/admin/me', { headers: { cookie } })).status, 200);
    const authed = await (await fetch(base + '/san-pham/sau-rieng-say-thang-hoa-yummy', { headers: { cookie } })).text();
    assert.match(authed, /\/static\/js\/edit-shortcut\.js/);
    assert.doesNotMatch(authed, /class="edit-shortcut"|✏️ Sửa/);
  } finally {
    server.close();
  }
});
