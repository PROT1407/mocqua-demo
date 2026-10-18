# Tách 2 túi trong ảnh dayxanh2 (túi nhỏ đứng trước, túi lớn phía sau) và vá phần bị khung ảnh cắt / bị che.
import numpy as np
from PIL import Image
from scipy import ndimage
im=np.asarray(Image.open('src/dayxanh2.jpg').convert('RGB')).astype(np.float32)
m=np.asarray(Image.open('/tmp/fhm_dayxanh2.png').convert('L')).astype(np.float32)
H,W=m.shape;PL,PR=150,24
A=np.zeros((H,W+PL+PR,3),np.float32);A[:,PL:PL+W]=im;M=np.zeros((H,W+PL+PR),np.float32);M[:,PL:PL+W]=m
L=im.mean(2)
# ranh giới phải của túi nhỏ (cạnh dọc) theo từng hàng
STOP=605
bd=np.full(H,595.0)
for y in range(STOP,1470):
    d=np.abs(np.diff(ndimage.uniform_filter1d(L[y,560:640],3)));bd[y]=560+np.argmax(d)
bd=ndimage.median_filter(bd,41);bd[:STOP]=595
def soft_vblur(col,s=6):return ndimage.gaussian_filter1d(col,s,axis=0)
# ---- túi nhỏ ----
S_A=A.copy();S_M=np.zeros_like(M)
for y in range(STOP,H):
    x1=int(bd[y])+PL; S_M[y,:x1]=M[y,:x1]
# cạnh trái: đường thẳng nội suy từ mép trái nhìn thấy (y1300→47, y1440→83)
top=int(np.median([np.argmax(m[:,x]>128) for x in range(60,500)]))+3
slope=(83-47)/(1440-1300)
src=soft_vblur(A[:,PL+3:PL+4].copy(),4)[:,0]
for y in range(top,1300):
    e=int(round(47-slope*(1300-y)))
    if e<0:
        ex=PL+e;S_A[y,ex:PL+3]=src[y];S_M[y,ex:PL+3]=255
        # bóng nhẹ dọc mép túi (nếp hàn)
        for k in range(10):S_A[y,ex+k]*=0.93+0.007*k
S_M[:top]=0
for k in range(6):S_A[top+k]*=0.94+0.01*k
S_M[:top+22,PL+560:]=0
Image.fromarray(np.dstack([S_A,S_M]).clip(0,255).astype(np.uint8),'RGBA').save('/tmp/fh_small.png')
# ---- túi lớn ----
B_A=A.copy();B_M=M.copy()
for y in range(STOP,H): B_M[y,:int(bd[y])+PL+2]=0
# mép trái túi lớn bị túi nhỏ che ~40px: cắt thẳng mép trái theo đường ranh giới (không bịa thêm hình), rồi đổ bóng nếp hàn nhẹ
EDGE=int(np.median(bd[STOP:1300]))+PL+3
B_M[:,:EDGE]=0
for k in range(10):B_A[:,EDGE+k]*=0.92+0.008*k
B_M[:,EDGE:EDGE+3]*=np.array([0.35,0.7,0.9])[None,:]
# góc trên phải bị khung cắt
for y in range(130,760):
    e=int(min(1514,1433+0.267*(1000-y)))
    if e>=W-1 and M[y,PL+W-2]>128:
        c=ndimage.gaussian_filter1d(A[:,PL+W-3],4,axis=0)[y];B_A[y,PL+W-1:PL+e]=c;B_M[y,PL+W-1:PL+e]=255
        for k in range(8):B_A[y,PL+e-1-k]*=0.94+0.0075*k
lab,n=ndimage.label(B_M>128);sz=ndimage.sum(B_M>128,lab,range(1,n+1));B_M=np.where(lab==np.argmax(sz)+1,B_M,0)
Image.fromarray(np.dstack([B_A,B_M]).clip(0,255).astype(np.uint8),'RGBA').save('/tmp/fh_large.png')
print('ok',top)
