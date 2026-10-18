"""Mộc Quả stand-up zip pouch — photoreal composite.
Body colour per fruit family + film grain + pillow shading, big arch window filled with a REAL dried-fruit
photo (tex/, Wikimedia Commons, see credits.json), print layer from pouch-print.html, then film gloss,
wrinkles, zip ridge, crimped heat seals, tear notches and bottom gusset."""
import numpy as np,math,random,os
from PIL import Image,ImageDraw,ImageFilter
import pack
W,H=900,1200
X0,X1,AT,AB=135,765,330,840
FAM={'saffron':((196,122,30),'dark'),'berry':((150,30,56),'dark'),'magenta':((158,40,95),'dark'),'golden':((172,128,34),'dark'),
     'plum':((94,31,51),'dark'),'sage':((104,132,98),'dark'),'cream':((236,226,204),'light'),'terracotta':((166,80,44),'dark'),'taro':((108,88,126),'dark')}
INK={'dark':dict(ink='#F6EEDC',gold='#E2C27E',pill='#E2C27E',pillText='#1E3A2F'),'light':dict(ink='#1E3A2F',gold='#9C7432',pill='#1E3A2F',pillText='#F1E3BF')}
def outline_mask():
    m=Image.new('L',(W,H),0);d=ImageDraw.Draw(m)
    pts=[]
    for i in range(0,101):
        y=H*i/100;b=10*math.sin(math.pi*i/100)   # slight bulge (filled pouch)
        pts.append((14-b,y))
    for i in range(100,-1,-1):
        y=H*i/100;b=10*math.sin(math.pi*i/100);pts.append((W-14+b,y))
    d.polygon(pts,fill=255)
    m2=Image.new('L',(W,H),0);ImageDraw.Draw(m2).rounded_rectangle((0,0,W-1,H-1),radius=34,fill=255)
    m=Image.fromarray(np.minimum(np.asarray(m),np.asarray(m2)))
    # tear notches
    d=ImageDraw.Draw(m);d.polygon([(0,168),(16,176),(0,184)],fill=0);d.polygon([(W,168),(W-16,176),(W,184)],fill=0)
    return m.filter(ImageFilter.GaussianBlur(0.8))
def window_mask():
    m=Image.new('L',(W,H),0);d=ImageDraw.Draw(m);R=(X1-X0)/2
    d.rectangle((X0,AT+R,X1,AB),fill=255);d.pieslice((X0,AT,X1,AT+2*R),180,360,fill=255)
    return m
def wrinkles(seed):
    r=random.Random(seed);hi=Image.new('L',(W,H),0);lo=Image.new('L',(W,H),0);dh=ImageDraw.Draw(hi);dl=ImageDraw.Draw(lo)
    def crease(x,y,ang,ln,amp):
        pts=[];
        for t in np.linspace(0,1,12):
            pts.append((x+math.cos(ang)*ln*t+math.sin(t*6+seed)*amp,y+math.sin(ang)*ln*t+math.cos(t*5)*amp))
        dh.line(pts,fill=r.randint(70,130),width=3);dl.line([(a+4,b+3) for a,b in pts],fill=r.randint(60,110),width=4)
    for _ in range(4):crease(r.uniform(20,140),r.uniform(220,1050),r.uniform(-0.5,0.4),r.uniform(90,200),6)
    for _ in range(4):crease(r.uniform(760,880),r.uniform(220,1050),r.uniform(2.7,3.6),r.uniform(90,200),6)
    for _ in range(5):crease(r.uniform(80,820),r.uniform(1090,1150),r.uniform(-0.3,0.3),r.uniform(80,180),3)
    for _ in range(3):crease(r.uniform(60,840),r.uniform(80,140),r.uniform(-0.2,0.2),r.uniform(60,140),2)
    return np.asarray(hi.filter(ImageFilter.GaussianBlur(3)))/255.,np.asarray(lo.filter(ImageFilter.GaussianBlur(5)))/255.
def render(fill_img,print_img,family,seed=1):
    base,tone=FAM[family];rs=np.random.RandomState(seed)
    y,x=np.mgrid[0:H,0:W].astype(np.float32);t=(x-W/2)/(W/2);v=y/H
    # body: pillow shading
    sh=0.80+0.30*np.clip(1-np.abs(t+0.12)**2.2,0,1)
    sh*=(0.93+0.10*np.sin(np.pi*np.clip((v-0.03)/0.92,0,1)))
    sh*=1-0.10*np.clip((v-0.9)/0.1,0,1)
    grain=rs.randn(H,W).astype(np.float32)*2.4
    mott=np.asarray(Image.fromarray((rs.rand(30,23)*255).astype('uint8')).resize((W,H),Image.BICUBIC)).astype(np.float32)/255-0.5
    body=np.asarray(base,np.float32)[None,None,:]*(sh+mott*0.05)[...,None]+grain[...,None]
    C=np.zeros((H,W,4),np.float32);C[...,:3]=body;om=np.asarray(outline_mask())/255.;C[...,3]=om*255
    # window with real fruit photo, slight barrel warp + darker edge where fruit presses film
    wm=np.asarray(window_mask())/255.
    ww,wh=X1-X0,AB-AT
    fw=np.asarray(fill_img.convert('RGB').resize((int(ww*1.25),wh),Image.LANCZOS),np.float32)
    u=np.linspace(-1,1,ww);src=(np.arcsin(u*0.92)/np.arcsin(0.92))*0.5+0.5      # barrel: fruit bulging against film
    fa=fw[:,np.clip((src*(fw.shape[1]-1)).astype(int),0,fw.shape[1]-1)]
    wy,wx=np.mgrid[0:AB-AT,0:X1-X0];tt=(wx-(X1-X0)/2)/((X1-X0)/2)
    ed=np.clip(1-np.abs(tt)**3,0,1)*np.clip((AB-AT-wy)/40,0,1)
    fa=fa*(0.68+0.34*ed)[...,None]
    sub=C[AT:AB,X0:X1,:3];m=wm[AT:AB,X0:X1,None]
    sub[:]=sub*(1-m)+fa*m
    # inner shadow at window rim (ink thickness / film gap)
    rim=np.asarray(Image.fromarray((wm*255).astype('uint8')).filter(ImageFilter.GaussianBlur(9)))/255.
    inner=np.clip(wm-rim,0,1)*2.2
    C[...,:3]*=(1-0.45*np.clip(inner,0,1))[...,None]
    # print layer
    pa=np.asarray(print_img.convert('RGBA').resize((W,H)),np.float32);a=pa[...,3:4]/255
    C[...,:3]=C[...,:3]*(1-a)+pa[...,:3]*a*(sh[...,None]*0.9+0.12)
    # crimped heat seals: top band + side seals
    crimp=(np.sin(x*0.9)*0.5+0.5)
    top=(y<70);C[...,:3]=np.where(top[...,None],C[...,:3]*(0.92+0.10*crimp[...,None]),C[...,:3])
    side=((x<30)|(x>W-30))&(y<H-20)
    C[...,:3]=np.where(side[...,None],C[...,:3]*(0.93+0.07*(np.sin(y*0.9)*0.5+0.5))[...,None],C[...,:3])
    def line(y0,col,a,wid):
        g=np.exp(-((y-y0)/wid)**2)*a;C[...,:3]=C[...,:3]*(1-g[...,None])+np.asarray(col)*g[...,None]
    line(70,(0,0,0),0.18,2.5);line(73,(255,255,255),0.12,1.5)
    # zip ridge
    line(112,(0,0,0),0.30,3);line(118,(255,255,255),0.30,2.2);line(126,(0,0,0),0.22,3.5);line(131,(255,255,255),0.12,2)
    # bottom gusset smile
    gy=H-115+28*(1-t**2)
    g=np.exp(-((y-gy)/3)**2)*0.35;C[...,:3]=C[...,:3]*(1-g[...,None])+255*g[...,None]*0.6
    below=np.clip((y-gy)/60,0,1)*0.16;C[...,:3]*=(1-below)[...,None]
    # wrinkles
    hi,lo=wrinkles(seed);C[...,:3]=C[...,:3]*(1-lo[...,None]*0.28)+255*hi[...,None]*0.22
    # film gloss: broad diagonal sheen + sharp streaks (stronger on window)
    d=(x*0.55+y*0.85)
    sheen=np.exp(-((d-430)/120)**2)*0.20+np.exp(-((d-560)/26)**2)*0.30+np.exp(-((d-1350)/60)**2)*0.10
    sheen=sheen*(0.55+0.45*wm)
    vstreak=np.exp(-((x-W*0.16)/14)**2)*0.22*np.clip((y-150)/200,0,1)*np.clip((1080-y)/200,0,1)
    vstreak+=np.exp(-((x-W*0.86)/9)**2)*0.14*np.clip((y-200)/200,0,1)*np.clip((1000-y)/200,0,1)
    gl=np.clip(sheen+vstreak,0,0.6);C[...,:3]=C[...,:3]*(1-gl[...,None])+255*gl[...,None]
    # edge rim light/dark
    e=np.asarray(Image.fromarray((om*255).astype('uint8')).filter(ImageFilter.GaussianBlur(6)))/255.
    edge=np.clip(om-e,0,1)*2
    C[...,:3]=C[...,:3]*(1-0.35*edge[...,None])
    C[...,3]=om*255
    return Image.fromarray(C.clip(0,255).astype('uint8'),'RGBA'),tone
