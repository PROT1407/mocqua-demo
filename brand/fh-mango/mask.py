import sys
from rembg import remove,new_session
from PIL import Image
n=sys.argv[1];s=new_session('birefnet-general')
im=Image.open(f'src/{n}.jpg').convert('RGB');sm=im.resize((im.width*2//3,im.height*2//3))
m=remove(sm,session=s,only_mask=True).resize(im.size,Image.BICUBIC);m.save(f'/tmp/fhm_{n}.png');print(n)
