"""Photoreal-composite set renders: combo jars with handles, rigid gift boxes, lacquer trays, wicker baskets."""
import sys,os,math,random;sys.path.insert(0,os.path.dirname(__file__));sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','pouch'))
import numpy as np,pack,compose_bg as C
from PIL import Image,ImageDraw,ImageFilter,ImageOps,ImageEnhance
LAB=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(__file__),'labels')
TX={'me':('hongep',(120,70,40)),'dautam':('dautay',(95,28,55)),'taodo':('hong',(150,45,32)),'vobuoi':('gung',(214,186,92)),'hatsen':('hatsen',(214,200,160)),
    'mangcau':('mangcau',(214,178,112)),'duanon':('duanon',None),'dnla':('duanon',(150,190,110)),'dncf':('duanon',(140,95,60)),'dnkm':('duanon',(170,140,190))}
def T(k,w,h):
    a,t=TX.get(k,(k,None));return pack.tex(a,w,h,tint=t)
def lab(k):return Image.open(f'{LAB}/{k}.png').convert('RGBA')
def mo(im):
    """muối ớt: warmer + chili flakes"""
    a=np.asarray(im).astype(float)*np.array([1.05,0.9,0.8]);return pack.chili(Image.fromarray(a.clip(0,255).astype('uint8')),n=520)
def strata(keys,w,h,seed=2):
    r=np.random.RandomState(seed);out=Image.new('RGB',(w,h));n=len(keys);xx=np.arange(w)
    bounds=[0]+[int(h*(i+1)/n) for i in range(n-1)]+[h]
    base=np.zeros((h,w,3),np.float32);Y=np.arange(h)[:,None]
    for i,k in enumerate(keys):
        t=np.asarray(T(k,w,h)).astype(np.float32)
        if i==0:base[:]=t;continue
        edge=bounds[i]+np.convolve(r.randn(w+80),np.ones(80)/80,'same')[40:40+w]*120+14*np.sin(xx/w*6.28*r.uniform(.8,1.6))
        m=np.clip((Y-edge[None,:])/3,0,1)[...,None];base=base*(1-m)+t*m
    return Image.fromarray(base.clip(0,255).astype('uint8'))
def row(items,gap=-30,align='bottom'):
    H=max(i.height for i in items);W=sum(i.width for i in items)+gap*(len(items)-1)
    c=Image.new('RGBA',(W,H),(0,0,0,0));x=0
    for i in items:c.alpha_composite(i,(x,H-i.height));x+=i.width+gap
    return c
def save(img,sku):
    n='mqz/'+sku.lower();C.compose(img,1200,1200,n);C.compose(img,1200,1500,n+'-45')
    im=img.copy();im.thumbnail((900,900),Image.LANCZOS);im.save(os.path.join(os.path.dirname(__file__),'..','..','assets','products','mqz','cut',sku.lower()+'.webp'),quality=86,method=6)
# ---------- combos ----------
def combo(sku,a,b,la,lb):
    j1=pack.jar(a,lab(la),handle=True,seed=5);j2=pack.jar(b,lab(lb),handle=True,seed=9)
    save(row([j1,j2],gap=40),sku)
# ---------- rigid gift box ----------
def persp_coeffs(src,dst):
    A=[];B=[]
    for (x,y),(u,v) in zip(dst,src):
        A+=[[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]];B+=[u,v]
    return np.linalg.solve(np.array(A,float),np.array(B,float)).tolist()
def cell(img,w,h,depth=0.45):
    a=np.asarray(img.resize((w,h),Image.LANCZOS)).astype(np.float32)
    y,x=np.mgrid[0:h,0:w];d=np.minimum.reduce([x/w,(w-x)/w,y/h,(h-y)/h])
    sh=np.clip(0.55+depth*np.sqrt(np.clip(d*6,0,1)),0,1)*(0.9+0.12*(y/h))
    return Image.fromarray((a*sh[...,None]).clip(0,255).astype('uint8'))
def lacquer(w,h,col,seed=1):
    y,x=np.mgrid[0:h,0:w];g=0.78+0.32*np.exp(-(((x-w*0.3)/w)**2*2+((y-h*0.2)/h)**2*3))
    a=np.asarray(col)[None,None,:]*g[...,None];n=np.random.RandomState(seed).randn(h,w,1)*3
    return Image.fromarray((a+n).clip(0,255).astype('uint8'))
GOLD=(196,162,101);GRN=(30,58,47);RED=(128,26,24)
def box(sku,keys,cols,rows,lid_label):
    W,H=1200,int(1200*rows/cols*0.9) if cols>rows else 900;F=46;div=10
    top=lacquer(W,H,GRN).convert('RGB');d=ImageDraw.Draw(top)
    d.rectangle((F-8,F-8,W-F+7,H-F+7),fill=(238,226,196))
    iw=(W-2*F-div*(cols-1))//cols;ih=(H-2*F-div*(rows-1))//rows
    for i,k in enumerate(keys):
        cx=F+(i%cols)*(iw+div);cy=F+(i//cols)*(ih+div);top.paste(cell(T(k,iw,ih),iw,ih),(cx,cy))
    d.rectangle((F-8,F-8,W-F+7,H-F+7),outline=GOLD,width=4)
    for c in range(1,cols):x=F+c*(iw+div)-div;d.rectangle((x,F,x+div-1,H-F),fill=(232,214,170));d.line((x,F,x,H-F),fill=(170,140,85),width=2)
    for r_ in range(1,rows):y=F+r_*(ih+div)-div;d.rectangle((F,y,W-F,y+div-1),fill=(232,214,170));d.line((F,y,W-F,y),fill=(170,140,85),width=2)
    # perspective: top narrower, height squashed
    sq=0.58;ins=0.10;TW=W;TH=int(H*sq)
    dst=[(TW*ins,0),(TW*(1-ins),0),(TW,TH),(0,TH)];src=[(0,0),(W,0),(W,H),(0,H)]
    tp=top.convert('RGBA').transform((TW,TH),Image.PERSPECTIVE,persp_coeffs(src,dst),Image.BICUBIC)
    m=Image.new('L',(TW,TH),0);ImageDraw.Draw(m).polygon(dst,fill=255);tp.putalpha(m)
    FH=230;CV=Image.new('RGBA',(TW+40,TH+FH+520),(0,0,0,0));ox=20;oy=500
    # lid leaning behind
    LW=int(TW*(1-2*ins)*1.04);LH=560;lid=lacquer(LW,LH,GRN,3).convert('RGBA');ld=ImageDraw.Draw(lid)
    ld.rectangle((22,22,LW-23,LH-23),outline=GOLD,width=5);ld.rectangle((34,34,LW-35,LH-35),outline=(160,130,80),width=2)
    sl=lab(lid_label).resize((330,330),Image.LANCZOS);lid.alpha_composite(sl,((LW-330)//2,60))
    lid=lid.rotate(0,expand=True);CV.alpha_composite(lid,(ox+(TW-LW)//2,oy-LH+90))
    # back-edge shadow on lid
    sh=Image.new('RGBA',CV.size,(0,0,0,0));ImageDraw.Draw(sh).rectangle((ox+(TW-LW)//2,oy+40,ox+(TW+LW)//2,oy+90),fill=(0,0,0,120));CV.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    CV.alpha_composite(tp,(ox,oy))
    # front wall
    fw=lacquer(TW,FH,tuple(int(c*0.86) for c in GRN),5).convert('RGBA');fd=ImageDraw.Draw(fw)
    fd.line((0,2,TW,2),fill=(90,130,110),width=3);fd.rectangle((0,FH-34,TW,FH-28),fill=GOLD);fd.rectangle((0,24,TW,29),fill=GOLD)
    ft=Image.new('L',(TW,FH),0);fdd=ImageDraw.Draw(ft)
    seal=lab('SEAL').resize((150,150),Image.LANCZOS);fw.alpha_composite(seal,((TW-150)//2,(FH-150)//2-2))
    CV.alpha_composite(fw,(ox,oy+TH))
    save(CV.crop(CV.getbbox()),sku)
# ---------- lacquer tray ----------
def tray(sku,center,ring,lid_label):
    S=1300;R=600;c=S//2;r0=int(R*0.36)
    img=Image.new('RGBA',(S,S),(0,0,0,0));y,x=np.mgrid[0:S,0:S];dx,dy=x-c,y-c;rr=np.hypot(dx,dy);ang=(np.degrees(np.arctan2(dy,dx))+90)%360
    out=np.zeros((S,S,4),np.float32);lq=np.asarray(lacquer(S,S,RED,7)).astype(np.float32)
    out[...,:3]=lq;out[...,3]=(rr<R)*255
    n=len(ring);inner=R-48
    tc=np.asarray(T(center,2*r0,2*r0)).astype(np.float32)
    m=(rr<r0-8);ys,xs=np.where(m);out[ys,xs,:3]=tc[ys-(c-r0),xs-(c-r0)]*(0.6+0.4*np.clip((r0-8-rr[ys,xs])/60,0,1))[:,None]
    for i,k in enumerate(ring):
        t=np.asarray(T(k,S,S)).astype(np.float32);a0=360/n*i;a1=a0+360/n
        mk=(rr>r0+8)&(rr<inner)&(ang>a0+1.2)&(ang<a1-1.2);ys,xs=np.where(mk)
        edge=np.minimum.reduce([(rr[ys,xs]-r0-8)/50,(inner-rr[ys,xs])/50,np.radians(ang[ys,xs]-a0-1.2)*rr[ys,xs]/50,np.radians(a1-1.2-ang[ys,xs])*rr[ys,xs]/50])
        out[ys,xs,:3]=t[ys,xs]*(0.58+0.42*np.clip(edge,0,1))[:,None]
    im=Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA');d=ImageDraw.Draw(im)
    for k_ in range(n):
        a=math.radians(360/n*k_-90);d.line((c+r0*math.cos(a),c+r0*math.sin(a),c+inner*math.cos(a),c+inner*math.sin(a)),fill=GOLD,width=9)
    d.ellipse((c-r0,c-r0,c+r0,c+r0),outline=GOLD,width=9);d.ellipse((c-inner,c-inner,c+inner,c+inner),outline=GOLD,width=8);d.ellipse((c-R+6,c-R+6,c+R-6,c+R-6),outline=(220,190,130),width=5)
    sq=0.56;TH=int(S*sq);top=im.resize((S,TH),Image.LANCZOS)
    # extrusion
    side=Image.new('RGBA',(S,TH+70),(0,0,0,0));sd=ImageDraw.Draw(side)
    for k_ in range(70,0,-1):sd.ellipse((c-R,TH//2-R*sq+k_,c+R,TH//2+R*sq+k_),fill=(int(80+k_*0.3),14,14,255))
    sd.ellipse((c-R,TH//2-R*sq+66,c+R,TH//2+R*sq+66),outline=GOLD,width=6)
    CV=Image.new('RGBA',(S,TH+70+620),(0,0,0,0));oy=600
    # lid leaning behind
    LW=int(R*1.7);lid=Image.new('RGBA',(LW,LW),(0,0,0,0));ll=Image.fromarray(np.asarray(lacquer(LW,LW,RED,9))).convert('RGBA');mk=Image.new('L',(LW,LW),0);ImageDraw.Draw(mk).ellipse((0,0,LW-1,LW-1),fill=255);lid.paste(ll,(0,0),mk)
    ld=ImageDraw.Draw(lid);ld.ellipse((18,18,LW-19,LW-19),outline=GOLD,width=7);ld.ellipse((40,40,LW-41,LW-41),outline=(170,130,70),width=2)
    sl=lab(lid_label).resize((int(LW*0.56),)*2,Image.LANCZOS);lid.alpha_composite(sl,((LW-sl.width)//2,(LW-sl.height)//2))
    lid=lid.resize((LW,int(LW*0.94)));CV.alpha_composite(lid,((S-LW)//2,oy-lid.height+int(TH*0.45)))
    CV.alpha_composite(side,(0,oy));CV.alpha_composite(top,(0,oy))
    save(CV.crop(CV.getbbox()),sku)
# ---------- wicker basket ----------
def basket(sku,jars):
    items=[pack.jar(T(k,900,900) if k!='thom' else pack.tex('thomring',900,900),lab(l),BH=640,seed=i+11) for i,(k,l) in enumerate(jars)]
    sc=0.55 if len(items)>3 else 0.66
    items=[i.resize((int(i.width*sc),int(i.height*sc)),Image.LANCZOS) for i in items]
    back=row(items,gap=-18)
    BW=back.width+200;BH=380
    CV=Image.new('RGBA',(BW+60,BH+back.height+560),(0,0,0,0));base=CV.height-BH-10;rimy=base+46
    hm=Image.new('L',CV.size,0);hh=back.height+420
    ImageDraw.Draw(hm).arc((120,rimy-hh,BW-60,rimy+hh),180,360,fill=255,width=54)
    hl=Image.new('RGBA',CV.size,(0,0,0,0));hl.paste(ImageEnhance.Brightness(pack.tex('wicker',CV.width,CV.height)).enhance(0.85).convert('RGBA'),(0,0),hm);CV.alpha_composite(hl)
    CV.alpha_composite(back,((CV.width-back.width)//2,base-int(back.height*0.62)))
    # basket body (trapezoid, wider at top)
    body=pack.tex('wicker',BW+60,BH).convert('RGBA');bm=Image.new('L',body.size,0);bd=ImageDraw.Draw(bm)
    bd.polygon([(0,40),(BW+60,40),(BW-30,BH),(90,BH)],fill=255)
    a=np.asarray(body).astype(np.float32);xx=np.linspace(-1,1,body.width);a[...,:3]*=(0.6+0.45*np.sqrt(np.clip(1-xx**2,0,1)))[None,:,None];body=Image.fromarray(a.clip(0,255).astype('uint8'),'RGBA');body.putalpha(bm)
    rim=Image.new('RGBA',body.size,(0,0,0,0));rd=ImageDraw.Draw(rim);rd.rounded_rectangle((0,18,BW+60,74),radius=28,fill=(150,108,58,255));rim.putalpha(Image.eval(rim.split()[-1],lambda v:v))
    rimt=pack.tex('wicker',BW+60,BH).convert('RGBA');rimt=ImageEnhance.Brightness(rimt).enhance(1.1);rm=rim.split()[-1];rimt.putalpha(rm)
    CV.alpha_composite(body,(0,base));CV.alpha_composite(rimt,(0,base))
    # ribbon + tag
    rb=Image.new('RGBA',CV.size,(0,0,0,0));r=ImageDraw.Draw(rb);cx,cy=170,base+40
    r.polygon([(cx,cy),(cx-110,cy-70),(cx-120,cy+60)],fill=(158,30,36,255));r.polygon([(cx,cy),(cx+110,cy-70),(cx+120,cy+60)],fill=(140,24,30,255))
    r.polygon([(cx-10,cy),(cx-60,cy+170),(cx-20,cy+160)],fill=(150,28,34,255));r.polygon([(cx+10,cy),(cx+60,cy+170),(cx+25,cy+165)],fill=(130,22,28,255));r.ellipse((cx-26,cy-24,cx+26,cy+24),fill=(176,40,46,255))
    CV.alpha_composite(rb.filter(ImageFilter.GaussianBlur(0.8)))
    seal=lab('SEAL').resize((210,210),Image.LANCZOS);CV.alpha_composite(seal,((CV.width-210)//2,base+150))
    save(CV.crop(CV.getbbox()),sku)
if __name__=='__main__':
    only=sys.argv[2:] 
    def go(s):return not only or s in only
    if go('SETTH'):combo('MQZ-SETTH-1000',pack.tex('thomring',900,900),mo(pack.tex('thomring',900,900)),'TH-MOC','TH-MO')
    if go('SETMO'):combo('MQZ-SETMO-1000',mo(pack.tex('thomring',900,900)),mo(T('mangcau',900,900)),'TH-MO','MC-MO')
    if go('SET12'):combo('MQZ-SET12-1700',strata(['xoai','dautay','thanhlong','cam','thom','dudu'],900,900),strata(['chanhday','gung','duanon','oi','mit','nhan'],900,900,5),'MQZ-SET12-1700','MQZ-SET12-1700')
    if go('SETDN'):combo('MQZ-SETDN-1200',strata(['duanon','dnla'],900,900),strata(['dncf','dnkm'],900,900,7),'MQZ-SETDN-1200','MQZ-SETDN-1200')
    if go('SET9'):box('MQZ-SET9-980',['me','dautam','taodo','xoai','thanhlong','cam','thom','gung','chanhday'],3,3,'MQZ-SET9-980')
    if go('SETH4'):box('MQZ-SETH4-1000',['mixnuts','hatsen','xoai','dautay'],2,2,'MQZ-SETH4-1000')
    if go('SETH3'):box('MQZ-SETH3-600',['mixnuts','xoai','dautay'],3,1,'MQZ-SETH3-600')
    if go('SETK7'):tray('MQZ-SETK7-750','duanon',['xoai','vobuoi','dudu','gung','thom','chanhday'],'MQZ-SETK7-750')
    if go('SETK5'):tray('MQZ-SETK5-500','dautay',['chanhday','gung','cam','duanon'],'MQZ-SETK5-500')
    if go('SETGIO'):basket('MQZ-SETGIO-2500',[('xoai','MQZ-DXO-500'),('chanhday','MQZ-DCD-500'),('thom','MQZ-DTH-500'),('dautay','MQZ-DDY-500')])
    if go('SETG6'):basket('MQZ-SETG6-650',[('xoai','MQZ-DXO-500'),('thom','MQZ-DTH-500'),('vobuoi','MQZ-SETG6-650')])
