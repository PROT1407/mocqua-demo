import sys,os,numpy as np
from PIL import Image,ImageFilter,ImageDraw,ImageEnhance
from scipy import ndimage
OUT='/workspace/mocqua/assets/products'
os.makedirs(OUT,exist_ok=True)
def clean(rgba):
    a=np.array(rgba.split()[-1]).astype(np.float32)
    m=a>40
    lab,n=ndimage.label(m)
    if n>1:
        sizes=ndimage.sum(m,lab,range(1,n+1));keep=np.argmax(sizes)+1
        big=lab==keep
        big=ndimage.binary_fill_holes(big)
        a=np.where(big,a,0)
        a=np.where(ndimage.binary_fill_holes(a>40)&(a<=40),255,a)
    # slight erode to kill halo, then feather
    am=Image.fromarray(a.clip(0,255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    rgba=rgba.copy();rgba.putalpha(am);return rgba.crop(rgba.getbbox())
def backdrop(W,H):
    y,x=np.mgrid[0:H,0:W];cx,cy=W/2,H*0.42
    d=np.sqrt(((x-cx)/W)**2+((y-cy)/H)**2)
    c1=np.array([250,246,238]);c2=np.array([236,226,206])
    t=np.clip(d/0.75,0,1)[...,None]
    return Image.fromarray((c1*(1-t)+c2*t).astype(np.uint8))
def compose(cut,W,H,name):
    bg=backdrop(W,H).convert('RGBA')
    maxw,maxh=W*(0.80 if cut.width/cut.height>0.85 else 0.70),H*0.78
    s=min(maxw/cut.width,maxh/cut.height);cw,ch=int(cut.width*s),int(cut.height*s)
    c=cut.resize((cw,ch),Image.LANCZOS)
    c=c.filter(ImageFilter.UnsharpMask(radius=1.2,percent=55 if s>1.2 else 35,threshold=2))
    x=(W-cw)//2;y=int((H-ch)/2-H*0.02)
    # contact shadow ellipse
    sh=Image.new('L',(W,H),0);d=ImageDraw.Draw(sh)
    d.ellipse((x+cw*0.08,y+ch-ch*0.03,x+cw*0.92,y+ch+ch*0.05),fill=120)
    sh=sh.filter(ImageFilter.GaussianBlur(W*0.018))
    # soft drop shadow from alpha
    a=c.split()[-1];ds=Image.new('L',(W,H),0);ds.paste(a,(x+int(W*0.012),y+int(H*0.018)));ds=ds.point(lambda v:v*0.28).filter(ImageFilter.GaussianBlur(W*0.02))
    shadow=Image.fromarray(np.maximum(np.array(sh),np.array(ds)))
    dark=Image.new('RGBA',(W,H),(70,52,30,255))
    bg=Image.composite(dark,bg,shadow)
    bg.alpha_composite(c,(x,y))
    bg.convert('RGB').save(f'{OUT}/{name}.jpg',quality=86,optimize=True,progressive=True)
