import sys,numpy as np
sys.path.insert(0,'/workspace/mocqua/brand/pouch')
from compose_bg import compose,clean,OUT
from PIL import Image,ImageFilter,ImageEnhance,ImageDraw
def load(n):
    a=np.asarray(Image.open(f'src/{n}.jpg').convert('RGB')).astype(np.float32);m=np.asarray(Image.open(f'/tmp/vzm_{n}.png').convert('L')).astype(np.float32);return a,m
def save(a,m,name,wb=True):
    ys,xs=np.where(m>128);box=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
    if wb:
        sel=m>200;L=a.mean(2);t=np.percentile(L[sel],95);w=a[sel&(L>=t)].mean(0);g=np.clip(np.array([250,249,246.])/w,0.95,1.10);a=np.clip(a*g,0,255)
    rgba=Image.fromarray(np.dstack([a,m]).astype(np.uint8),'RGBA').crop(box)
    rgb=rgba.convert('RGB');rgb=ImageEnhance.Contrast(rgb).enhance(1.05).filter(ImageFilter.UnsharpMask(radius=1.3,percent=45,threshold=2))
    c=clean(Image.merge('RGBA',(*rgb.split(),rgba.split()[-1])));c.save(f'cut_{name}.png')
    compose(c,1200,1200,name);compose(c,1200,1500,name+'-45')
    t=c.copy();t.thumbnail((640,640),Image.LANCZOS);t.save(f'{OUT}/cut/{name}.webp',quality=88,method=6);print(name,c.size)
def polycut(m,poly):
    P=Image.new('L',(m.shape[1],m.shape[0]),0);ImageDraw.Draw(P).polygon(poly,fill=255);P=P.filter(ImageFilter.GaussianBlur(1.5))
    return m*np.asarray(P,np.float32)/255
def reflcut(m):
    w=(m>128).sum(1);ys=np.where(w>0)[0];med=np.median(w[ys]);H=len(w)
    for y in range(ys[0]+(ys[-1]-ys[0])//2,ys[-1]):
        if w[y]<0.8*med:m=m.copy();m[y:]=0;break
    return m
todo=sys.argv[1:] or ['dudu','cocmo','me','mit','chaodai','vzbox']
for n in todo:
    a,m=load(n)
    if n=='cocmo':m=m.copy();m[1338:]=0
    if n in('dudu','cocmo','me'):save(a,reflcut(m),{'dudu':'ggx-dudu','cocmo':'ggx-cocmo','me':'ggx-me'}[n])
    if n=='mit':
        m=polycut(m,[(0,0),(690,0),(683,660),(675,800),(660,1000),(650,1150),(645,1300),(648,1450),(650,1560),(655,1992),(0,1992)]);save(a,m,'fhx-mit300')
    if n=='chaodai':
        m=polycut(m,[(0,0),(1050,0),(1062,465),(1145,547),(1208,637),(1253,735),(1283,840),(1298,945),(1300,1050),(1280,1140),(1242,1215),(1205,1275),(1160,1335),(1107,1410),(1040,1500),(950,1590),(845,1680),(700,2003),(0,2003)]);save(a,m,'chx-aodai')
    if n=='vzbox':
        mb=m>128;H,W=mb.shape;y0=60;Wo=1080;rows=[]
        for y in range(y0,H):
            xs=np.where(mb[y])[0];l,r=xs[0]+4,xs[-1]-4
            src=np.linspace(l,r,Wo);x0=np.floor(src).astype(int);f=(src-x0)[:,None]
            rows.append(a[y,x0]*(1-f)+a[y,np.minimum(x0+1,W-1)]*f)
        A=np.array(rows);M=np.full(A.shape[:2],255.,np.float32);M[:,:2]=[90,200];M[:,-2:]=[200,90];M[:2]=np.minimum(M[:2],[[150],[230]])
        save(A,M,'vzx-xoai150')
