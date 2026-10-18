"""Step 2 (venv python): composite photoreal pouches -> assets/products/mqz/<sku>.jpg, -45.jpg, cut/<sku>.webp"""
import sys,os,zlib;D=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,D);sys.path.insert(0,D+'/../pouch')
import pack,pouch2,compose_bg as C
from pouch_map import M
from PIL import Image,ImageEnhance
only=sys.argv[1:]
for sku,(tx,tint,fam,chili,br) in M.items():
    if only and sku not in only:continue
    f=pack.tex(tx,900,900,tint=tint)
    if br!=1:f=ImageEnhance.Brightness(f).enhance(br)
    if chili:f=pack.chili(f,n=700,seed=zlib.crc32(sku.encode())%99)
    pr=Image.open(f'{D}/labels/pouch/{sku}.png')
    im,_=pouch2.render(f,pr,fam,seed=zlib.crc32(sku.encode())%997)
    n='mqz/'+sku.lower();C.compose(im,1200,1200,n);C.compose(im,1200,1500,n+'-45')
    c=im.copy();c.thumbnail((900,900),Image.LANCZOS);c.save(f'{D}/../../assets/products/mqz/cut/{sku.lower()}.webp',quality=86,method=6)
    print(sku,flush=True)
