import sys
from rembg import remove,new_session
from PIL import Image
n=sys.argv[1];s=new_session('birefnet-general')
im=Image.open(f'src/{n}.jpg').convert('RGB')
remove(im,session=s,only_mask=True).save(f'/tmp/chm_{n}.png');print(n)
