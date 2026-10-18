import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import render_boxes as RB,pack
from PIL import Image
L=lambda s:Image.open(f'{RB.D}/labels/{s}.png').convert('RGBA')
for s,k,t in [('MQZ-DCO-500','mo',(184,160,52)),('MQZ-DVB-500','voboi',None),('MQZ-DCC-500','cachua',None),('MQZ-DTA-500','tao',None)]:
    RB.octa(s,pack.tex(k,1100,1100,tint=t),L(s),name=s.lower()+'-hb');print(s,flush=True)
RB.hong_window('MQZ-DHT-1000',pack.tex('hongep',900,900));RB.hong_carton('MQZ-DHV-1000',pack.tex('hongep',900,900));print('hong')
