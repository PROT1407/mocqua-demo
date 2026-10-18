"""Mộc Quả photoreal-composite packaging renderer.
Real dried-fruit photo textures (Wikimedia Commons, see tex/credits.json) composited into
procedurally-shaded PET jars, rigid gift boxes, lacquer trays and wicker baskets, with the
Mộc Quả round seal label (round-label.html) wrapped onto the curved surface."""
import numpy as np,os,math,random
from PIL import Image,ImageDraw,ImageFilter,ImageOps,ImageEnhance,ImageChops
D=os.path.dirname(os.path.abspath(__file__))
GR=np.array([30,58,47.]);GOLD=np.array([196,162,101.])
def tex(k,w,h,tint=None,sat=None):
    im=Image.open(f'{D}/tex/{k}.jpg').convert('RGB')
    if tint is not None:
        g=ImageOps.grayscale(im);im=ImageOps.colorize(ImageOps.autocontrast(g,cutoff=2),black=tuple(int(c*0.35) for c in tint),white=(255,252,244),mid=tint)
    if sat:im=ImageEnhance.Color(im).enhance(sat)
    return ImageOps.fit(im,(w,h),Image.LANCZOS)
def chili(im,n=260,seed=1):
    r=random.Random(seed);d=ImageDraw.Draw(im)
    for _ in range(n):
        x,y=r.uniform(0,im.width),r.uniform(0,im.height);s=r.uniform(2,6)
        d.ellipse((x-s,y-s*0.6,x+s,y+s*0.6),fill=(r.randint(170,215),r.randint(20,45),r.randint(15,30)))
    return im
def A(img):return np.asarray(img).astype(np.float32)
def prof(n):
    t=np.linspace(-1,1,n);return t,np.sqrt(np.clip(1-t*t,0,1))
def streak(W,H,cx,w,a,y0=0,y1=None):
    """vertical soft highlight (alpha 0..1 array)"""
    x=np.arange(W);m=np.exp(-((x-cx)/w)**2)*a;M=np.tile(m,(H,1))
    if y1 is None:y1=H
    fade=np.ones(H);fade[:y0]=0;fade[y1:]=0
    k=max(1,int((y1-y0)*0.08))
    fade[y0:y0+k]=np.linspace(0,1,k);fade[y1-k:y1]=np.linspace(1,0,k)
    return M*fade[:,None]
def over(base,rgb,alpha):
    """base: HxWx4 float; paint rgb (3,) or HxWx3 with alpha HxW"""
    a=alpha[...,None];base[...,:3]=base[...,:3]*(1-a)+np.asarray(rgb)*a;base[...,3]=np.maximum(base[...,3],alpha*255);return base
def cyl_warp(img,W,arc_w=None):
    """wrap a flat image around a cylinder of projected width W (keeps height)"""
    a=A(img);h,w=a.shape[:2];R=W/2
    arc=arc_w or w
    P=int(round(2*R*math.sin(min(arc/(2*R),math.pi/2))))
    x=np.arange(P)-P/2+0.5;s=R*np.arcsin(np.clip(x/R,-1,1))
    src=np.clip(((s+arc/2)/arc*w).astype(int),0,w-1)
    return Image.fromarray(a[:,src].clip(0,255).astype(np.uint8),img.mode),P
def lid_layer(W,H,top_h,color,ring):
    """screw lid: cylinder side + top ellipse + knurl + ring"""
    L=np.zeros((H,W,4),np.float32);t,p=prof(W)
    side=np.clip(0.42+0.75*p**1.5,0,1.25)
    spec=np.exp(-((t+0.45)/0.10)**2)*0.55+np.exp(-((t-0.62)/0.05)**2)*0.18
    col=np.asarray(color)[None,:]*side[:,None]+255*spec[:,None]
    yy=np.arange(H)
    for y in range(top_h//2,H):
        L[y,:,:3]=col;L[y,:,3]=255
    kn=(np.sin(np.arange(W)/W*math.pi*90)>0.6)*0.10*p
    L[top_h//2:H-26,:,:3]*=(1-kn)[None,:,None]
    # ring band
    rc=np.asarray(ring)[None,:]*np.clip(0.5+0.7*p,0,1.3)[:,None]+255*(np.exp(-((t+0.45)/0.08)**2)*0.6)[:,None]
    L[H-26:H-8,:,:3]=rc;L[H-8:H,:,:3]=np.asarray(color)*0.45
    # top ellipse
    m=Image.new('L',(W,top_h),0);ImageDraw.Draw(m).ellipse((0,0,W-1,top_h-1),fill=255);m=np.asarray(m)/255
    yt,xt=np.mgrid[0:top_h,0:W];g=0.85+0.35*(1-((xt-W*0.38)/W)**2*3-((yt-top_h*0.3)/top_h)**2*1.2)
    topc=np.asarray(color)[None,None,:]*np.clip(g,0.6,1.4)[...,None]
    L[:top_h,:,:3]=np.where(m[...,None]>0,topc,L[:top_h,:,:3]);L[:top_h,:,3]=np.maximum(L[:top_h,:,3],m*255)
    # rim highlight on ellipse edge
    e=Image.new('L',(W,top_h),0);ImageDraw.Draw(e).ellipse((2,2,W-3,top_h-3),outline=255,width=3);e=np.asarray(e.filter(ImageFilter.GaussianBlur(1.2)))/255*0.45
    L[:top_h,:,:3]=L[:top_h,:,:3]*(1-e[...,None])+255*e[...,None]
    # bottom curvature (lid sits on jar)
    return L.clip(0,255)
def jar(fill,label=None,W=620,BH=700,lid=None,ring=None,handle=False,fill_gap=46,seed=3):
    lid=lid if lid is not None else GR;ring=ring if ring is not None else GOLD
    LH=128;TOP=200 if handle else 24;CW=W+40;CH=TOP+LH+BH+10;x0=20;yb=TOP+LH+BH-8;yt=TOP+LH-14
    C=np.zeros((CH,CW,4),np.float32)
    # body mask
    bm=Image.new('L',(CW,CH),0);ImageDraw.Draw(bm).rounded_rectangle((x0,yt,x0+W,yb),radius=64,fill=255)
    bm=np.asarray(bm)/255.
    # fill (fruit) with cylindrical warp and shading
    fh=yb-yt-fill_gap;fimg=fill.resize((int(W*1.3),fh),Image.LANCZOS)
    fw,_=cyl_warp(fimg,W-14,arc_w=int(W*1.3));fa=A(fw)
    t,p=prof(fa.shape[1]);sh=(0.58+0.42*p**0.8)[None,:,None]
    yy=np.linspace(0,1,fh)[:,None,None];sh=sh*(0.92+0.1*yy)
    fa=fa*sh
    # irregular top edge of the fruit pile
    r=np.random.RandomState(seed);n=fa.shape[1];xx=np.arange(n);edge=np.zeros(n)
    for _ in range(int(n/38)):
        c=r.uniform(0,n);w=r.uniform(18,46);edge-=np.exp(-((xx-c)/w)**2)*r.uniform(10,26)
    edge+=8*np.sin(xx/n*math.pi*2*r.uniform(0.6,1.4)+r.uniform(0,6))
    edge=edge-edge.min()
    yy2=np.arange(fh)[:,None];em=np.clip((yy2-(4+edge[None,:]))/2.5,0,1)
    # darker just under the top edge
    fa=fa*(0.75+0.25*np.clip((yy2-(4+edge))/40,0,1))[...,None]
    fy=yt+fill_gap;fx=x0+7
    sub=C[fy:fy+fh,fx:fx+fa.shape[1]]
    a=em*bm[fy:fy+fh,fx:fx+fa.shape[1]]
    sub[...,:3]=fa*a[...,None]+sub[...,:3]*(1-a[...,None]);sub[...,3]=a*255
    # plastic haze in the air gap and overall body
    haze=bm*(1-C[...,3]/255)*0.16
    C=over(C,np.array([244,246,246.]),haze)
    # bottom base (thick plastic refraction)
    tt=(np.arange(CW)-x0-W/2)/(W/2);base_y=yb-58+16*np.sqrt(np.clip(1-tt**2,0,1))
    Y=np.arange(CH)[:,None];bmask=(Y>base_y[None,:])&(bm>0)
    C[...,:3]=np.where(bmask[...,None],C[...,:3]*0.78+np.array([235,238,236])*0.08,C[...,:3])
    line=np.exp(-((Y-base_y[None,:])/2.2)**2)*bm*0.55
    C=over(C,np.array([255,255,255.]),line)
    # wall edges (rim light + outline)
    xs=np.arange(CW)[None,:]
    dl=np.abs(xs-x0);dr=np.abs(xs-(x0+W))
    rim=(np.exp(-(dl/6)**2)*0.55+np.exp(-(dr/5)**2)*0.4)*bm
    C=over(C,np.array([255,255,255.]),rim)
    dark=(np.exp(-((xs-x0-1)/1.5)**2)+np.exp(-((xs-x0-W+1)/1.5)**2))*bm*0.35
    C=over(C,np.array([60,70,66.]),dark)
    # label
    if label is not None:
        Dm=int(W*0.68);lab=label.resize((Dm,Dm),Image.LANCZOS);lw,P=cyl_warp(lab,W-14,arc_w=Dm)
        la=A(lw);lt=(np.arange(P)-P/2)/(W/2);la[...,:3]*= (0.80+0.22*np.sqrt(np.clip(1-lt**2,0,1)))[None,:,None]
        ly=int(yt+(yb-yt)*0.56-Dm/2);lx=int(x0+W/2-P/2)
        sub=C[ly:ly+Dm,lx:lx+P];al=la[...,3:4]/255
        sub[...,:3]=la[...,:3]*al+sub[...,:3]*(1-al);sub[...,3]=np.maximum(sub[...,3],la[...,3])
    # specular streaks on plastic (over label too)
    s=streak(CW,CH,x0+W*0.17,W*0.045,0.62,yt+30,yb-60)+streak(CW,CH,x0+W*0.27,W*0.018,0.35,yt+60,yb-90)+streak(CW,CH,x0+W*0.86,W*0.022,0.30,yt+40,yb-80)
    C=over(C,np.array([255,255,255.]),s*bm)
    # neck threads
    for k,yy0 in enumerate([yt+6,yt+18]):
        C=over(C,np.array([255,255,255.]),np.exp(-((Y-yy0)/1.6)**2)*bm*0.35)
    # lid
    L=lid_layer(W+16,LH+6,44,lid,ring);ly0=TOP-4
    sub=C[ly0:ly0+LH+6,x0-8:x0+W+8];al=L[...,3:4]/255
    sub[...,:3]=L[...,:3]*al+sub[...,:3]*(1-al);sub[...,3]=np.maximum(sub[...,3],L[...,3])
    if handle:C=draw_handle(C,x0,W,TOP)
    im=Image.fromarray(C.clip(0,255).astype(np.uint8),'RGBA')
    return im.crop(im.getbbox())
def draw_handle(C,x0,W,TOP):
    H,Wc=C.shape[:2];im=Image.fromarray(C.clip(0,255).astype(np.uint8),'RGBA')
    hl=Image.new('RGBA',im.size,(0,0,0,0));d=ImageDraw.Draw(hl)
    bb=(x0+W*0.12,TOP-170,x0+W*0.88,TOP+170)
    for i,(w,c) in enumerate([(30,(20,40,32,255)),(24,(36,70,56,255)),(10,(70,110,92,255))]):
        d.arc(bb,200,340,fill=c,width=w)
    d.arc((bb[0]+6,bb[1]+6,bb[2]-6,bb[3]-6),215,300,fill=(150,190,170,160),width=3)
    for xx in (x0+W*0.16,x0+W*0.84):
        d.rounded_rectangle((xx-22,TOP-26,xx+22,TOP+18),radius=8,fill=(196,162,101,255),outline=(140,110,60,255),width=2)
        d.rectangle((xx-14,TOP-18,xx+14,TOP-12),fill=(232,210,160,255))
    hl=hl.filter(ImageFilter.GaussianBlur(0.6));im.alpha_composite(hl);return A(im)
