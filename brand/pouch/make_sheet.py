"""Build Mộc Quả label-design sheet + print-size front-label SVGs.
   python3 make_sheet.py  (needs render_all.py run first -> /tmp/mqz_raw/*.png)"""
import asyncio,json,os,zlib,html
from playwright.async_api import async_playwright
ROOT='/workspace/mocqua';B=ROOT+'/brand';T='file://'+B+'/pouch/pouch.html'
D=json.load(open(ROOT+'/research/mocqua-own-label-spec.json'))
TYPE={'deo':'Sấy dẻo','thanghoa':'Sấy thăng hoa','gion':'Sấy giòn','kho':'Sấy khô','omai':'Ô mai · xí muội','set':'Set quà'}
PRINT=[('label-mocqua-front-100x140mm.svg',dict(name='Sầu riêng Ri6 sấy thăng hoa',sub='Múi cắt',type='Sấy thăng hoa',weight='100g',fruit='saurieng')),
       ('label-mocqua-front-xoai-deo-100x140mm.svg',dict(name='Xoài cát sấy dẻo',sub='Nguyên vị',type='Sấy dẻo',weight='500g',fruit='xoai')),
       ('label-mocqua-front-xi-muoi-100x140mm.svg',dict(name='Xí muội đặc biệt',sub='Đỏ',type='Ô mai · xí muội',weight='250g',fruit='ximuoi'))]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=await b.new_page(viewport={'width':900,'height':1250})
    await pg.goto(T);await pg.evaluate('document.fonts.ready')
    labels=[]
    for fn,sp in PRINT:
      sp=dict(sp,brand='mocqua',mode='label',seed=7)
      svg=await pg.evaluate('s=>render(s)',sp)
      psvg=await pg.evaluate('s=>render(s)',dict(sp,print=1))
      open(B+'/'+fn,'w',encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<!-- Mộc Quả front label, 100x140 mm (1 unit = 0.1 mm). Fonts: Cormorant Garamond, Be Vietnam Pro (outline before print). Dashed arch = clear window, do not print. Add 3 mm bleed. -->\n'+psvg)
      labels.append(svg)
    seal=await pg.evaluate("()=>{const d=[];const s=sealMocqua(200,200,190,d);return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='300' height='300'><defs>${d.join('')}</defs>${s}</svg>`}")
    acc=await pg.evaluate("()=>Object.entries(window.FRUITS).map(([k,v])=>[k,v.brand])")
    sp=D['spec'];grid=''.join(f'<figure><img src="file:///tmp/mqz_raw/{s["sku"]}.png"><figcaption>{s["sku"]}</figcaption></figure>' for s in sp)
    hero=''.join(f'<img src="file:///tmp/mqz_raw/{k}.png">' for k in ['MQZ-DXO-500','MQZ-THSR-100C','MQZ-OMXD-250'])
    sw=''.join(f'<i style="background:{c}" title="{k}"></i>' for k,c in acc[:28])
    page=f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>
    body{{margin:0;width:2400px;background:#F6F0E4;font-family:"Be Vietnam Pro";color:#1E3A2F}}
    .top{{background:#1E3A2F;color:#F6F0E4;padding:60px 80px;display:flex;align-items:center;gap:50px}}
    .top h1{{font:600 84px "Cormorant Garamond";margin:0}} .top h1 em{{color:#C4A265}}
    .top p{{margin:8px 0 0;font-size:24px;letter-spacing:.2em;text-transform:uppercase;color:#C4A265}}
    .row{{display:grid;grid-template-columns:560px 640px 1fr;gap:60px;padding:60px 80px}}
    h2{{font:600 18px "Be Vietnam Pro";letter-spacing:.28em;text-transform:uppercase;color:#9A7B45;margin:0 0 22px;border-bottom:1px solid #d9ccb0;padding-bottom:12px}}
    .pal{{display:flex;gap:14px;margin-bottom:26px}} .pal div{{width:118px}} .pal b{{display:block;height:96px;border-radius:6px;border:1px solid #0002}} .pal span{{font-size:15px;line-height:1.5;display:block;margin-top:6px}}
    .acc{{display:grid;grid-template-columns:repeat(14,1fr);gap:6px;margin-bottom:30px}} .acc i{{height:30px;border-radius:50%}}
    .ty .a{{font:600 64px "Cormorant Garamond";line-height:1}} .ty .b{{font:500 22px "Be Vietnam Pro";letter-spacing:.3em;text-transform:uppercase;margin:12px 0}} .ty .c{{font:italic 30px "Cormorant Garamond";color:#9A7B45}}
    .ty small{{display:block;font-size:16px;color:#555;margin:4px 0 18px}}
    .lab svg{{width:600px;height:840px;box-shadow:0 20px 40px #0003}} .lab p{{font-size:17px;line-height:1.6;color:#444}}
    .hero{{display:flex;align-items:flex-end;justify-content:center;height:840px}} .hero img{{width:340px;margin:0 -30px;filter:drop-shadow(0 30px 24px #0005)}} .hero img:nth-child(2){{width:420px;z-index:2;position:relative}}
    ul{{font-size:19px;line-height:1.7;padding-left:22px;margin:24px 0 0}}
    .grid{{padding:20px 80px 80px;display:grid;grid-template-columns:repeat(13,1fr);gap:18px 10px}}
    figure{{margin:0;text-align:center}} figure img{{width:100%;filter:drop-shadow(0 8px 8px #0003)}} figcaption{{font-size:12px;letter-spacing:.05em;color:#555}}
    </style></head><body>
    <div class="top">{seal}<div><h1>Mộc Quả <em>· bao bì túi zip</em></h1><p>Hệ nhận diện nhãn riêng · mocqua.com · {len(sp)} mã MQZ-</p></div></div>
    <div class="row"><div>
      <h2>Màu thương hiệu</h2><div class="pal"><div><b style="background:#1E3A2F"></b><span>Xanh rừng<br>#1E3A2F</span></div><div><b style="background:#C4A265"></b><span>Vàng đồng<br>#C4A265</span></div><div><b style="background:#F6F0E4"></b><span>Ngà<br>#F6F0E4</span></div><div><b style="background:#1D2A24"></b><span>Mực<br>#1D2A24</span></div></div>
      <h2>Màu nhấn theo quả</h2><div class="acc">{sw}</div>
      <h2>Chữ</h2><div class="ty"><div class="a">Xoài cát sấy dẻo</div><small>Cormorant Garamond 600 · tên sản phẩm</small><div class="b">Sấy thăng hoa</div><small>Be Vietnam Pro 500, giãn chữ · kiểu sấy</small><div class="c">Quả của đất, quà của tình</div><small>Cormorant Italic · khẩu hiệu</small></div>
    </div><div class="lab"><h2>Nhãn mặt trước · 100 × 140 mm</h2>{labels[0]}<p>Vòm nét đứt = cửa sổ trong suốt (không in). Thứ tự đọc: dấu triện → kiểu sấy → tên quả → quy cách → khối lượng → mocqua.com.</p></div>
    <div><h2>Túi zip đứng · mockup</h2><div class="hero">{hero}</div>
      <ul><li>Túi đứng nhám xanh rừng, viền chỉ vàng, khoá zip mạ vàng, rãnh xé.</li><li>Nhãn ngà hình vòm với cửa sổ nhìn thấy quả thật.</li><li>Mỗi loại quả có một màu nhấn riêng (vòng cửa sổ, chữ kiểu sấy, dải chân nhãn), trong cùng hệ Mộc Quả.</li><li>Một thương hiệu duy nhất: Mộc Quả · mocqua.com.</li></ul></div></div>
    <div class="grid" style="padding-top:0"><h2 style="grid-column:1/-1">Toàn bộ dòng sản phẩm · {len(sp)} mã</h2>{grid}</div>
    </body></html>'''
    open('/tmp/mq_sheet.html','w',encoding='utf-8').write(page)
    sh=await b.new_page(viewport={'width':2400,'height':1000})
    await sh.goto('file:///tmp/mq_sheet.html');await sh.evaluate('document.fonts.ready');await sh.wait_for_timeout(800)
    await sh.screenshot(path=B+'/labels-mocqua.png',full_page=True)
    await b.close()
asyncio.run(main())
