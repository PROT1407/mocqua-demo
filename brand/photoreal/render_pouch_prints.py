"""Step 1 (system python + playwright): render pouch print layers to labels/pouch/<sku>.png"""
import asyncio,json,os,sys
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,D)
from pouch_map import M
S=json.load(open(D+'/../../research/mocqua-own-label-spec.json'))['spec']
TYPE={'deo':'Sấy dẻo · túi zip','thanghoa':'Sấy thăng hoa','gion':'Sấy giòn','kho':'Sấy khô','omai':'Ô mai · xí muội'}
INK={'dark':dict(ink='#F6EEDC',gold='#E2C27E',pill='#E2C27E',pillText='#1E3A2F'),'light':dict(ink='#1E3A2F',gold='#9C7432',pill='#1E3A2F',pillText='#F1E3BF')}
OUT=D+'/labels/pouch';os.makedirs(OUT,exist_ok=True)
async def m(only):
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=await b.new_page(viewport={'width':900,'height':1200})
    await pg.goto('file://'+D+'/pouch-print.html');await pg.evaluate('document.fonts.ready')
    for s in S:
      if s['sku'] not in M or (only and s['sku'] not in only):continue
      fam=M[s['sku']][2];tone='light' if fam=='cream' else 'dark'
      v=s['variant'];w=v.split('·')[-1].strip();sub=v.split('·')[0].strip() if '·' in v else (s['sub'] or '')
      o=dict(name=s['name'].replace(' sấy dẻo','').replace(' sấy thăng hoa','').replace(' sấy giòn','').replace(' sấy khô','') if s['cat']!='omai' else s['name'],
             type=TYPE[s['cat']],sub=sub,weight=w,**INK[tone])
      await pg.evaluate("o=>document.getElementById('s').innerHTML=render(o)",o);await pg.wait_for_timeout(40)
      await pg.locator('svg').screenshot(path=f"{OUT}/{s['sku']}.png",omit_background=True)
    await b.close()
asyncio.run(m(sys.argv[1:]))
