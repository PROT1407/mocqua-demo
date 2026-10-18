"""Step A (system python + playwright): original lid/bag artwork -> gift/art/*.png"""
import asyncio,os
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__));OUT=D+'/gift/art';os.makedirs(OUT,exist_ok=True)
A={
 'lid_sen':dict(w=1200,h=800,theme='sen',motif='lotus',title='Mộc Quả',sub='QUÀ TẾT 2027 · SEN VÀNG',sealY=.36),
 'bag_sen':dict(w=800,h=900,theme='sen',motif='lotus',title='Mộc Quả',sub='QUÀ VIỆT TUYỂN CHỌN',sealY=.33,sealR=.2),
 'lid_mai':dict(w=1200,h=1200,theme='mai',motif='mai',title='Mộc Quả',sub='PHÚ QUÝ · QUÀ TẾT 2027',sealY=.45,sealR=.15),
 'bag_mai':dict(w=800,h=900,theme='mai',motif='mai',title='Mộc Quả',sub='QUÀ TẾT 2027',sealY=.4,sealR=.2),
 'lid_dao':dict(w=1200,h=1200,theme='dao',motif='dao',title='Xuân Yêu Thương',sub='MỘC QUẢ · TẾT 2027',sealY=.42,sealR=.15),
 'bag_dao':dict(w=800,h=900,theme='dao',motif='dao',title='Mộc Quả',sub='XUÂN YÊU THƯƠNG',sealY=.4,sealR=.2),
 'lid_ivory':dict(w=1200,h=1200,theme='ivory',motif='mai',title='Mộc Quả',sub='QUÀ VIỆT TUYỂN CHỌN',sealY=.42,sealR=.15),
 'bag_ivory':dict(w=800,h=900,theme='ivory',motif='mai',title='Mộc Quả',sub='QUÀ TẾT 2027',sealY=.4,sealR=.2),
 'band_red':dict(w=1400,h=180,theme='mai',motif='none',seal=False),
}
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=await b.new_page(viewport={'width':1400,'height':1400})
    await pg.goto('file://'+D+'/gift-art.html');await pg.evaluate('document.fonts.ready')
    for k,o in A.items():
      await pg.evaluate('o=>render(o)',o);await pg.wait_for_timeout(60);await pg.locator('svg').screenshot(path=f'{OUT}/{k}.png',omit_background=True)
    await b.close()
asyncio.run(m())
