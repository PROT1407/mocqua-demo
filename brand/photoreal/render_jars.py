import sys,os;sys.path.insert(0,os.path.dirname(__file__));sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','pouch'))
import pack,compose_bg as C
from PIL import Image
LAB=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(__file__),'labels')
T={'DHS':('hatsen',(214,200,160)),'DTL':('thanhlong',None),'DCD':('chanhday',None),'DDY':('dautay',None),'DMC':('mangcau',(214,178,112)),'DGU':('gung',None),
'DXO':('xoai',None),'DDN':('duanon',None),'DTH':('thom',None),'DDD':('dudu',None),'DCA':('cam',None),'DHO':('hong',None),'DKL':('khoailang',None),'DHOE':('hongep',None),
'DOI':('oi',None),'DMI':('mit',None),'DNH':('nhan',None)}
SK=['MQZ-DXO-500','MQZ-DDY-500','MQZ-DCD-500','MQZ-DTL-500','MQZ-DMI-500','MQZ-DNH-500','MQZ-DHO-1000','MQZ-DHOE-500','MQZ-DDN-500','MQZ-DTH-500','MQZ-DDD-500','MQZ-DCA-500','MQZ-DKL-1000','MQZ-DOI-500','MQZ-DMC-500','MQZ-DGU-500','MQZ-DHS-500']
def cut(img,n):
    im=img.copy();im.thumbnail((900,900),Image.LANCZOS);im.save(os.path.join(os.path.dirname(__file__),'..','..','assets','products','mqz','cut',n.split('/')[-1]+'.webp'),quality=86,method=6)
def one(sku,seed):
    k,tint=T[sku.split('-')[1]];big=sku.endswith('1000')
    lab=Image.open(f'{LAB}/{sku}.png').convert('RGBA')
    j=pack.jar(pack.tex(k,900,900,tint=tint),lab,BH=820 if big else 700,seed=seed)
    n='mqz/'+sku.lower()+'-hu';C.compose(j,1200,1200,n);C.compose(j,1200,1500,n+'-45');cut(j,n);return j
if __name__=='__main__':
    for i,s in enumerate(SK):one(s,i+3);print(s)
