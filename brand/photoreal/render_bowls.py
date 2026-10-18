"""'Quả trong bát' illustrations for product descriptions: our own fruit textures (credited in tex/credits.json) in a glazed ceramic bowl."""
import sys,os,json,zlib;D=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,D);sys.path.insert(0,D+'/../pouch')
import numpy as np,pack,compose_bg as C
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
from pouch_map import M
OUT=D+'/../../assets/desc'
def bowl(fill,W=1200,H=750,seed=1):
    bg=C.backdrop(W,H).convert('RGB');a=np.asarray(bg).astype(np.float32)
    y,x=np.mgrid[0:H,0:W].astype(np.float32);v=1-0.16*(((x-W/2)/W)**2+((y-H/2)/H)**2)*2;a*=v[...,None]
    cx,cy,rx,ry=W/2,H*0.40,W*0.33,H*0.17;bh=H*0.36
    # contact shadow
    sh=Image.new('L',(W,H),0);ImageDraw.Draw(sh).ellipse((cx-rx*0.85+40,cy+bh-ry*0.5,cx+rx*0.95+60,cy+bh+ry*0.9),fill=170);sh=np.asarray(sh.filter(ImageFilter.GaussianBlur(34)))/255
    a=a*(1-0.5*sh[...,None])
    # body: lower half-ellipse below rim
    t=(x-cx)/rx;body=(np.abs(t)<=1)&(y>=cy)&(y<=cy+bh*np.sqrt(np.clip(1-t**2,0,1))**0.8+ry*np.sqrt(np.clip(1-t**2,0,1)))
    lam=np.clip(0.55+0.5*np.cos((t+0.35)*1.4),0.35,1.08);col=np.array([232,226,212.])
    a[body]=(col*lam[...,None])[body]
    # glaze band & foot line
    band=np.exp(-((y-(cy+ry*np.sqrt(np.clip(1-t**2,0,1))+bh*0.18))/5)**2)*body;a=a*(1-band[...,None]*0.18)+np.array([150,120,70.])*band[...,None]*0.18
    spec=np.exp(-(((t+0.55)/0.06)**2))*body*np.clip((y-cy)/bh,0,1)**0.3*(1-np.clip((y-cy)/bh,0,1));a=a*(1-spec[...,None]*0.5)+255*spec[...,None]*0.5
    # rim
    d=((x-cx)/rx)**2+((y-cy)/ry)**2;rim=(d<=1);a[rim]=(np.array([240,236,226.])*(0.9+0.1*np.clip((cx-x)/rx,-1,1))[...,None])[rim]
    # fruit mound inside rim
    irx,iry=rx*0.93,ry*0.86;rs=np.random.RandomState(seed%9999);n=W
    bump=np.convolve(rs.randn(n+80),np.ones(80)/80,'same')[40:40+n]*ry*1.6;bump=bump-bump.min()
    ti=(x-cx)/irx;top=cy-iry*np.sqrt(np.clip(1-ti**2,0,1))-ry*0.55*np.sqrt(np.clip(1-ti**2,0,1))**1.5-bump[None,:]*np.sqrt(np.clip(1-ti**2,0,1))
    bot=cy+iry*np.sqrt(np.clip(1-ti**2,0,1));m=(np.abs(ti)<1)&(y>=top)&(y<=bot)
    fh=int(H*0.7);f=np.asarray(fill.resize((int(irx*2)+4,fh),Image.LANCZOS)).astype(np.float32)[...,:3]
    F=np.zeros_like(a);x0=int(cx-irx)-2;y0=int(cy-ry*2.6);F[max(0,y0):y0+fh,x0:x0+f.shape[1]]=f[max(0,-y0):H-y0,:W-x0]
    sh2=(0.72+0.38*np.clip(1-ti**2,0,1)**0.6)*(1+0.12*np.clip(-ti,-1,1))*(1-0.25*np.clip((y-cy)/iry,0,1))
    a[m]=(F*sh2[...,None])[m]
    lipy=cy+iry*np.sqrt(np.clip(1-ti**2,0,1));lip=np.exp(-((y-lipy)/4)**2)*(np.abs(ti)<1);a=a*(1-lip[...,None]*0.4)
    rl=np.exp(-((np.sqrt(d)-1)/0.012)**2)*(y>cy-ry*0.2);a=a*(1-rl[...,None]*0.45)+255*rl[...,None]*0.45
    return Image.fromarray(a.clip(0,255).astype('uint8'))
EXTRA={'mqz-coc-non-say-deo':('mo',(184,160,52)),'mqz-hong-treo-say-gio':('hongep',None),'mqz-hong-say-deo-hop-xach':('hongep',None)}
if __name__=='__main__':
    S=json.load(open(D+'/../../research/mocqua-own-label-spec.json'))['spec'];done=set()
    for s in S:
        p=s['pid']
        if p in done or s['cat']=='set':continue
        if p in EXTRA:tx,t=EXTRA[p]
        elif s['sku'] in M:tx,t=M[s['sku']][:2]
        else:print('skip',p);continue
        done.add(p);f=pack.tex(tx,900,900,tint=t)
        bowl(f,seed=zlib.crc32(p.encode())).save(f'{OUT}/bowl-{p}.jpg',quality=82,optimize=True,progressive=True)
    print(len(done))
