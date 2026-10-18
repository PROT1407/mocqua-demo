import asyncio,json
from playwright.async_api import async_playwright
S=json.load(open('/workspace/mocqua/research/mocqua-own-label-spec.json'))['spec']
AC={'xoai':'#E0A21B','dautay':'#B8323A','thanhlong':'#B0306A','chanhday':'#C98A12','gung':'#C9A13B','duanon':'#8DAA6B','thom':'#D99A1E','dudu':'#D9682A','cam':'#E07B1A','hong':'#C8561E','khoailang':'#C7782A','oi':'#7FA650','mit':'#D6A520','nhan':'#A9793E','hatsen':'#9DA77E','mangcau':'#6E9A55','mixdeo':'#9E2A2B','thapcam':'#9E2A2B','coc':'#7E8F2E','voboi':'#C99A1F','cachua':'#B8323A','tao':'#B5651D'}
J=[]
SN={'SETMO':'Đôi mứt muối ớt','SETTH':'Đôi thơm sấy','SET9':'Hộp quà 9 vị','SET12':'Bộ 12 vị mứt','SETDN':'Mứt dừa non 4 vị','SETH4':'Hộp quả & hạt','SETH3':'Hộp quả & hạt','SETGIO':'Giỏ quà quả Việt','SETG6':'Giỏ mứt 6 vị','SETK7':'Khay mứt 7 vị','SETK5':'Khay mứt 5 vị'}
for p in S:
  if p['cat']=='deo':
    w=p['variant'].split('·')[-1].strip()
    sub=p['sub'] if p.get('box') in('hongwin','hongcarton') else 'Hồng chẻ' if p['sku']=='MQZ-DHO-1000' else ('Nguyên trái ép' if p['sku']=='MQZ-DHOE-500' else p['sub'])
    J.append((p['sku'],dict(name=p['name'].replace(' sấy dẻo',''),type='Sấy dẻo tự nhiên',sub=sub,weight=w,accent=AC.get(p['fruit'],'#9E2A2B'))))
  if p['cat']=='set':
    w=p['variant'].split('·')[0].strip()
    J.append((p['sku'],dict(name=SN.get(p['sku'].split('-')[1],p['name']),type='Set quà Mộc Quả',sub=p['sub'],weight=w,accent='#9E2A2B')))
J.append(('SEAL',dict(name='Mộc Quả',type='Quả ngon tuyển chọn',sub='mocqua.com',weight='Quà Việt',accent='#9E2A2B')))
# combo jars
J+= [('TH-MOC',dict(name='Thơm sấy mộc',type='Sấy dẻo · Hũ PET',sub='Vị nguyên bản',weight='500g',accent='#D99A1E')),
     ('TH-MO',dict(name='Thơm sấy muối ớt',type='Sấy dẻo · Hũ PET',sub='Chua cay mặn ngọt',weight='500g',accent='#B8323A')),
     ('MC-MO',dict(name='Mãng cầu muối ớt',type='Sấy dẻo · Hũ PET',sub='Chua cay mặn ngọt',weight='500g',accent='#B8323A'))]
async def m():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=await b.new_page(viewport={'width':600,'height':600})
    await pg.goto('file:///workspace/mocqua/brand/photoreal/round-label.html');await pg.evaluate('document.fonts.ready')
    for k,o in J:
      await pg.evaluate("o=>document.getElementById('s').innerHTML=render(o)",o);await pg.wait_for_timeout(60)
      await pg.locator('svg').screenshot(path=f'/workspace/mocqua/brand/photoreal/labels/{k}.png',omit_background=True)
    await b.close()
asyncio.run(m());print(len(J))
