# Generates the Mộc Quả own-label (MQZ) product block for js/data.js from mocqua-own-label-spec.json
import json,re,collections
D=json.load(open('/workspace/mocqua/research/mocqua-own-label-spec.json'))
FMAP={'thanhlongtrang':'thanhlong','khoailangvang':'khoailang','khoailangtim':'khoailang','ximuoitrang':'ximuoi','mixdeo':'mix'}
TASTE={'deo':dict(ngot=4,chua=2,deo=4,gion=0),'thanghoa':dict(ngot=4,chua=1,deo=0,gion=5),'gion':dict(ngot=3,chua=0,deo=0,gion=5),'kho':dict(ngot=5,chua=0,deo=3,gion=0),'omai':dict(ngot=3,chua=4,deo=3,gion=0),'set':dict(ngot=4,chua=2,deo=3,gion=2)}
RANK={'mqz-sau-rieng-ri6-thang-hoa':(2,'Mới · Mộc Quả'),'mqz-xoai-say-deo':(4,None),'mqz-mit-say-gion':(6,'Giá tốt'),'mqz-xi-muoi-dac-biet':(8,None),'mqz-dau-tay-say-deo':(10,None),'mqz-thanh-long-thang-hoa':(12,None),
 'mqz-hop-qua-hat':(14,'Quà Tết'),'mqz-chanh-day-say-deo':(16,None),'mqz-khay-mut-7-vi':(18,'Quà Tết'),'mqz-xoai-thang-hoa':(20,None),'mqz-chum-ruot-muoi-ot':(22,None),'mqz-dua-non-say-deo':(24,None),
 'mqz-thap-cam-say-gion':(26,'Giá tốt'),'mqz-gio-qua-viet':(28,'Quà biếu'),'mqz-hong-say-deo':(30,None),'mqz-nhan-say-deo':(32,None)}
G=collections.OrderedDict()
for s in D['spec']: G.setdefault(s['pid'],[]).append(s)
def keep(t): return 'độ giòn xốp' if t in('gion','thanghoa') else 'độ dẻo và hương thơm'
out=[]
for i,(pid,vs) in enumerate(G.items()):
    h=vs[0];cat=h['cat'];fr=FMAP.get(h['fruit'],h['fruit'])
    rank,badge=RANK.get(pid,(40+i,None))
    vv=[]
    for s in vs:
        v=s['variant'];w=v if '·' in v else v
        vv.append(f"V('{s['sku']}',{json.dumps(w,ensure_ascii=False)},{s['g']},'mq',{s['price']},'mqz/{s['sku'].lower()}')")
    pack=('Set quà Mộc Quả gồm các túi zip nhãn Mộc Quả, kèm túi xách & thiệp (demo).' if cat=='set' else f'Đóng túi zip đứng Mộc Quả (mocqua.com) có cửa sổ nhìn rõ sản phẩm, khoá zip giữ {keep(cat)} sau khi mở.')
    o=dict(id=pid,name=h['name'],cat=cat,fruit=fr,flavour=h['flavour'],maker='mocqua',own=True,rank=rank)
    if badge:o['badge']=badge
    js='{'+','.join(f"{k}:{json.dumps(v,ensure_ascii=False)}" for k,v in o.items())+f",\n  variants:[{','.join(vv)}],\n  taste:{json.dumps(TASTE[cat])},\n  short:{json.dumps(h['short'],ensure_ascii=False)},\n  long:{json.dumps(h['short']+' '+pack,ensure_ascii=False)}}}"
    out.append(' '+js)
block='/* ==== MQZ-BEGIN: dòng Mộc Quả (mocqua.com) — sinh tự động bởi research/gen_data.py; giá tham khảo (demo) ==== */\n'+',\n'.join(out)+',\n/* ==== MQZ-END ==== */'
p='/workspace/mocqua/js/data.js';s=open(p,encoding='utf-8').read()
if 'MQZ-BEGIN' in s: s=re.sub(r'/\* ==== MQZ-BEGIN.*?MQZ-END ==== \*/',lambda m:block,s,flags=re.S)
else:
    a=s.index(' /* ---- Sắp ra mắt: Mộc Quả tuyển chọn');b=s.index(' /* ---- Sắp ra mắt: ngành hàng khác')
    s=s[:a]+block+'\n'+s[b:]
open(p,'w',encoding='utf-8').write(s)
print(len(G),'products',sum(len(v) for v in G.values()),'skus')
