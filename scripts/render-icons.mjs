import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'web', 'icons');

const FOREST = [30, 58, 47, 255];
const CREAM = [247, 241, 232, 255];
const GOLD = [196, 162, 101, 255];
const LEAF = [196, 162, 101, 150];

const PATHS = [
  ['stroke', 'M32 20.5c-9.6 0-15.5 7.4-15.5 15.6 0 8.6 6.9 14.4 15.5 14.4s15.5-5.8 15.5-14.4c0-8.2-5.9-15.6-15.5-15.6z', 1.7, FOREST],
  ['stroke', 'M32 26.5c-5.6 0-9.2 4.4-9.2 9.4 0 5.1 4.1 8.6 9.2 8.6s9.2-3.5 9.2-8.6c0-5-3.6-9.4-9.2-9.4z', 1.05, FOREST],
  ['stroke', 'M32 32c-2.4 0-3.9 1.8-3.9 3.9s1.7 3.6 3.9 3.6 3.9-1.5 3.9-3.6-1.5-3.9-3.9-3.9z', 0.95, FOREST],
  ['stroke', 'M32 20.5c0-4 .8-7 2.6-9.3', 1.35, FOREST],
  ['fill', 'M33.6 15.2c3.6-4.6 9.6-5.1 13-2.6-2.8 4.2-8.6 5.4-13 2.6z', 0, LEAF],
  ['stroke', 'M33.6 15.2c3.6-4.6 9.6-5.1 13-2.6-2.8 4.2-8.6 5.4-13 2.6z', 1.05, GOLD],
];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function canvas(size) {
  const data = Buffer.alloc(size * size * 4);
  const set = (x, y, color) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= size || py >= size) return;
    const i = (py * size + px) * 4;
    const sa = color[3] / 255;
    const da = data[i + 3] / 255;
    const out = sa + da * (1 - sa);
    if (!out) return;
    data[i] = Math.round((color[0] * sa + data[i] * da * (1 - sa)) / out);
    data[i + 1] = Math.round((color[1] * sa + data[i + 1] * da * (1 - sa)) / out);
    data[i + 2] = Math.round((color[2] * sa + data[i + 2] * da * (1 - sa)) / out);
    data[i + 3] = Math.round(out * 255);
  };
  return { size, data, set };
}

function blendDown(src, size, factor) {
  const dest = Buffer.alloc(size * size * 4);
  const area = factor * factor;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let dy = 0; dy < factor; dy += 1) {
        for (let dx = 0; dx < factor; dx += 1) {
          const i = ((y * factor + dy) * src.size + (x * factor + dx)) * 4;
          r += src.data[i];
          g += src.data[i + 1];
          b += src.data[i + 2];
          a += src.data[i + 3];
        }
      }
      const i = (y * size + x) * 4;
      dest[i] = Math.round(r / area);
      dest[i + 1] = Math.round(g / area);
      dest[i + 2] = Math.round(b / area);
      dest[i + 3] = Math.round(a / area);
    }
  }
  return dest;
}

function parsePath(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const cmds = [];
  let i = 0;
  let cmd = '';
  const num = () => {
    const value = Number(tokens[i]);
    i += 1;
    return value;
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) {
      cmd = tokens[i];
      i += 1;
    }
    if (cmd === 'M' || cmd === 'm') cmds.push([cmd, num(), num()]);
    else if (cmd === 'c') cmds.push(['c', num(), num(), num(), num(), num(), num()]);
    else if (cmd === 's') cmds.push(['s', num(), num(), num(), num()]);
    else if (cmd === 'z' || cmd === 'Z') cmds.push(['z']);
    else throw new Error(`Lệnh SVG chưa hỗ trợ: ${cmd}`);
  }
  return cmds;
}

function cubic(p0, p1, p2, p3, steps) {
  const pts = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return pts;
}

function polylines(d) {
  const cmds = parsePath(d);
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let prev = null;
  let poly = [];
  const lines = [];
  const push = () => {
    if (poly.length) lines.push(poly);
    poly = [];
  };
  for (const cmd of cmds) {
    if (cmd[0] === 'M' || cmd[0] === 'm') {
      push();
      cx = cmd[0] === 'm' ? cx + cmd[1] : cmd[1];
      cy = cmd[0] === 'm' ? cy + cmd[2] : cmd[2];
      sx = cx;
      sy = cy;
      poly = [[cx, cy]];
      prev = null;
    } else if (cmd[0] === 'c' || cmd[0] === 's') {
      let c1;
      let c2;
      let end;
      if (cmd[0] === 'c') {
        c1 = [cx + cmd[1], cy + cmd[2]];
        c2 = [cx + cmd[3], cy + cmd[4]];
        end = [cx + cmd[5], cy + cmd[6]];
      } else {
        c1 = prev ? [2 * cx - prev[0], 2 * cy - prev[1]] : [cx, cy];
        c2 = [cx + cmd[1], cy + cmd[2]];
        end = [cx + cmd[3], cy + cmd[4]];
      }
      poly.push(...cubic([cx, cy], c1, c2, end, 12));
      prev = c2;
      cx = end[0];
      cy = end[1];
    } else if (cmd[0] === 'z') {
      poly.push([sx, sy]);
      poly.closed = true;
      push();
      cx = sx;
      cy = sy;
      prev = null;
    }
  }
  push();
  return lines;
}

function distSeg(px, py, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy;
  let t = len ? ((px - a[0]) * dx + (py - a[1]) * dy) / len : 0;
  t = Math.max(0, Math.min(1, t));
  const x = a[0] + t * dx;
  const y = a[1] + t * dy;
  return Math.hypot(px - x, py - y);
}

function strokePoly(board, pts, radius, color) {
  if (radius <= 0) return;
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const minX = Math.floor(Math.min(a[0], b[0]) - radius - 1);
    const maxX = Math.ceil(Math.max(a[0], b[0]) + radius + 1);
    const minY = Math.floor(Math.min(a[1], b[1]) - radius - 1);
    const maxY = Math.ceil(Math.max(a[1], b[1]) + radius + 1);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (distSeg(x + 0.5, y + 0.5, a, b) <= radius) board.set(x, y, color);
      }
    }
  }
}

function fillPoly(board, pts, color) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(board.size - 1, Math.ceil(maxY));
  for (let y = y0; y <= y1; y += 1) {
    const ys = y + 0.5;
    const hits = [];
    for (let i = 1; i < pts.length; i += 1) {
      const a = pts[i - 1];
      const b = pts[i];
      if ((a[1] <= ys && b[1] > ys) || (b[1] <= ys && a[1] > ys)) {
        const t = (ys - a[1]) / (b[1] - a[1]);
        hits.push(a[0] + t * (b[0] - a[0]));
      }
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const x0 = Math.max(0, Math.ceil(hits[i]));
      const x1 = Math.min(board.size - 1, Math.floor(hits[i + 1]));
      for (let x = x0; x <= x1; x += 1) board.set(x, y, color);
    }
  }
}

function strokeCircle(board, cx, cy, r, width, color) {
  const outer = r + width / 2;
  const inner = Math.max(0, r - width / 2);
  const min = Math.floor(cx - outer - 1);
  const max = Math.ceil(cx + outer + 1);
  for (let y = min; y <= max; y += 1) {
    for (let x = min; x <= max; x += 1) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= outer && d >= inner) board.set(x, y, color);
    }
  }
}

function dashCircle(board, cx, cy, r, width, dash, gap, color) {
  const step = dash + gap;
  const laps = Math.ceil((2 * Math.PI * r) / step);
  for (let i = 0; i < laps; i += 1) {
    const a0 = (i * step) / r;
    const a1 = a0 + dash / r;
    const pts = [];
    const n = Math.max(2, Math.ceil((a1 - a0) * r));
    for (let k = 0; k <= n; k += 1) {
      const a = a0 + ((a1 - a0) * k) / n;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    strokePoly(board, pts, width / 2, color);
  }
}

function draw(size) {
  const factor = 2;
  const board = canvas(size * factor);
  const s = size * factor;
  for (let y = 0; y < s; y += 1) {
    for (let x = 0; x < s; x += 1) board.set(x, y, FOREST);
  }
  const scale = (s * 0.58) / 64;
  const ox = (s - 64 * scale) / 2;
  const oy = (s - 64 * scale) / 2;
  const map = (x, y) => [ox + x * scale, oy + y * scale];
  const center = map(32, 32);
  const disc = 27.2 * scale;
  const min = Math.floor(center[0] - disc);
  const max = Math.ceil(center[0] + disc);
  for (let y = min; y <= max; y += 1) {
    for (let x = min; x <= max; x += 1) {
      if (Math.hypot(x + 0.5 - center[0], y + 0.5 - center[1]) <= disc) board.set(x, y, CREAM);
    }
  }
  strokeCircle(board, center[0], center[1], 30 * scale, 1.7 * scale, GOLD);
  dashCircle(board, center[0], center[1], 26.5 * scale, 0.85 * scale, 1 * scale, 2.2 * scale, GOLD);
  for (const [kind, d, width, color] of PATHS) {
    for (const line of polylines(d)) {
      const pts = line.map(([x, y]) => map(x, y));
      if (kind === 'fill') fillPoly(board, pts, color);
      else strokePoly(board, pts, (width * scale) / 2, color);
    }
  }
  return blendDown(board, size, factor);
}

fs.mkdirSync(outDir, { recursive: true });
const files = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];
for (const [name, size] of files) {
  const png = encodePng(size, draw(size));
  fs.writeFileSync(path.join(outDir, name), png);
  console.log(`${name} ${png.length} bytes`);
}
