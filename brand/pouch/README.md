# Mộc Quả: bao bì túi zip (template)

- `pouch.html` exposes `render({mode:'pouch'|'label', name, sub, type, weight, fruit, seed, accent, chili, print})`, which returns an SVG string.
  - pouch: stand-up zip pouch mockup, 900×1250, transparent background.
  - label: flat front label, 100×140 mm (1 unit = 0.1 mm).
  - `print:1` leaves the window blank, for the die-line.
  - Quick preview in a browser: `pouch.html?name=Xoài cát sấy dẻo&fruit=xoai&type=Sấy dẻo&weight=500g`.
- `render_all.py` reads `research/mocqua-own-label-spec.json` and writes `assets/products/mqz/<sku>.jpg` (1200²) and `<sku>-45.jpg` (1200×1500).
- `make_sheet.py` writes `brand/labels-mocqua.png` and `brand/label-mocqua-front-*-100x140mm.svg`.
- Fonts: Cormorant Garamond and Be Vietnam Pro. Convert to outlines before printing, and add 3 mm bleed.
- Run with Playwright + Chrome and Pillow (the box uses `PYTHONPATH=~/.local/lib/python3.13/site-packages ~/.venvs/rembg/bin/python`).
