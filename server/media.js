import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { ROOT } from './paths.js';
import { problem } from './format.js';

const MAX_BYTES = 4_000_000;
const NAME_RE = /^[a-z0-9-]{1,60}\.(jpg|png|webp)$/;

export function mediaDir() {
  return process.env.MEDIA_DIR || path.join(ROOT, 'data', 'media');
}

function sniff(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export function decodeImage(input) {
  const text = String(input || '');
  const b64 = text.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '').replace(/\s/g, '');
  if (!b64 || !/^[A-Za-z0-9+/=]+$/.test(b64)) throw problem(400, 'Ảnh không đúng dạng.');
  const bytes = Buffer.from(b64, 'base64');
  if (bytes.length < 32 || bytes.length > MAX_BYTES) throw problem(400, 'Ảnh cần nhỏ hơn 4 MB.');
  const type = sniff(bytes);
  if (!type) throw problem(400, 'Chỉ nhận ảnh JPEG, PNG hoặc WebP.');
  return { bytes, type };
}

export function mediaExists(name) {
  return NAME_RE.test(name) && fs.existsSync(path.join(mediaDir(), name));
}

export function readMedia(name) {
  if (!mediaExists(name)) return null;
  const bytes = fs.readFileSync(path.join(mediaDir(), name));
  const ext = name.slice(name.lastIndexOf('.') + 1);
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return { bytes, mime };
}

export function writeMedia(name, bytes) {
  if (!NAME_RE.test(name)) throw problem(400, 'Tên ảnh không hợp lệ.');
  fs.mkdirSync(mediaDir(), { recursive: true });
  fs.writeFileSync(path.join(mediaDir(), name), bytes);
}

export function removeMedia(name) {
  if (!mediaExists(name)) return;
  fs.unlinkSync(path.join(mediaDir(), name));
}

export function saveUpload(productId, decoded) {
  const id = String(productId || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'anh';
  const name = `${id}-${randomBytes(4).toString('hex')}.${decoded.type.ext}`;
  writeMedia(name, decoded.bytes);
  return { name, bytes: decoded.bytes };
}
