"""Mộc Quả gift boxes / Hộp mứt Tết — photoreal composites (own artwork, real fruit textures).
Outputs per SKU: assets/products/mqz/<sku>.jpg (+-45, cut webp) = hero (closed + bag),
<sku>-g2.jpg = open, <sku>-g3.jpg = contents close-up. (-g4 contents card: render_gift_cards.py)"""
import sys,os,math,json,zlib;D=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,D);sys.path.insert(0,D+'/../pouch')
import numpy as np,pack,compose_bg as C
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance,ImageOps,ImageChops
from scipy import ndimage
B=json.load(open(D+'/../../research/mocqua-giftboxes.json'))['boxes']
ART=D+'/gift/art';AS=D+'/../../assets/products/mqz'
GOLD=(214,178,104);RED=(142,28,30);GRN=(31,61,49)
TXT={'me':('hongep',(120,70,40)),'dautam':('dautay',(95,28,55)),'hatsen':('hatsen',(214,200,160)),'mangcau':('mangcau',(214,178,112))}
def T(k,w,h):
    a,t=TXT.get(k,(k,None));return pack.tex(a,w,h,tint=t)
def art(k):return Image.open(f'{ART}/{k}.png').convert('RGBA')
def SEAL():return Image.open(D+'/labels/SEAL.png').convert('RGBA')
# ---------------- projection ----------------
class Cam:
    def __init__(s,yaw=-28,pitch=34,f=5200,cx=1600,cy=1700):
        s.a=math.radians(yaw);s.p=math.radians(pitch);s.f=f;s.cx=cx;s.cy=cy
    def P(s,x,y,z):
        a,p=s.a,s.p;xr=x*math.cos(a)-y*math.sin(a);yr=x*math.sin(a)+y*math.cos(a)
        d=yr*math.cos(p)-z*math.sin(p);k=s.f/(s.f+d)
        return (s.cx+xr*k,s.cy-(z*math.cos(p)+yr*math.sin(p))*k)
def coeffs(src,dst):
    A=[];b=[]
    for (x,y),(u,v) in zip(dst,src):A+=[[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]];b+=[u,v]
    return np.linalg.solve(np.array(A,float),np.array(b,float)).tolist()
def warp(CV,img,dst,shade=1.0):
    """warp RGBA img onto canvas quad dst (tl,tr,br,bl screen points)"""
    img=img.convert('RGBA');w,h=img.size
    if shade!=1.0:
        a=np.asarray(img).astype(np.float32);a[...,:3]*=shade;img=Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
    t=img.transform(CV.size,Image.PERSPECTIVE,coeffs([(0,0),(w,0),(w,h),(0,h)],dst),Image.BICUBIC)
    m=Image.new('L',CV.size,0);ImageDraw.Draw(m).polygon(dst,fill=255)
    t.putalpha(ImageChops.multiply(t.split()[-1],m));CV.alpha_composite(t)
def face(cam,corners):return [cam.P(*c) for c in corners]
def grain(img,amt=5,seed=1):
    a=np.asarray(img.convert('RGBA')).astype(np.float32);n=np.random.RandomState(seed).randn(*a.shape[:2])*amt
    a[...,:3]+=n[...,None];return Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
def light(img,dir='tl',k=0.18):
    a=np.asarray(img.convert('RGBA')).astype(np.float32);h,w=a.shape[:2];y,x=np.mgrid[0:h,0:w]
    g=1+k*(1-(x/w+y/h))  if dir=='tl' else 1+k*(0.5-y/h)
    a[...,:3]*=g[...,None];return Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
def emboss_gold(img):
    """raise gold ink: bevel highlight/shadow on gold-coloured pixels"""
    a=np.asarray(img.convert('RGBA')).astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2]
    m=((r>150)&(g>110)&(b<150)&(r-b>50)).astype(np.float32)
    mm=ndimage.gaussian_filter(m,1.5);hl=np.clip(np.roll(mm,1,0)-np.roll(mm,-1,0)+np.roll(mm,1,1)-np.roll(mm,-1,1),-1,1)
    a[...,:3]+=(hl*-70)[...,None]*m[...,None]+ (hl*-25)[...,None]
    # metallic sheen across gold
    h,w=m.shape;y,x=np.mgrid[0:h,0:w];sh=0.85+0.35*np.exp(-(((x+y)/(w+h)-0.45)/0.12)**2)
    a[...,:3]=a[...,:3]*(1-m[...,None])+a[...,:3]*m[...,None]*sh[...,None]
    return Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
def paper(img,seed=1,k=0.16):return grain(light(emboss_gold(img),k=k),4,seed)
def solid(w,h,col,seed=1,k=0.12):return paper(Image.new('RGBA',(w,h),col+(255,)),seed,k)
def lines_gold(img,ys=(),xs=(),wd=6):
    d=ImageDraw.Draw(img)
    for y in ys:d.rectangle((0,y,img.width,y+wd),fill=GOLD+(255,))
    for x in xs:d.rectangle((x,0,x+wd,img.height),fill=GOLD+(255,))
    return img
def ribbon_v(img,x,w=70,col=(176,30,38)):
    d=ImageDraw.Draw(img);d.rectangle((x-w//2,0,x+w//2,img.height),fill=col+(255,))
    a=np.asarray(img).astype(np.float32);xs=slice(x-w//2,x+w//2);xx=np.linspace(-1,1,w)
    a[:,xs,:3]*=(0.82+0.3*np.exp(-((xx-0.2)/0.35)**2))[None,:,None];return Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
def ribbon_h(img,y,w=70,col=(176,30,38)):return ribbon_v(img.rotate(90,expand=True),y if False else y,w,col).rotate(-90,expand=True)
def bow(CV,x,y,s=1.0,col=(176,30,38)):
    L=Image.new('RGBA',CV.size,(0,0,0,0));d=ImageDraw.Draw(L);c=col;dk=tuple(int(v*0.7) for v in col)
    d.ellipse((x-150*s,y-70*s,x-10*s,y+40*s),fill=c+(255,));d.ellipse((x+10*s,y-70*s,x+150*s,y+40*s),fill=c+(255,))
    d.ellipse((x-110*s,y-40*s,x-40*s,y+10*s),fill=dk+(255,));d.ellipse((x+40*s,y-40*s,x+110*s,y+10*s),fill=dk+(255,))
    d.polygon([(x-14*s,y),(x-90*s,y+170*s),(x-50*s,y+160*s),(x-30*s,y+185*s),(x,y+10*s)],fill=c+(255,))
    d.polygon([(x+14*s,y),(x+80*s,y+175*s),(x+45*s,y+165*s),(x+20*s,y+188*s),(x,y+10*s)],fill=dk+(255,))
    d.ellipse((x-32*s,y-30*s,x+32*s,y+30*s),fill=tuple(min(255,int(v*1.15)) for v in col)+(255,))
    a=np.asarray(L).astype(np.float32);yy,xx=np.mgrid[0:CV.size[1],0:CV.size[0]]
    a[...,:3]*=(0.9+0.25*np.exp(-(((xx-x+40*s)**2+(yy-y+30*s)**2)/(90*s)**2)))[...,None]
    CV.alpha_composite(Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA').filter(ImageFilter.GaussianBlur(0.7)))
def cuboid(CV,cam,o,W,Dp,H,top=None,front=None,side=None,back=False):
    x0,y0,z0=o;x1,y1,z1=x0+W,y0+Dp,z0+H
    if side is not None:warp(CV,side,face(cam,[(x1,y0,z1),(x1,y1,z1),(x1,y1,z0),(x1,y0,z0)]),0.74)
    if front is not None:warp(CV,front,face(cam,[(x0,y0,z1),(x1,y0,z1),(x1,y0,z0),(x0,y0,z0)]),0.90)
    if top is not None:warp(CV,top,face(cam,[(x0,y1,z1),(x1,y1,z1),(x1,y0,z1),(x0,y0,z1)]),1.0)
# ---------------- compartments (top view) ----------------
def fill_cells(S,cells,keys,base,outline,deco=None,foil=False):
    """cells: list of bool masks; returns RGBA S×S top view"""
    out=np.zeros((S,S,4),np.float32);bc=np.asarray(base,np.float32)
    # tray plastic: base colour with bevel
    o=outline.astype(np.float32);sm=ndimage.gaussian_filter(o,4)
    out[...,:3]=bc*(0.85+0.3*np.clip(ndimage.gaussian_filter(o,12)-0.5,0,1)[...,None])
    for m,k in zip(cells,keys):
        ys,xs=np.where(m)
        if len(ys)==0:continue
        y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        t=np.asarray(T(k,x1-x0,y1-y0)).astype(np.float32)
        dist=ndimage.distance_transform_edt(m[y0:y1,x0:x1])
        sh=0.5+0.5*np.clip(dist/38,0,1)**0.6
        if foil:  # foil liner edge visible
            ring=(dist>0)&(dist<14);t[ring]=t[ring]*0.2+np.array([215,212,200])*0.8*(0.9+0.2*np.random.rand(ring.sum(),1))
        sub=out[y0:y1,x0:x1,:3];mm=m[y0:y1,x0:x1]
        sub[mm]=(t*sh[...,None])[mm]
    divm=outline&~np.any(cells,axis=0)
    # divider highlight (gold/plastic lip)
    d=ndimage.distance_transform_edt(divm);lip=np.clip(1-np.abs(d-3)/3,0,1)*divm
    out[...,:3]+=(lip*55)[...,None]
    out[...,3]=outline*255
    im=Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA')
    if deco is not None:
        s,(cx,cy),r=deco;sl=SEAL().resize((int(2*r),int(2*r)),Image.LANCZOS);im.alpha_composite(sl,(int(cx-r),int(cy-r)))
    return im
def radial(S,outline,center,n,offset=0,gap=9):
    y,x=np.mgrid[0:S,0:S];c=S/2;ang=(np.degrees(np.arctan2(y-CY[0],x-c))-offset)%360
    inner=outline&~ndimage.binary_dilation(center,iterations=gap)
    cells=[]
    for i in range(n):
        a0=360/n*i;a1=a0+360/n;m=inner&(ang>=a0)&(ang<a1)
        m=ndimage.binary_erosion(m,iterations=gap);cells.append(m)
    return cells
CY=[0]
def poly_mask(S,pts):m=Image.new('L',(S,S),0);ImageDraw.Draw(m).polygon(pts,fill=255);return np.asarray(m)>0
def circ_mask(S,cx,cy,r):m=Image.new('L',(S,S),0);ImageDraw.Draw(m).ellipse((cx-r,cy-r,cx+r,cy+r),fill=255);return np.asarray(m)>0
def ngon(cx,cy,r,n,rot=-90):return [(cx+r*math.cos(math.radians(rot+360/n*i)),cy+r*math.sin(math.radians(rot+360/n*i))) for i in range(n)]
def shape_top(kind,keys,S=1200,base=RED):
    c=S/2;R=S*0.48;CY[0]=c;deco=None
    if kind=='hex':
        out=poly_mask(S,ngon(c,c,R,6,-90));cen=poly_mask(S,ngon(c,c,R*0.36,6,-90))
        cells=radial(S,out,cen,6,offset=-90);cells=[ndimage.binary_erosion(cen,iterations=9)]+cells;ks=keys
    elif kind=='sq':
        q=R*0.98;out=np.zeros((S,S),bool);out[int(c-q):int(c+q),int(c-q):int(c+q)]=True
        cq=R*0.4;cen=np.zeros((S,S),bool);cen[int(c-cq):int(c+cq),int(c-cq):int(c+cq)]=True
        cells=radial(S,out,cen,4,offset=-135);cells=[ndimage.binary_erosion(cen,iterations=9)]+cells;ks=[keys[-1]]+keys[:4]
    elif kind=='round':
        out=circ_mask(S,c,c,R);cen=circ_mask(S,c,c,R*0.3);cells=radial(S,out,cen,6,offset=-90);ks=keys;deco=(1,(c,c),R*0.26)
    elif kind in('flower','flower5'):
        n=6 if kind=='flower' else 5;out=circ_mask(S,c,c,R*0.62)
        for i in range(n):
            a=math.radians(-90+360/n*i);out|=circ_mask(S,c+math.cos(a)*R*0.6,c+math.sin(a)*R*0.6,R*0.4)
        cen=circ_mask(S,c,c,R*0.3);cells=radial(S,out,cen,n,offset=-90-180/n)
        if n==5:cells=[ndimage.binary_erosion(cen,iterations=9)]+cells;ks=[keys[-1]]+keys[:5]
        else:ks=keys;deco=(1,(c,c),R*0.26)
    elif kind=='heart':
        t=np.linspace(0,2*math.pi,400);hx=16*np.sin(t)**3;hy=-(13*np.cos(t)-5*np.cos(2*t)-2*np.cos(3*t)-np.cos(4*t))
        sc=R/17;pts=list(zip(c+hx*sc,c+hy*sc-R*0.02));out=poly_mask(S,pts);CY[0]=c-R*0.08
        cen=circ_mask(S,c,CY[0],R*0.22);cells=radial(S,out,cen,8,offset=-90);ks=keys;deco=(1,(c,CY[0]),R*0.19)
    elif kind.startswith('grid'):
        cols,rows=int(kind[4]),int(kind[5]);W=S;H=int(S*rows/cols) if cols!=rows else S
        out=np.zeros((H,W),bool);F=26;out[:]=True;cells=[];g=14
        iw=(W-2*F-g*(cols-1))/cols;ih=(H-2*F-g*(rows-1))/rows
        for i in range(cols*rows):
            m=np.zeros((H,W),bool);x0=int(F+(i%cols)*(iw+g));y0=int(F+(i//cols)*(ih+g));m[y0:int(y0+ih),x0:int(x0+iw)]=True;cells.append(m)
        return fill_cells_rect(W,H,cells,keys,base)
    return fill_cells(S,cells,ks,base,out,deco)
def fill_cells_rect(W,H,cells,keys,base,foil=True):
    out=np.zeros((H,W,4),np.float32);out[...,:3]=np.asarray(base,np.float32);out[...,3]=255
    for m,k in zip(cells,keys):
        ys,xs=np.where(m);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        t=np.asarray(T(k,x1-x0,y1-y0)).astype(np.float32);dist=ndimage.distance_transform_edt(np.pad(np.ones((y1-y0,x1-x0)),1,constant_values=0))[1:-1,1:-1]
        sh=0.5+0.5*np.clip(dist/40,0,1)**0.6
        if foil:
            ring=dist<12;t[ring]=t[ring]*0.15+np.array([222,206,160])*0.85
        out[y0:y1,x0:x1,:3]=t*sh[...,None]
    a=Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA');return grain(a,3)
# ---------------- prism (extruded tray / heart box) ----------------
def prism(CV,cam,top,Wd,h,side_col,z0=0,ox=0,oy=0,alpha=1.0,glossy=False):
    S=top.width;Hh=top.height;Dd=Wd*Hh/S
    def corners(z):return face(cam,[(ox-Wd/2,oy+Dd/2,z),(ox+Wd/2,oy+Dd/2,z),(ox+Wd/2,oy-Dd/2,z),(ox-Wd/2,oy-Dd/2,z)])
    am=top.split()[-1]
    steps=max(8,int(h/3))
    xs=None
    for i in range(steps+1):
        z=z0+h*i/steps;dst=corners(z)
        m=am.transform(CV.size,Image.PERSPECTIVE,coeffs([(0,0),(S,0),(S,Hh),(0,Hh)],dst),Image.BILINEAR)
        k=0.55+0.3*(i/steps)
        col=tuple(int(v*k) for v in side_col)
        L=Image.new('RGBA',CV.size,col+(int(255*alpha),));L.putalpha(m.point(lambda v:int(v*alpha)))
        CV.alpha_composite(L)
    # horizontal shading band on the visible wall
    dst=corners(z0+h);warp(CV,top,dst)
    # rim highlight
    rim=am.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(5)).point(lambda v:200 if v>40 else 0)
    r=rim.transform(CV.size,Image.PERSPECTIVE,coeffs([(0,0),(S,0),(S,Hh),(0,Hh)],dst),Image.BILINEAR)
    L=Image.new('RGBA',CV.size,(255,236,190,0));L.putalpha(r.point(lambda v:int(v*0.55)));CV.alpha_composite(L.filter(ImageFilter.GaussianBlur(1.2)))
    return corners
def clear_lid(CV,cam,top_alpha,Wd,h,z0,sticker=True,ox=0,oy=0):
    """transparent PET lid: faint walls, glossy top, seal sticker"""
    S=top_alpha.width;Hh=top_alpha.height;Dd=Wd*Hh/S;am=top_alpha
    def corners(z):return face(cam,[(ox-Wd/2,oy+Dd/2,z),(ox+Wd/2,oy+Dd/2,z),(ox+Wd/2,oy-Dd/2,z),(ox-Wd/2,oy-Dd/2,z)])
    cf=coeffs([(0,0),(S,0),(S,Hh),(0,Hh)],corners(z0+h))
    # walls: light haze
    for i in range(0,int(h),4):
        m=am.transform(CV.size,Image.PERSPECTIVE,coeffs([(0,0),(S,0),(S,Hh),(0,Hh)],corners(z0+i)),Image.BILINEAR)
        e=m.filter(ImageFilter.FIND_EDGES).point(lambda v:60 if v>30 else 0)
        L=Image.new('RGBA',CV.size,(255,255,255,0));L.putalpha(e);CV.alpha_composite(L)
    m=am.transform(CV.size,Image.PERSPECTIVE,cf,Image.BILINEAR)
    # top haze + diagonal gloss
    g=np.zeros((Hh,S),np.float32);y,x=np.mgrid[0:Hh,0:S];d=(x+y*1.2)/(S+Hh*1.2)
    g+=0.10+0.45*np.exp(-((d-0.32)/0.05)**2)+0.25*np.exp(-((d-0.42)/0.02)**2)+0.18*np.exp(-((d-0.75)/0.06)**2)
    gl=Image.fromarray((np.clip(g,0,1)*255).astype('uint8')).transform(CV.size,Image.PERSPECTIVE,cf,Image.BILINEAR)
    L=Image.new('RGBA',CV.size,(255,255,255,0));L.putalpha(ImageChops.multiply(gl,m));CV.alpha_composite(L)
    e=m.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3)).point(lambda v:200 if v>30 else 0)
    L=Image.new('RGBA',CV.size,(255,255,255,0));L.putalpha(e);CV.alpha_composite(L.filter(ImageFilter.GaussianBlur(1)))
    if sticker:
        st=Image.new('RGBA',(S,Hh),(0,0,0,0));r=int(min(S,Hh)*0.17);sl=SEAL().resize((2*r,2*r),Image.LANCZOS)
        st.alpha_composite(sl,(S//2-r,int(CY[0]*Hh/S)-r if Hh==S else Hh//2-r));warp(CV,st,corners(z0+h+1))
# ---------------- paper gift bag ----------------
def bag(CV,cam,o,theme,W=560,Dp=200,H=700):
    a=art('bag_'+theme).resize((W,int(W*900/800)),Image.LANCZOS)
    fr=Image.new('RGBA',(W,H),(0,0,0,255));fr.alpha_composite(a.crop((0,0,W,min(H,a.height))),(0,0))
    if a.height<H:
        fill=a.getpixel((W//2,a.height-5));ImageDraw.Draw(fr).rectangle((0,a.height,W,H),fill=fill)
    fr=paper(fr,3,0.1)
    base=a.getpixel((20,H//2 if H//2<a.height else 20))[:3]
    sd=solid(Dp,H,tuple(int(v*0.92) for v in base),4,0.05)
    d=ImageDraw.Draw(sd);d.line((Dp//2,0,Dp//2,H),fill=tuple(int(v*0.7) for v in base)+(255,),width=3)  # gusset fold
    x0,y0,z0=o
    # rope handles (behind + front)
    def rope(yy,dk):
        p0=cam.P(x0+W*0.3,yy,z0+H);p1=cam.P(x0+W*0.7,yy,z0+H);top=cam.P(x0+W*0.5,yy,z0+H+H*0.36)
        L=Image.new('RGBA',CV.size,(0,0,0,0));d=ImageDraw.Draw(L)
        pts=[((1-t)**2*p0[0]+2*(1-t)*t*top[0]+t*t*p1[0],(1-t)**2*p0[1]+2*(1-t)*t*(top[1]-H*0.18)+t*t*p1[1]) for t in np.linspace(0,1,40)]
        d.line(pts,fill=(int(200*dk),int(160*dk),int(90*dk),255),width=14,joint='curve');d.line([(x-2,y-3) for x,y in pts],fill=(240,215,150,180),width=4)
        CV.alpha_composite(L)
    rope(y0+Dp*0.6,0.6)
    cuboid(CV,cam,o,W,Dp,H,top=solid(W,Dp,(30,24,18),5,0),front=fr,side=sd)
    rope(y0+Dp*0.05,1.0)
def contents_closeup(src_jpg,out_name,box=(0.18,0.2,0.82,0.75)):
    im=Image.open(src_jpg).convert('RGB');w,h=im.size;c=im.crop((int(box[0]*w),int(box[1]*h),int(box[2]*w),int(box[3]*h)))
    for sz,suf in (((1200,1200),''),((1200,1500),'-45')):
        ImageOps.fit(c,sz,Image.LANCZOS,centering=(0.5,0.5)).filter(ImageFilter.UnsharpMask(1.4,60,2)).save(f'{AS}/{out_name}{suf}.jpg',quality=86)
def save(img,name,cut=False):
    img=img.crop(img.getbbox());n='mqz/'+name
    C.compose(img,1200,1200,n);C.compose(img,1200,1500,n+'-45')
    if cut:
        im=img.copy();im.thumbnail((900,900),Image.LANCZOS);im.save(f'{AS}/cut/{name}.webp',quality=86,method=6)
def canvas():return Image.new('RGBA',(3200,3000),(0,0,0,0))
# ================= products =================
def keys_of(sku):return [c[2] for c in B[sku]['contents']]
GOLDP=(188,150,82);REDP=(150,30,32)
def r_tray(sku,kind,base):
    ks=keys_of(sku);top=shape_top(kind,ks,base=base)
    side=tuple(int(v*0.8) for v in base)
    # hero: lid on
    CV=canvas();cam=Cam(pitch=38)
    prism(CV,cam,top,1100,80,side);clear_lid(CV,cam,top.split()[-1].filter(ImageFilter.MaxFilter(9)),1110,70,80)
    save(CV,sku.lower(),cut=True)
    # open, steeper
    CV=canvas();cam=Cam(pitch=55);prism(CV,cam,top,1100,80,side);save(CV,sku.lower()+'-g2')
    contents_closeup(f'{AS}/{sku.lower()}-g2.jpg',sku.lower()+'-g3',(0.2,0.22,0.8,0.72))
def r_drawer(sku):
    ks=keys_of(sku);W,Dp,H=900,640,300;cam=Cam(pitch=32)
    lid=art('lid_sen').resize((1200,853),Image.LANCZOS);lid=paper(lid,2)
    def front_face(w,h):
        f=solid(w,h,GRN,6);lines_gold(f,ys=(24,h-30),wd=5);d=ImageDraw.Draw(f)
        # ribbon pull tab
        d.rounded_rectangle((w//2-60,h//2-16,w//2+60,h//2+16),radius=14,fill=(168,32,38,255));d.rounded_rectangle((w//2-44,h//2-6,w//2+44,h//2+6),radius=6,fill=(120,20,26,255))
        return emboss_gold(f)
    side=lines_gold(solid(Dp,H,GRN,7),ys=(24,H-30),wd=5)
    for pull,name,cut in ((0,sku.lower(),True),(int(Dp*0.8),sku.lower()+'-g2',False)):
        CV=canvas();bag(CV,cam,(-900,700,0),'sen',W=560,Dp=200,H=720)
        cuboid(CV,cam,(-W/2,0,0),W,Dp,H,top=lid,side=side)
        if pull==0:warp(CV,front_face(W,H),face(cam,[(-W/2,0,H),(W/2,0,H),(W/2,0,0),(-W/2,0,0)]),0.9)
        else:
            warp(CV,solid(W,H,(14,22,18),8,0),face(cam,[(-W/2,0,H),(W/2,0,H),(W/2,0,0),(-W/2,0,0)]),1)
            dw=W-30;dh=H-34;x0=-dw/2;y0=-pull
            warp(CV,lines_gold(solid(pull,dh,GRN,9),ys=(18,),wd=4),face(cam,[(x0+dw,y0,dh),(x0+dw,0,dh),(x0+dw,0,8),(x0+dw,y0,8)]),0.72)
            ct=fill_cells_rect(1000,int(1000*pull/dw),[],[],GRN);cw,chh=ct.size;F=22;g=16
            cells=[];iw=(cw-2*F-g)/2;ih=(chh-2*F-g)/2
            for i in range(4):
                m=np.zeros((chh,cw),bool);xa=int(F+(i%2)*(iw+g));ya=int(F+(i//2)*(ih+g));m[ya:int(ya+ih),xa:int(xa+iw)]=True;cells.append(m)
            ct=fill_cells_rect(cw,chh,cells,ks,(36,70,56))
            warp(CV,ct,face(cam,[(x0,0,dh),(x0+dw,0,dh),(x0+dw,y0,dh),(x0,y0,dh)]))
            warp(CV,front_face(int(dw),int(dh)),face(cam,[(x0,y0,dh),(x0+dw,y0,dh),(x0+dw,y0,8),(x0,y0,8)]),0.9)
        save(CV,name,cut)
    contents_closeup(f'{AS}/{sku.lower()}-g2.jpg',sku.lower()+'-g3',(0.3,0.38,0.85,0.85))
def r_flip(sku):
    ks=keys_of(sku);W=Dp=820;H=230;cam=Cam(pitch=34)
    top=paper(art('lid_mai').resize((1000,1000),Image.LANCZOS),3);top=ribbon_v(top,820,64)
    fr=lines_gold(solid(1000,280,REDP,4),ys=(26,248),wd=5);fr=ribbon_v(fr,820,64)
    sd=lines_gold(solid(1000,280,REDP,5),ys=(26,248),wd=5)
    # closed + bag
    CV=canvas();bag(CV,cam,(-920,640,0),'mai',W=560,Dp=200,H=720)
    cuboid(CV,cam,(-W/2,0,0),W,Dp,H,top=top,front=fr,side=sd)
    bx,by=cam.P(-W/2+W*0.82,Dp*0.25,H);bow(CV,bx,by-10,1.0)
    save(CV,sku.lower(),cut=True)
    # open: lid hinged at back, inner face ivory with seal; base 4 compartments foil-lined
    CV=canvas();y1=Dp;th=math.radians(102)
    ly=y1-Dp*math.cos(th);lz=H+Dp*math.sin(th)
    inner=paper(art('lid_ivory').resize((1000,1000),Image.LANCZOS),5)
    warp(CV,solid(1000,1000,tuple(int(v*0.8) for v in REDP),6),face(cam,[(-W/2-6,ly+14,lz+6),(W/2+6,ly+14,lz+6),(W/2+6,y1+10,H),(-W/2-6,y1+10,H)]),0.8)
    warp(CV,inner,face(cam,[(-W/2+10,ly,lz),(W/2-10,ly,lz),(W/2-10,y1,H),(-W/2+10,y1,H)]),0.92)
    F=40;g=26;cs=1000;cells=[];iw=(cs-2*F-g)/2
    for i in range(4):
        m=np.zeros((cs,cs),bool);xa=int(F+(i%2)*(iw+g));ya=int(F+(i//2)*(iw+g));m[ya:int(ya+iw),xa:int(xa+iw)]=True;cells.append(m)
    ct=fill_cells_rect(cs,cs,cells,ks,REDP)
    cuboid(CV,cam,(-W/2,0,0),W,Dp,H,top=ct,front=fr,side=sd)
    save(CV,sku.lower()+'-g2');contents_closeup(f'{AS}/{sku.lower()}-g2.jpg',sku.lower()+'-g3',(0.15,0.42,0.85,0.88))
def r_heart(sku):
    ks=keys_of(sku);cam=Cam(pitch=40);WD=1050
    tray=shape_top('heart',ks,base=(196,36,52));am=tray.split()[-1]
    lid=paper(art('lid_dao').resize((1200,1200),Image.LANCZOS),4);lidm=am.filter(ImageFilter.MaxFilter(15));lid.putalpha(lidm)
    CV=canvas();bag(CV,cam,(-1050,600,0),'dao',W=560,Dp=200,H=720)
    prism(CV,cam,lid.copy(),WD*1.03,70,(150,26,44),z0=130)
    lid2=lid.copy();base=Image.new('RGBA',lid.size,(0,0,0,0));base.putalpha(am)
    save_hero=CV
    # body under lid: draw first then lid -> redo order
    CV=canvas();bag(CV,cam,(-1050,600,0),'dao',W=560,Dp=200,H=720)
    prism(CV,cam,Image.merge('RGBA',(*Image.new('RGB',am.size,(150,26,44)).split(),am)),WD,150,(140,24,40))
    prism(CV,cam,lid,WD*1.03,60,(160,28,46),z0=140)
    save(CV,sku.lower(),cut=True)
    # open: tray + standing lid behind
    CV=canvas();cam=Cam(pitch=46);Dd=WD
    ly0=Dd/2+60;lz1=WD*0.92
    ly0=Dd/2-140;warp(CV,lid,face(cam,[(-WD/2,ly0+300,lz1),(WD/2,ly0+300,lz1),(WD/2,ly0,0),(-WD/2,ly0,0)]),0.95)
    prism(CV,cam,tray,WD,150,(140,24,40))
    clear_inner=tray.split()[-1]
    save(CV,sku.lower()+'-g2');contents_closeup(f'{AS}/{sku.lower()}-g2.jpg',sku.lower()+'-g3',(0.18,0.4,0.82,0.92))
def r_window9(sku):
    ks=keys_of(sku);W=Dp=900;H=190;cam=Cam(pitch=36)
    grid=shape_top('grid33',ks,base=(232,214,170))
    lid=paper(art('lid_ivory').resize((1000,1000),Image.LANCZOS),2)
    win=grid.resize((700,700),Image.LANCZOS)
    # film gloss on window
    a=np.asarray(win).astype(np.float32);y,x=np.mgrid[0:700,0:700];d=(x+y*1.1)/1470
    g=0.08+0.4*np.exp(-((d-0.35)/0.05)**2)+0.2*np.exp(-((d-0.45)/0.02)**2);a[...,:3]=a[...,:3]*(1-g[...,None])+255*g[...,None]
    win=Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
    wl=lid.copy();wl.paste(win,(150,150));ImageDraw.Draw(wl).rectangle((146,146,853,853),outline=GOLD+(255,),width=6)
    sl=SEAL().resize((200,200),Image.LANCZOS);wl.alpha_composite(sl,(730,730))
    fr=lines_gold(solid(1000,220,(236,226,204),4),ys=(22,192),wd=5);sd=lines_gold(solid(1000,220,(226,214,188),5),ys=(22,192),wd=5)
    CV=canvas();bag(CV,cam,(-960,640,0),'ivory',W=560,Dp=200,H=720)
    cuboid(CV,cam,(-W/2,0,0),W,Dp,H,top=wl,front=fr,side=sd);save(CV,sku.lower(),cut=True)
    CV=canvas();cam=Cam(pitch=46)
    warp(CV,lid,face(cam,[(-W/2,Dp+230,W*0.95),(W/2,Dp+230,W*0.95),(W/2,Dp+30,H-20),(-W/2,Dp+30,H-20)]),0.95)
    cuboid(CV,cam,(-W/2,0,0),W,Dp,H,top=grid.resize((1000,1000)),front=fr,side=sd)
    save(CV,sku.lower()+'-g2');contents_closeup(f'{AS}/{sku.lower()}-g2.jpg',sku.lower()+'-g3',(0.2,0.42,0.8,0.9))
def r_jars6(sku):
    ks=keys_of(sku);W,Dp,H=1050,700,170;cam=Cam(pitch=30)
    L={'dautay':'MQZ-DDY-500','xoai':'MQZ-DXO-500','duanon':'MQZ-DDN-500','hatsen':'MQZ-DHS-500'}
    jars=[]
    for k in ks:
        lb=Image.open(f"{D}/labels/{L.get(k,'SEAL')}.png").convert('RGBA')
        jars.append(pack.jar(T(k,900,900),lb,W=620,BH=560,seed=zlib.crc32(k.encode())%50))
    fr=paper(art('band_red').resize((1000,170),Image.LANCZOS),3);sd=lines_gold(solid(700,170,REDP,5),ys=(18,146),wd=4)
    def scene(CV,with_lid,with_bag):
        if with_bag:bag(CV,cam,(-1020,600,0),'mai',W=560,Dp=200,H=720)
        if with_lid:
            lid=paper(art('lid_mai').resize((1000,700),Image.LANCZOS),2)
            warp(CV,lid,face(cam,[(-W/2,Dp+200,Dp*0.95),(W/2,Dp+200,Dp*0.95),(W/2,Dp+20,0),(-W/2,Dp+20,0)]),0.95)
        cuboid(CV,cam,(-W/2,0,0),W,Dp,H,side=sd)
        inner=solid(1000,700,(238,228,206),7,0.0);a=np.asarray(inner).astype(np.float32);y,x=np.mgrid[0:700,0:1000]
        a[...,:3]*=(0.62+0.38*np.clip(np.minimum.reduce([x/120,(1000-x)/120,y/160,(700-y)/40]),0,1))[...,None];inner=Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA')
        warp(CV,inner,face(cam,[(-W/2,Dp,H),(W/2,Dp,H),(W/2,0,H),(-W/2,0,H)]))
        for row in (1,0):
            for col in range(3):
                j=jars[row*3+col];x=-W/2+W*(col+0.5)/3;y=Dp*(0.28+0.46*row)
                p=cam.P(x,y,H-120);p2=cam.P(x+300,y,H-120);s=(p2[0]-p[0])/j.width*0.98
                jj=j.resize((int(j.width*s),int(j.height*s)),Image.LANCZOS)
                sh=Image.new('RGBA',CV.size,(0,0,0,0));ImageDraw.Draw(sh).ellipse((p[0]-jj.width*0.45,p[1]-18,p[0]+jj.width*0.45,p[1]+14),fill=(40,25,10,110));CV.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
                CV.alpha_composite(jj,(int(p[0]-jj.width/2),int(p[1]-jj.height)))
        warp(CV,fr,face(cam,[(-W/2,0,H),(W/2,0,H),(W/2,0,0),(-W/2,0,0)]),0.92)
    CV=canvas();scene(CV,True,True);save(CV,sku.lower(),cut=True)
    CV=canvas();cam=Cam(pitch=30,f=5200);scene(CV,False,False);save(CV,sku.lower()+'-g2')
    contents_closeup(f'{AS}/{sku.lower()}-g2.jpg',sku.lower()+'-g3',(0.12,0.12,0.88,0.75))
def r_basket(sku):
    import render_sets as RS
    RS.LAB=D+'/labels';cap={}
    RS.save=lambda img,s:cap.setdefault('im',img)
    RS.basket(sku,[('xoai','MQZ-DXO-500'),('chanhday','MQZ-DCD-500'),('thom','MQZ-DTH-500'),('dautay','MQZ-DDY-500')])
    bk=cap['im'];bk=bk.crop(bk.getbbox());w,h=bk.size
    save(bk.copy(),sku.lower()+'-g2')
    top=int(h*0.42);CV=Image.new('RGBA',(w+160,h+top),(0,0,0,0));ox=80;CV.alpha_composite(bk,(ox,top))
    gx,gy=ox+w*0.5,top-30
    # cellophane film body
    L=np.zeros((CV.height,CV.width),np.float32);m=Image.new('L',CV.size,0);d=ImageDraw.Draw(m)
    left=[(ox+w*0.01,top+h*0.99)];right=[(ox+w*0.99,top+h*0.99)]
    for t in np.linspace(0,1,40):
        yy=top+h*0.99-(top+h*0.99-gy-40)*t;bul=math.sin(math.pi*min(t*1.25,1))*w*0.06*(1-t*0.6)
        left.append((ox+w*0.01-bul+(gx-ox-w*0.01-30)*t**2.2,yy));right.append((ox+w*0.99+bul-(ox+w*0.99-gx-30)*t**2.2,yy))
    d.polygon(left+right[::-1],fill=255)
    # gathered tail above the bow
    for i in range(9):
        a=math.radians(-150+i*15);d.polygon([(gx-20,gy+10),(gx+math.cos(a)*190,gy+math.sin(a)*220),(gx+math.cos(a+0.12)*170,gy+math.sin(a+0.12)*200),(gx+20,gy+10)],fill=255)
    ma=np.asarray(m).astype(np.float32)/255;yy,xx=np.mgrid[0:CV.height,0:CV.width]
    gl=0.16*ma+0.10*ma*np.clip((gy+420-yy)/300,0,1)
    for cx,wd,a in ((0.16,26,0.45),(0.24,10,0.6),(0.7,30,0.35),(0.8,9,0.55),(0.45,60,0.12)):
        xc=ox+w*cx+(xx*0)+((yy-top)/(h))*w*0.03*np.sign(cx-0.5)
        gl+=a*np.exp(-((xx-xc)/wd)**2)*ma*np.clip((yy-gy-60)/250,0,1)*np.clip((top+h*0.97-yy)/120,0,1)
    crinkle=ndimage.gaussian_filter(np.random.RandomState(4).rand(CV.height//8,CV.width//8),1.2)
    crinkle=np.asarray(Image.fromarray((crinkle*255).astype('uint8')).resize(CV.size,Image.BICUBIC)).astype(np.float32)/255
    gl+=np.clip(crinkle-0.55,0,1)*0.5*ma*(yy<gy+380)
    edge=np.asarray(m.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)/255
    gl+=edge*3.0
    F=np.zeros((CV.height,CV.width,4),np.uint8);F[...,:3]=255;F[...,3]=(np.clip(gl,0,0.85)*255).astype('uint8')
    CV.alpha_composite(Image.fromarray(F,'RGBA'))
    bow(CV,gx,gy+30,1.15)
    tag=Image.new('RGBA',(260,170),(0,0,0,0));td=ImageDraw.Draw(tag);td.rounded_rectangle((0,0,259,169),radius=14,fill=(246,238,220,255),outline=GOLD+(255,),width=5)
    sl=SEAL().resize((120,120),Image.LANCZOS);tag.alpha_composite(sl,(70,25));tag=tag.rotate(12,expand=True,resample=Image.BICUBIC)
    CV.alpha_composite(tag,(int(gx+40),int(gy+150)))
    save(CV,sku.lower(),cut=True)
    contents_closeup(f'{AS}/{sku.lower()}-g2.jpg',sku.lower()+'-g3',(0.1,0.15,0.9,0.7))
def r_tubs(sku):
    contents_closeup(f'{AS}/{sku.lower()}.jpg',sku.lower()+'-g3',(0.15,0.25,0.85,0.8))
R={'tray_hex':lambda s:r_tray(s,'hex',REDP),'tray_sq':lambda s:r_tray(s,'sq',GOLDP),'tray_round':lambda s:r_tray(s,'round',REDP),
   'tray_sq_nuts':lambda s:r_tray(s,'sq',GOLDP),'tray_flower_nuts':lambda s:r_tray(s,'flower5',GOLDP),'tray_flower':lambda s:r_tray(s,'flower',REDP),
   'drawer':r_drawer,'flip':r_flip,'heart':r_heart,'window9':r_window9,'jars6':r_jars6,'basket':r_basket,'tubs':r_tubs}
if __name__=='__main__':
    only=sys.argv[1:]
    for sku,b in B.items():
        if only and not any(o in sku for o in only):continue
        R[b['type']](sku);print(sku,b['type'],flush=True)
def pad_cards():
    for sku in B:
        f=f'{AS}/{sku.lower()}-g4.jpg';im=Image.open(f).convert('RGB');bg=im.getpixel((8,8))
        c=Image.new('RGB',(1200,1500),bg);c.paste(im,(0,150))
        a=np.asarray(c).astype(np.float32);y=np.arange(1500)[:,None,None]
        c=Image.fromarray(a.clip(0,255).astype('uint8'));c.save(f'{AS}/{sku.lower()}-g4-45.jpg',quality=86)
if __name__=='__main__' and 'cards' in sys.argv:pad_cards()
