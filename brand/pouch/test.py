import asyncio,json,sys
from playwright.async_api import async_playwright
T='file:///workspace/mocqua/brand/pouch/pouch.html'
specs=[dict(brand='mocqua',name='Sầu riêng Ri6 sấy thăng hoa',sub='Nguyên múi chọn lọc',type='Sấy thăng hoa',weight='100g',fruit='saurieng',seed=3),
       dict(brand='mocqua',name='Mít Thái sấy giòn',sub='Nguyên vị',type='Sấy giòn',weight='500g',fruit='mit',seed=4),
       dict(brand='mocqua',name='Thanh long sấy dẻo',sub='Ít ngọt',type='Sấy dẻo',weight='500g',fruit='thanhlong',seed=9),
       dict(brand='mocqua',name='Xí muội đào hồng',sub='Chua ngọt thanh',type='Ô mai · xí muội',weight='500g',fruit='dao',seed=2)]
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=await b.new_page(viewport={'width':900,'height':1250})
    await pg.goto(T);await pg.evaluate('document.fonts.ready')
    for i,s in enumerate(specs):
      svg=await pg.evaluate('s=>render(s)',s)
      await pg.set_content(f'<html><body style="margin:0;background:#EFE6D4">{svg}</body></html>')
      await pg.goto(T) if False else None
      await pg.wait_for_timeout(300)
      await pg.screenshot(path=f'/tmp/pt{i}.png')
    await b.close()
asyncio.run(m())
