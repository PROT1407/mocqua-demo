import sys,os;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import render_boxes as RB,pack
from render_jars import T,SK
from PIL import Image
for i,s in enumerate(SK):
    k,tint=T[s.split('-')[1]];big=s.endswith('1000')
    lab=Image.open(f'{RB.D}/labels/{s}.png').convert('RGBA')
    RB.square(s,pack.tex(k,900,900,tint=tint),lab,W=700 if big else 640,Dp=700 if big else 640,H=330 if big else 250);print(s,flush=True)
