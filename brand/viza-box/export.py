import sys,numpy as np
sys.path.insert(0,'/workspace/mocqua/brand/pouch')
from compose_bg import compose,OUT
from PIL import Image,ImageFilter
D='/workspace/mocqua/brand/viza-box'
MAP={'hat-sen':'vzh-sen','hat-de-cuoi':'vzh-decuoi','hat-macca':'vzh-macca','dua-say-gion':'vzh-dua','hat-dieu':'vzh-dieu'}
F={k:Image.open(f'{D}/front_{k}.png') for k in MAP}
def cutwebp(im,name):
    t=im.copy();t.thumbnail((640,640),Image.LANCZOS);t.save(f'{OUT}/cut/{name}.webp',quality=88,method=6)
for k,n in MAP.items():
    compose(F[k],1200,1200,n);compose(F[k],1200,1500,n+'-45');cutwebp(F[k],n)
# group: back row sen / macca / dieu, front row de-cuoi / dua
W,H=2300,1700;G=Image.new('RGBA',(W,H),(0,0,0,0))
def put(k,h,cx,by):
    im=F[k];w=int(im.width*h/im.height);im=im.resize((w,h),Image.LANCZOS)
    x=cx-w//2;y=by-h
    a=Image.new('L',(W,H),0);a.paste(im.split()[-1],(x-18,y+14));a=a.point(lambda v:v*0.30).filter(ImageFilter.GaussianBlur(22))
    sh=Image.new('RGBA',(W,H),(60,45,28,0));sh.putalpha(a);G.alpha_composite(sh);G.alpha_composite(im,(x,y))
put('hat-sen',1080,420,1250);put('hat-macca',1080,1150,1210);put('hat-dieu',1080,1880,1250)
put('hat-de-cuoi',1120,790,1680);put('dua-say-gion',1120,1510,1680)
G=G.crop(G.getbbox());G.save(f'{D}/group.png')
compose(G,1200,1200,'vzh-combo5');compose(G,1200,1500,'vzh-combo5-45');cutwebp(G,'vzh-combo5')
print('ok')
