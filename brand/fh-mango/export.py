import sys,numpy as np
sys.path.insert(0,'/workspace/mocqua/brand/pouch')
from compose_bg import compose,clean,OUT
from PIL import Image,ImageFilter,ImageEnhance
from scipy import ndimage
def load(n):
    im=Image.open(f'src/{n}.jpg').convert('RGB');m=np.asarray(Image.open(f'/tmp/fhm_{n}.png').convert('L')).astype(np.float32)
    return np.asarray(im).astype(np.float32),m
def fix_hole(a,m,box):
    x0,y0,x1,y1=box;h=y1-y0;r,g,b=a[...,0],a[...,1],a[...,2]
    blu=(b-r>10)&(m>128);blu[:y0]=0;blu[int(y0+h*0.12):]=0;blu[:,:x0+int((x1-x0)*0.3)]=0;blu[:,x0+int((x1-x0)*0.7):]=0
    lab,n=ndimage.label(blu)
    if n:
        sz=ndimage.sum(blu,lab,range(1,n+1));k=np.argmax(sz)+1
        if sz[k-1]>200:
            hole=ndimage.binary_dilation(lab==k,iterations=3);m=np.where(hole,0,m);print(' hole px',int(sz[k-1]))
    return m
def wb(a,m):
    # neutralise using the brightest pouch pixels (white film/seal)
    sel=(m>200);L=a.mean(2);t=np.percentile(L[sel],96);w=a[sel&(L>=t)].mean(0)
    g=np.array([250,248,243.])/w;g=np.clip(g,0.9,1.12);print(' wb',w.round(1),g.round(3))
    return np.clip(a*g,0,255)
def despill(a,m):
    inner=ndimage.binary_erosion(m>128,iterations=8);band=(m>10)&~inner
    r,g,b=a[...,0],a[...,1],a[...,2];bad=band&(b-r>6)
    gray=a.mean(2,keepdims=True)*np.array([1.01,1.0,0.97]);a=np.where(bad[...,None],gray,a)
    # mảnh nền biển dính sát mép (xanh đậm) -> bỏ
    dark=band&(b-r>25)&(a.mean(2)<170);m=np.where(dark,0,m);return a,m
def finish(a,m,box,name):
    a,m=despill(a,m);a=wb(a,m);rgba=Image.fromarray(np.dstack([a,m]).astype(np.uint8),'RGBA').crop(box)
    rgb=rgba.convert('RGB');rgb=ImageEnhance.Contrast(rgb).enhance(1.04);rgb=ImageEnhance.Color(rgb).enhance(1.04)
    rgb=rgb.filter(ImageFilter.UnsharpMask(radius=1.4,percent=50,threshold=2))
    rgba=Image.merge('RGBA',(*rgb.split(),rgba.split()[-1]));c=clean(rgba);c.save(f'cut_{name}.png')
    compose(c,1200,1200,name);compose(c,1200,1500,name+'-45')
    t=c.copy();t.thumbnail((640,640),Image.LANCZOS);t.save(f'{OUT}/cut/{name}.webp',quality=88,method=6);print(name,c.size)
def comps(m):
    lab,n=ndimage.label(m>128);sz=ndimage.sum(m>128,lab,range(1,n+1));out=[]
    for k in np.argsort(sz)[::-1]:
        if sz[k]<0.05*sz.max():break
        ys,xs=np.where(lab==k+1);out.append((lab==k+1,(xs.min(),ys.min(),xs.max()+1,ys.max()+1)))
    return sorted(out,key=lambda o:o[1][0])
for n,names in [('xanh',['fhx-xanh']),('do',['fhx-do']),('vang',['fhx-vang'])]:
    a,m=load(n);cs=comps(m);print(n,len(cs),[c[1] for c in cs])
    for (cm,box),name in zip(cs,names):
        mm=np.where(ndimage.binary_dilation(cm,iterations=4),m,0);mm=fix_hole(a,mm,box);finish(a,mm,box,name)

# ảnh 2 túi: đã tách & vá bằng split2.py
for f,name in [('/tmp/fh_small.png','fhx-dayxanh-s'),('/tmp/fh_large.png','fhx-dayxanh-l')]:
    r=np.asarray(Image.open(f)).astype(np.float32);a,m=r[...,:3],r[...,3]
    ys,xs=np.where(m>128);box=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
    m=fix_hole(a,m,box);finish(a,m,box,name)
