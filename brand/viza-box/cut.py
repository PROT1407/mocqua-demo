"""Cut the 5 Viza Food paper boxes out of the owner's flat line-up photo (src/lineup_flat.jpg),
rectify perspective per box, neutralise white balance, sharpen, export clean RGBA fronts."""
import numpy as np,json,os
from PIL import Image,ImageFilter,ImageEnhance
D=os.path.dirname(os.path.abspath(__file__))
im=Image.open(D+'/src/lineup_flat.jpg').convert('RGB');A=np.asarray(im).astype(np.float32)
m=np.asarray(Image.open('/tmp/mask_birefnet-general.png').convert('L'))>128
H,W=m.shape
top=lambda x:int(np.argmax(m[:,x]));bot=lambda x:int(H-1-np.argmax(m[::-1,x]))
def lr(y):r=np.where(m[y])[0];return int(r.min()),int(r.max())
# gap lines between boxes (x at top, x at bottom), measured from dark seams
G=[(580,579),(1085,1081),(1569,1561),(2036,2041)]
L0=(lr(40)[0],lr(850)[0]);R0=(lr(40)[1],lr(850)[1])
edges=[L0]+G+[R0]
NAMES=['hat-sen','hat-de-cuoi','hat-macca','dua-say-gion','hat-dieu']
def solve(src,dst):
    M=[]
    for (x,y),(u,v) in zip(dst,src):M+=[[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]
    b=np.array([c for p in src for c in p],float);return np.linalg.solve(np.array(M,float),b)
out={}
for i,n in enumerate(NAMES):
    (lt,lb),(rt,rb)=edges[i],edges[i+1]
    ins=(12 if i==4 else 4) if i else 1;ins2=4 if i<4 else 1
    lt+=ins;lb+=ins;rt-=ins2;rb-=ins2
    tl=(lt,top(lt+12)+2);tr=(rt,top(rt-12)+2);br=(rb,bot(rb-12)-1);bl=(lb,bot(lb+12)-1)
    w=int(((tr[0]-tl[0])+(br[0]-bl[0]))/2);h=int(((bl[1]-tl[1])+(br[1]-tr[1]))/2)
    S=3;WW,HH=w*S//2,h*S//2   # upsample 1.5x for crisp output
    co=solve([tl,tr,br,bl],[(0,0),(WW,0),(WW,HH),(0,HH)])
    f=im.transform((WW,HH),Image.PERSPECTIVE,tuple(co),Image.BICUBIC)
    out[n]=dict(corners=[tl,tr,br,bl],size=(WW,HH));f.save(f'/tmp/vz_raw_{n}.png')
json.dump(out,open(D+'/corners.json','w'),indent=1);print(json.dumps(out))
# ---------- finishing: white balance, tone, sharpen, uniform size, clean edges ----------
from PIL import ImageDraw
TW,TH=744,1300
fr={n:Image.open(f'/tmp/vz_raw_{n}.png').convert('RGB') for n in NAMES}
allpx=np.concatenate([np.asarray(f.resize((120,210))).reshape(-1,3) for f in fr.values()]).astype(float)
lum=allpx.mean(1);hi=allpx[lum>np.percentile(lum,97)].mean(0)
gain=np.array([250,247,240.])/hi;gain=gain/gain.max()*min(1.12,250/hi.max())
print('wb gain',gain.round(3),'from',hi.round(1))
def finish(f):
    a=np.asarray(f).astype(float)*gain[None,None,:]
    a=np.clip(a,0,255);img=Image.fromarray(a.astype('uint8'))
    img=ImageEnhance.Contrast(img).enhance(1.06);img=ImageEnhance.Color(img).enhance(1.05)
    img=img.resize((TW,TH),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6,percent=70,threshold=2))
    rgba=img.convert('RGBA');m=Image.new('L',(TW*4,TH*4),0);ImageDraw.Draw(m).rounded_rectangle((0,0,TW*4-1,TH*4-1),radius=14,fill=255)
    rgba.putalpha(m.resize((TW,TH),Image.LANCZOS))
    # soft fold shading along the vertical edges (paperboard thickness)
    e=np.asarray(rgba).astype(float);x=np.arange(TW)
    s=1-0.10*np.exp(-x/10)-0.07*np.exp(-(TW-1-x)/10);e[...,:3]*=s[None,:,None]
    t=np.arange(TH);s2=1+0.06*np.exp(-t/14);e[...,:3]=np.clip(e[...,:3]*s2[:,None,None],0,255)
    return Image.fromarray(e.astype('uint8'),'RGBA')
TRIM={'hat-sen':(4,24,3,6),'hat-de-cuoi':(3,26,3,6),'hat-macca':(3,30,4,6),'dua-say-gion':(3,42,6,6),'hat-dieu':(12,26,3,18)}  # l,t,r,b
def repair(f):
    a=np.asarray(f).astype(float);h,w=a.shape[:2];L=a.mean(2);R=44
    for cy,cx,dy,dx in [(0,0,1,1),(0,w-1,1,-1),(h-1,0,-1,1),(h-1,w-1,-1,-1)]:
        ys=np.arange(R)*dy+cy;xs=np.arange(R)*dx+cx
        ref=np.median(L[np.ix_(cy+dy*np.arange(R,2*R),cx+dx*np.arange(R,2*R))])
        for y in ys:
            for x in xs:
                if L[y,x]<ref*0.72:a[y,x]=a[y,x+dx*R]
    return Image.fromarray(a.astype('uint8'))
for n,f in fr.items():
    l,t,r,b=TRIM[n];f=f.crop((l,t,f.width-r,f.height-b));finish(repair(f)).save(f'{D}/front_{n}.png')
