"""Render every Mộc Quả own-label product pouch (mocqua.com design system).
   python3 render_all.py  -> assets/products/mqz/<sku>.jpg (1200x1200) + <sku>-45.jpg (1200x1500)
   Requires: playwright + Chrome, Pillow, numpy (venv /home/box/.venvs/rembg)."""
import asyncio,json,os,sys,io,zlib
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import compose_bg as C
from PIL import Image
from playwright.async_api import async_playwright
ROOT='/workspace/mocqua';T='file://'+ROOT+'/brand/pouch/pouch.html'
OUTD=ROOT+'/assets/products/mqz';os.makedirs(OUTD,exist_ok=True)
RAW='/tmp/mqz_raw';os.makedirs(RAW,exist_ok=True)
D=json.load(open(ROOT+'/research/mocqua-own-label-spec.json'))
TYPE={'deo':'Sấy dẻo','thanghoa':'Sấy thăng hoa','gion':'Sấy giòn','kho':'Sấy khô','omai':'Ô mai · xí muội','set':'Set quà'}
def label_of(s):
    v=s['variant'];w=v.split('·')[-1].strip() if '·' in v else v
    sub=v.split('·')[0].strip() if '·' in v else s['sub']
    return w,sub
async def shot(pg,spec):
    await pg.evaluate("s=>{document.getElementById('stage').innerHTML=render(s)}",spec)
    b=await pg.locator('#stage svg').screenshot(omit_background=True)
    return Image.open(io.BytesIO(b)).convert('RGBA')
def fan(ims):
    # arrange 2-4 pouches as a fanned group (centre one in front)
    n=len(ims);W=int(ims[0].width*(1+0.42*(n-1)));H=int(ims[0].height*1.08)
    can=Image.new('RGBA',(W,H),(0,0,0,0))
    order=list(range(n));angles=[(-5+10*i/(n-1)) if n>1 else 0 for i in range(n)] if n>2 else [-4,4][:n]
    mid=(n-1)/2;seq=sorted(order,key=lambda i:-abs(i-mid))
    for i in seq:
        sc=1.0 if (abs(i-mid)<0.6 or n==2) else 0.9
        im=ims[i].resize((int(ims[i].width*sc),int(ims[i].height*sc)),Image.LANCZOS).rotate(-angles[i],expand=True,resample=Image.BICUBIC)
        x=int((W-ims[0].width)/2+(i-mid)*ims[0].width*(0.5 if n==2 else 0.42)+(ims[0].width-im.width)/2);y=int(H-im.height-(0 if abs(i-mid)<0.6 else ims[0].height*0.02))
        can.alpha_composite(im,(max(0,x),max(0,y)))
    return can.crop(can.getbbox())
async def main(only=None):
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':900,'height':1250})
        await pg.goto(T);await pg.evaluate('document.fonts.ready');await pg.wait_for_timeout(300)
        for s in D['spec']:
            if only and s['sku'] not in only: continue
            seed=zlib.crc32(s['sku'].encode())%9973+1
            w,sub=label_of(s)
            if s['set']:
                ims=[]
                for k,f in enumerate(s['set']):
                    nm=D['setnames'].get(f,f)
                    if s['sku']=='MQZ-SETTH-1000': nm=['Thơm sấy mộc','Thơm muối ớt'][k]
                    if s['sku']=='MQZ-SETDN-1200': nm=['Mứt dừa lá dứa','Mứt dừa cà phê','Mứt dừa sữa'][k]
                    sp=dict(brand='mocqua',name=nm,sub=s['name'],type='Set quà · '+str(len(s['set']))+' vị',weight=w,fruit=f,seed=seed+k*31)
                    if s['sku']=='MQZ-SETDN-1200': sp['accent']=['#5FA35A','#7A4E2E','#E9DCC0'][k]
                    if 'muối ớt' in nm.lower() or (s['flavour']=='muoiot' and k>0): sp['chili']=1
                    ims.append(await shot(pg,sp))
                cut=fan(ims)
            else:
                sp=dict(brand='mocqua',name=s['name'],sub=sub,type=TYPE[s['cat']],weight=w,fruit=s['fruit'],seed=seed,chili=1 if s['flavour']=='muoiot' else 0)
                cut=await shot(pg,sp)
            cut=cut.crop(cut.getbbox());cut.save(f"{RAW}/{s['sku']}.png")
            name='mqz/'+s['sku'].lower()
            C.compose(cut,1200,1200,name);C.compose(cut,1200,1500,name+'-45')
            print('ok',s['sku'],flush=True)
        await b.close()
asyncio.run(main(sys.argv[1:] or None))
