import sys,numpy as np
sys.path.insert(0,'/workspace/mocqua/brand/pouch')
from compose_bg import compose,clean,OUT
from PIL import Image,ImageFilter,ImageEnhance
from scipy import ndimage
FR,BK=739,750   # mép phải túi trước / mép cắt trái túi sau (bị túi trước che)
def save(a,m,name):
    ys,xs=np.where(m>128);box=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
    sel=m>200;L=a.mean(2);t=np.percentile(L[sel],95);w=a[sel&(L>=t)].mean(0);g=np.clip(np.array([250,249,246.])/w,0.95,1.08);a=np.clip(a*g,0,255)
    rgba=Image.fromarray(np.dstack([a,m]).astype(np.uint8),'RGBA').crop(box)
    rgb=rgba.convert('RGB');rgb=ImageEnhance.Contrast(rgb).enhance(1.05).filter(ImageFilter.UnsharpMask(radius=1.3,percent=45,threshold=2))
    c=clean(Image.merge('RGBA',(*rgb.split(),rgba.split()[-1])));c.save(f'cut_{name}.png')
    compose(c,1200,1200,name);compose(c,1200,1500,name+'-45')
    t=c.copy();t.thumbnail((640,640),Image.LANCZOS);t.save(f'{OUT}/cut/{name}.webp',quality=88,method=6);print(name,c.size,g.round(3))
for n,code in [('red','do'),('green','xanh')]:
    a=np.asarray(Image.open(f'src/{n}.jpg').convert('RGB')).astype(np.float32);m=np.asarray(Image.open(f'/tmp/chm_{n}.png').convert('L')).astype(np.float32)
    f=m.copy();f[:,FR:]=0;f[:170]=0
    for k in range(3):f[:,FR-1-k]*=[0.5,0.8,0.95][k]
    b=m.copy();b[:,:BK]=0
    bb=a.copy()
    for k in range(10):bb[:,BK+k]*=0.93+0.007*k
    b[:,BK:BK+3]*=np.array([0.4,0.75,0.92])[None,:]
    save(a,f,f'chx-{code}');save(bb,b,f'chx-{code}-back')
