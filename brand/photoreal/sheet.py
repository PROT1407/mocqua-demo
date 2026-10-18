"""brand/packaging-mocqua.png — Mộc Quả packaging system sheet."""
import os
from PIL import Image,ImageDraw,ImageFont
R=os.path.join(os.path.dirname(__file__),'..','..');F='/usr/share/fonts/truetype/sand-box/google/'
def f(n,s):return ImageFont.truetype(F+n,s)
CG=lambda s:(lambda x:(x.set_variation_by_axes([700]),x)[1])(f('Cormorant Garamond/CormorantGaramond-VariableFont_wght.ttf',s))
BV=lambda s:f('Be Vietnam Pro/BeVietnamPro-Regular.ttf',s);BVS=lambda s:f('Be Vietnam Pro/BeVietnamPro-SemiBold.ttf',s)
W,H=3000,2250;S=Image.new('RGB',(W,H),(251,249,244));d=ImageDraw.Draw(S)
d.rectangle((0,0,W,190),fill=(30,58,47));d.text((90,40),'Mộc Quả · Hệ bao bì hũ, hộp, khay, giỏ',font=CG(78),fill=(232,210,160))
d.text((92,132),'mocqua.com · ảnh dựng ghép: ruột quả là ảnh thật (Wikimedia Commons, xem CREDITS.md), hũ/hộp/khay/giỏ dựng bằng máy (demo)',font=BV(30),fill=(200,214,204))
def tile(path,x,y,w,h,title,sub,cut=True):
    im=Image.open(path).convert('RGBA');im.thumbnail((w,h-130),Image.LANCZOS)
    S.paste(im,(x+(w-im.width)//2,y+(h-130-im.height)//2),im)
    d.text((x+w//2,y+h-112),title,font=BVS(34),fill=(30,58,47),anchor='mt');d.text((x+w//2,y+h-62),sub,font=BV(26),fill=(110,118,110),anchor='mt')
C=R+'/assets/products/mqz/cut/'
L=os.path.join(os.path.dirname(__file__),'labels')+'/'
row1=[(L+'SEAL.png','Tem tròn Mộc Quả','Ø 60 mm · nắp hộp, khay, giỏ'),(L+'MQZ-DXO-500.png','Tem hũ (thân)','Ø 60 mm · loại, tên quả, vị, khối lượng'),
      (C+'mqz-dxo-500-hu.webp','Hũ PET 500g · Xoài cát','nắp vặn xanh rừng, viền vàng'),(C+'mqz-ddy-500-hu.webp','Hũ PET 500g · Dâu tây','mặc định cho 17 vị sấy dẻo'),(C+'mqz-omxd-250.webp','Túi zip đứng · màu theo vị','cửa sổ lớn, 9 màu nhóm quả')]
x=60;y=230;w=(W-120)//5
for p,t,s in row1:tile(p,x,y,w,900,t,s);x+=w
row2=[(C+'mqz-seth3-600.webp','Hộp ngăn kéo + túi','600g · 4 ngăn · hoạ tiết sen'),(C+'mqz-seth4-1000.webp','Hộp nắp gập + túi','1kg · 4 ngăn lót giấy bạc'),
      (C+'mqz-setht-700.webp','Hộp tim 8 ngăn + túi','700g · hoạ tiết hoa đào'),(C+'mqz-setk7-750.webp','Khay nắp trong','lục giác · vuông · tròn · hoa mai'),(C+'mqz-setgio-2500.webp','Giỏ mây bọc màng kính','4 hũ PET · nơ satin')]
x=60;y=1170;w=(W-120)//5
for p,t,s in row2:tile(p,x,y,w,960,t,s);x+=w
d.line((60,1150,W-60,1150),fill=(220,210,190),width=2)
d.text((W//2,H-46),'Bảng màu: xanh rừng #1E3A2F · vàng nhũ #C4A265 · ngà #FBF9F4 · đỏ son #8E1C1E · túi zip theo nhóm quả',font=BV(28),fill=(110,118,110),anchor='mm')
S.save(R+'/brand/packaging-mocqua.png',optimize=True);print(S.size)
