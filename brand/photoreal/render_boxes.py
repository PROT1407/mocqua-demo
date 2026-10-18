"""Mộc Quả clear PET boxes — generic container shapes common on the market, Mộc Quả round sticker.
 square(): hộp vuông nhựa trong (500g/1kg) — default 'Hộp PET' option of the sấy dẻo line
 octa():   hộp bát giác nhựa trong
 hong_window(), hong_carton(): hộp quà hồng sấy (ngăn kéo cửa sổ / hộp quai xách)"""
import sys,os,math,zlib;D=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,D)
import numpy as np
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance,ImageOps
import render_gift as G,pack
AS=G.AS
def comp(cut,W,H,name):
    C=G.C;bg=C.backdrop(W,H).convert('RGBA');s=min(W*0.80/cut.width,H*0.74/cut.height);c=cut.resize((int(cut.width*s),int(cut.height*s)),Image.LANCZOS)
    c=c.filter(ImageFilter.UnsharpMask(radius=1.2,percent=35,threshold=2));x=(W-c.width)//2;y=int((H-c.height)/2)
    a=c.split()[-1];ds=Image.new('L',(W,H),0);ds.paste(a,(x+int(W*0.01),y+int(H*0.014)));ds=ds.point(lambda v:v*0.22).filter(ImageFilter.GaussianBlur(W*0.02))
    bg=Image.composite(Image.new('RGBA',(W,H),(70,52,30,255)),bg,ds);bg.alpha_composite(c,(x,y))
    bg.convert('RGB').save(f'{C.OUT}/{name}.jpg',quality=86,optimize=True,progressive=True)
def bsave(img,name):
    img=img.crop(img.getbbox());n='mqz/'+name;comp(img,1200,1200,n);comp(img,1200,1500,n+'-45')
    im=img.copy();im.thumbnail((900,900),Image.LANCZOS);im.save(f'{AS}/cut/{name}.webp',quality=86,method=6)
def tcrop(CV,th=40):
    b=CV.split()[-1].point(lambda v:255 if v>th else 0).getbbox();return CV.crop(b)
def contact(CV,cam,pts,blur=26,a=120,grow=1.04):
    L=Image.new('RGBA',CV.size,(0,0,0,0));P=[cam.P(x*grow,y,0) for x,y in pts]
    ImageDraw.Draw(L).polygon(P,fill=(40,30,20,a));CV.alpha_composite(L.filter(ImageFilter.GaussianBlur(blur)))
def rrect_mask(w,h,r):m=Image.new('L',(w,h),0);ImageDraw.Draw(m).rounded_rectangle((0,0,w-1,h-1),radius=r,fill=255);return m
def plastic_face(fill,w,h,fill_top=0.86,seed=1,dark=0.80):
    """side wall of a clear box packed with fruit: fruit pressed on plastic + haze + ribs"""
    f=np.asarray(fill.resize((w,h),Image.LANCZOS)).astype(np.float32)[...,:3]*dark
    y,x=np.mgrid[0:h,0:w];a=np.full((h,w),255.)
    ft=int(h*(1-fill_top));rs=np.random.RandomState(seed);edge=ft+np.convolve(rs.randn(w+60),np.ones(60)/60,'same')[30:30+w]*80
    air=y<edge[None,:]
    f[air]=f[air]*0.25+np.array([228,232,232])*0.55;a[air]=150
    f=f*(0.82+0.18*np.clip(y/h*1.4,0,1))[...,None]
    hz=0.10+0.10*np.exp(-((x-w*0.12)/(w*0.05))**2)+0.35*np.exp(-((x-w*0.04)/(w*0.012))**2)
    f=f*(1-hz[...,None])+255*hz[...,None]
    for yy in (h-26,h-14):f[max(0,yy-1):yy+1]=f[max(0,yy-1):yy+1]*0.7+70;
    f[:, :3]=f[:, :3]*0.6+200*0.4;f[:,-3:]=f[:,-3:]*0.7+60*0.3
    return Image.fromarray(np.dstack([f,a]).clip(0,255).astype('uint8'),'RGBA')
def lid_top(fill,label,w,h,r=60,sticker=0.56):
    f=np.asarray(ImageEnhance.Brightness(fill.resize((w,h),Image.LANCZOS)).enhance(1.04)).astype(np.float32)[...,:3]
    y,x=np.mgrid[0:h,0:w]
    # embossed rim ring of the lid
    ins=46;d=np.minimum.reduce([x-ins,w-ins-x,y-ins,h-ins-y]).astype(np.float32)
    ring=np.exp(-((d+4)/6)**2);ring2=np.exp(-((d-6)/5)**2)
    f=f*(1-0.30*ring2[...,None])+255*0.55*ring[...,None]
    outer=np.minimum.reduce([x,w-x,y,h-y]);band=outer<ins-6
    f[band]=f[band]*0.55+np.array([238,242,242])*0.45
    hz=0.12;f=f*(1-hz)+255*hz
    dd=(x+y*1.15)/(w+h*1.15);g=0.42*np.exp(-((dd-0.30)/0.05)**2)+0.25*np.exp(-((dd-0.40)/0.018)**2)+0.12*np.exp(-((dd-0.78)/0.06)**2)
    im=Image.fromarray(np.dstack([f,np.full((h,w),255.)]).clip(0,255).astype('uint8'),'RGBA')
    if label is not None:
        s=int(min(w,h)*sticker);L=label.resize((s,s),Image.LANCZOS);sh=Image.new('RGBA',im.size,(0,0,0,0))
        m=L.split()[-1].point(lambda v:int(v*0.35));blk=Image.new('RGBA',(s,s),(20,20,20,255));blk.putalpha(m);sh.alpha_composite(blk,((w-s)//2+5,(h-s)//2+8))
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)));im.alpha_composite(L,((w-s)//2,(h-s)//2))
    a=np.asarray(im).astype(np.float32);a[...,:3]=a[...,:3]*(1-g[...,None]*0.85)+255*g[...,None]*0.85
    im=Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA');im.putalpha(rrect_mask(w,h,r));return im
def square(sku,fill,label,W=640,Dp=640,H=250,name=None,save=True):
    cam=G.Cam(pitch=36);CV=G.canvas();t=0.035;x0,x1,y0,y1=-W/2,W/2,0,Dp
    bx=lambda x:x*(1-t)
    contact(CV,cam,[(x0-10,y0-40),(x1+40,y0-40),(x1+40,y1),(x0-10,y1)],blur=22,a=130)
    sd=plastic_face(fill,800,330,seed=2,dark=0.70);fr=plastic_face(fill.transpose(Image.FLIP_LEFT_RIGHT),800,330,seed=5,dark=0.82)
    G.warp(CV,sd,G.face(cam,[(x1,y0,H),(x1,y1,H),(bx(x1),y1-Dp*t,0),(bx(x1),y0+Dp*t,0)]),1.0)
    G.warp(CV,fr,G.face(cam,[(x0,y0,H),(x1,y0,H),(bx(x1),y0+Dp*t,0),(bx(x0),y0+Dp*t,0)]),1.0)
    # rounded vertical corner highlight
    p0=cam.P(x1,y0,H);p1=cam.P(bx(x1),y0+Dp*t,0)
    L=Image.new('RGBA',CV.size,(0,0,0,0));d=ImageDraw.Draw(L);d.line((p0,p1),fill=(255,255,255,170),width=10);CV.alpha_composite(L.filter(ImageFilter.GaussianBlur(4)))
    # lid lip
    lip=Image.new('RGBA',(800,40),(236,240,240,170));ImageDraw.Draw(lip).line((0,6,800,6),fill=(255,255,255,230),width=3)
    e=10;G.warp(CV,lip,G.face(cam,[(x0-e,y0-e,H+16),(x1+e,y0-e,H+16),(x1+e,y0-e,H-4),(x0-e,y0-e,H-4)]),1.0)
    G.warp(CV,lip,G.face(cam,[(x1+e,y0-e,H+16),(x1+e,y1+e,H+16),(x1+e,y1+e,H-4),(x1+e,y0-e,H-4)]),0.85)
    top=lid_top(fill,label,900,int(900*Dp/W))
    G.warp(CV,top,G.face(cam,[(x0-e,y1+e,H+16),(x1+e,y1+e,H+16),(x1+e,y0-e,H+16),(x0-e,y0-e,H+16)]))
    if save:bsave(tcrop(CV,25),name or sku.lower()+'-hv')
    return CV
def octa(sku,fill,label,name=None):
    S=1100;m=G.poly_mask(S,G.ngon(S/2,S/2,S*0.48,8,-90+22.5));G.CY[0]=S/2
    a=np.asarray(fill.resize((S,S),Image.LANCZOS)).astype(np.float32);dist=G.ndimage.distance_transform_edt(m)
    a=a*(0.55+0.45*np.clip(dist/60,0,1)**0.6)[...,None];top=Image.fromarray(np.dstack([a,m*255.]).clip(0,255).astype('uint8'),'RGBA')
    avg=tuple(int(v*0.84) for v in np.asarray(fill.resize((1,1))).reshape(-1)[:3])
    CV=G.canvas();cam=G.Cam(pitch=40)
    G.prism(CV,cam,top,1000,150,avg)
    lidm=Image.fromarray((G.ndimage.binary_dilation(m,iterations=10)*255).astype('uint8'))
    G.clear_lid(CV,cam,lidm,1015,45,150,sticker=False)
    # sticker on lid (product label)
    st=Image.new('RGBA',(S,S),(0,0,0,0));s=int(S*0.46);st.alpha_composite(label.resize((s,s),Image.LANCZOS),((S-s)//2,(S-s)//2))
    Dd=1015;G.warp(CV,st,G.face(cam,[(-Dd/2,Dd/2,196),(Dd/2,Dd/2,196),(Dd/2,-Dd/2,196),(-Dd/2,-Dd/2,196)]))
    bsave(CV,name or sku.lower());return CV
def hong_window(sku,fill,name=None):
    W,Dp,H=900,560,170;cam=G.Cam(pitch=36)
    lid=G.paper(G.art('lid_ivory').resize((1000,622),Image.LANCZOS),2)
    win=fill.resize((640,330),Image.LANCZOS).convert('RGBA');a=np.asarray(win).astype(np.float32);y,x=np.mgrid[0:330,0:640];dd=(x+y)/970
    g=0.08+0.35*np.exp(-((dd-0.35)/0.05)**2);a[...,:3]=a[...,:3]*(1-g[...,None])+255*g[...,None];win=Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
    wl=lid.copy();wl.paste(win,(180,200));ImageDraw.Draw(wl).rectangle((176,196,823,533),outline=G.GOLD+(255,),width=5)
    sl=G.SEAL().resize((170,170),Image.LANCZOS);wl.alpha_composite(sl,(415,25))
    fr=G.lines_gold(G.solid(1000,190,(142,28,30),4),ys=(20,164),wd=5);sd=G.lines_gold(G.solid(620,190,(142,28,30),5),ys=(20,164),wd=5)
    CV=G.canvas();G.bag(CV,cam,(-980,560,0),'mai',W=520,Dp=180,H=660)
    G.cuboid(CV,cam,(-W/2,0,0),W,Dp,H,top=wl,front=fr,side=sd);bsave(CV,name or sku.lower());return CV
def hong_carton(sku,fill,name=None):
    W,Dp,H=760,420,420;cam=G.Cam(pitch=24)
    fr=G.lines_gold(G.solid(1000,553,(238,229,208),3,0.05),ys=(34,519),wd=5)
    sl=G.SEAL().resize((300,300),Image.LANCZOS);fr.alpha_composite(sl,(110,126))
    win=fill.resize((440,330),Image.LANCZOS).convert('RGBA');fr.alpha_composite(win,(500,112))
    dr=ImageDraw.Draw(fr);dr.rounded_rectangle((494,106,946,448),radius=22,outline=G.GOLD+(255,),width=6)
    fr=G.paper(fr,3)
    sd=G.lines_gold(G.solid(560,560,(236,226,204),5),ys=(30,520),wd=5)
    top=G.solid(1000,560,(230,218,192),6,0.05)
    CV=G.canvas();G.cuboid(CV,cam,(-W/2,0,0),W,Dp,H,top=top,front=fr,side=sd)
    # gable handle standing on the top
    hd=G.solid(700,260,(236,226,204),7,0.05);m=Image.new('L',hd.size,0);dr=ImageDraw.Draw(m);dr.polygon([(0,260),(120,0),(580,0),(700,260)],fill=255);dr.rounded_rectangle((250,50,450,110),radius=30,fill=0)
    hd.putalpha(m);G.lines_gold(hd,ys=(240,),wd=5);hd.putalpha(m)
    G.warp(CV,hd,G.face(cam,[(-W/2*0.92,Dp/2,H+230),(W/2*0.92,Dp/2,H+230),(W/2*0.92,Dp/2,H),(-W/2*0.92,Dp/2,H)]),0.95)
    bsave(CV,name or sku.lower());return CV
if __name__=='__main__':
    lab=Image.open(D+'/labels/MQZ-DHS-500.png').convert('RGBA')
    square('MQZ-DHS-500',pack.tex('hatsen',900,900,tint=(214,200,160)),lab)
