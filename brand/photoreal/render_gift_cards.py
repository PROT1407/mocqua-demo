"""contents-list card per gift box -> assets/products/mqz/<sku>-g4.jpg"""
import asyncio,json,os
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__));B=json.load(open(D+'/../../research/mocqua-giftboxes.json'))['boxes']
PK={'window9':'hộp cửa sổ 9 ô','jars6':'hộp 6 hũ mini','drawer':'hộp ngăn kéo','flip':'hộp nắp gập nam châm','heart':'hộp trái tim 8 ngăn','basket':'giỏ mây bọc màng kính','tubs':'2 hũ PET quai xách'}
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files']);pg=await b.new_page(viewport={'width':1200,'height':1200})
    await pg.goto('file://'+D+'/gift-card.html');await pg.evaluate('document.fonts.ready')
    for sku,x in B.items():
      o=dict(name=x['name'],variant=x['variant'],pack=PK.get(x['type'],'khay nắp trong'),occ=x['occ'],seal='file://'+D+'/labels/SEAL.png',
             items=[dict(n=c[0].split(':')[0] if x['type']=='tubs' else c[0],g=c[1],img='file://'+D+f'/gift/thumb/{c[2]}.jpg') for c in x['contents']])
      if x['type']=='tubs':
        for it,c in zip(o['items'],x['contents']):it['n']=c[0].replace(': ',' — ')
      await pg.evaluate('o=>render(o)',o);await pg.wait_for_timeout(250)
      await pg.screenshot(path=D+f'/../../assets/products/mqz/{sku.lower()}-g4.jpg',type='jpeg',quality=86,clip=dict(x=0,y=0,width=1200,height=1200))
    await b.close()
asyncio.run(m())
# 4:5 versions are padded by pad_cards() in render_gift.py (PIL lives in the venv)
