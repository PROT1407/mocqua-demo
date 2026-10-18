# Generates the Mộc Quả own-label (MQZ) product block for js/data.js from mocqua-own-label-spec.json
import json,re,collections,descriptions as DS
D=json.load(open('/workspace/mocqua/research/mocqua-own-label-spec.json'))
FMAP={'thanhlongtrang':'thanhlong','khoailangvang':'khoailang','khoailangtim':'khoailang','ximuoitrang':'ximuoi','mixdeo':'mix'}
TASTE={'deo':dict(ngot=4,chua=2,deo=4,gion=0),'thanghoa':dict(ngot=4,chua=1,deo=0,gion=5),'gion':dict(ngot=3,chua=0,deo=0,gion=5),'kho':dict(ngot=5,chua=0,deo=3,gion=0),'omai':dict(ngot=3,chua=4,deo=3,gion=0),'set':dict(ngot=4,chua=2,deo=3,gion=2)}
RANK={'mqz-sau-rieng-ri6-thang-hoa':(2,'Mới · Mộc Quả'),'mqz-xoai-say-deo':(4,None),'mqz-mit-say-gion':(6,'Giá tốt'),'mqz-xi-muoi-dac-biet':(8,None),'mqz-dau-tay-say-deo':(10,None),'mqz-thanh-long-thang-hoa':(12,None),
 'mqz-hop-qua-hat':(14,'Quà Tết'),'mqz-chanh-day-say-deo':(16,None),'mqz-khay-mut-7-vi':(18,'Quà Tết'),'mqz-xoai-thang-hoa':(20,None),'mqz-chum-ruot-muoi-ot':(22,None),'mqz-dua-non-say-deo':(24,None),
 'mqz-thap-cam-say-gion':(26,'Giá tốt'),'mqz-gio-qua-viet':(28,'Quà biếu'),'mqz-hong-say-deo':(30,None),'mqz-nhan-say-deo':(32,None)}
JAR='Combo 2 hũ PET trong có quai xách, nắp xanh viền vàng, tem tròn Mộc Quả; kèm túi xách & thiệp.'
BOX='Hộp quà cứng xanh rừng nhiều ngăn, nắp in tem tròn Mộc Quả nhũ vàng; kèm túi xách & thiệp.'
TRAY='Khay sơn mài đỏ viền vàng nhiều ngăn, nắp tròn in tem Mộc Quả; kèm túi xách & thiệp.'
BASK='Giỏ mây đan thắt nơ đỏ, xếp các hũ PET tem tròn Mộc Quả; kèm thiệp.'
SETPACK={'mqz-hop-9-vi':BOX,'mqz-hop-qua-hat':BOX,'mqz-bo-12-vi-mut':JAR,'mqz-doi-thom-say':JAR,'mqz-bo-mut-dua-non':JAR,'mqz-doi-mut-muoi-ot':JAR,'mqz-khay-mut-7-vi':TRAY,'mqz-khay-mut-5-vi':TRAY,'mqz-gio-qua-viet':BASK,'mqz-gio-mut-6-vi':BASK}
GB=json.load(open('/workspace/mocqua/research/mocqua-giftboxes.json'))['boxes']
GBP={b['pid']:(k,b) for k,b in GB.items()}
RANK.update({'mqz-hong-treo-say-gio':(25,'Mới · Quà biếu'),'mqz-coc-non-say-deo':(27,'Mới'),'mqz-vo-buoi-say-deo':(29,'Mới'),'mqz-hop-tim-8-vi':(13,'Mới · Tết 2027'),'mqz-hop-ngan-keo-600':(15,'Quà Tết'),'mqz-hop-6-hu-mini':(17,'Mới'),'mqz-khay-hat-hoa-mai':(19,'Mới'),'mqz-hop-hat-5-vi':(21,'Mới'),'mqz-khay-6-mon-qua-say':(23,'Mới')})
G=collections.OrderedDict()
for s in D['spec']: G.setdefault(s['pid'],[]).append(s)
def keep(t): return 'độ giòn xốp' if t in('gion','thanghoa') else 'độ dẻo và hương thơm'
out=[]
for i,(pid,vs) in enumerate(G.items()):
    h=vs[0];cat=h['cat'];fr=FMAP.get(h['fruit'],h['fruit'])
    rank,badge=RANK.get(pid,(40+i,None))
    vv=[];zz=[]
    for s in vs:
        v=s['variant'];w=v if '·' in v else v
        if cat=='deo' and s.get('box') in('hongwin','hongcarton'):
            vv.append(f"V('{s['sku']}',{json.dumps(w,ensure_ascii=False)},{s['g']},'mq',{s['price']},'mqz/{s['sku'].lower()}')")
        elif cat=='deo':
            ww=w.replace(' · ',' ');bx={'octa':('HB','Hộp bát giác'),'square':('HV','Hộp vuông PET')}.get(s.get('box'),('HU','Hũ PET'))
            vv.append(f"V('{s['sku']}-{bx[0]}',{json.dumps(bx[1]+' · '+ww,ensure_ascii=False)},{s['g']},'mq',{s['price']},'mqz/{s['sku'].lower()}-{bx[0].lower()}')")
            zz.append(f"V('{s['sku']}',{json.dumps('Túi zip · '+ww,ensure_ascii=False)},{s['g']},'mq',{s['price_zip']},'mqz/{s['sku'].lower()}')")
        else:
            vv.append(f"V('{s['sku']}',{json.dumps(w,ensure_ascii=False)},{s['g']},'mq',{s['price']},'mqz/{s['sku'].lower()}')")
    vv+=zz
    pack=(SETPACK.get(pid,'Set quà Mộc Quả.') if cat=='set' else ('Có 2 lựa chọn đóng gói: '+('Hộp bát giác' if h.get('box')=='octa' else 'Hộp vuông')+' nhựa PET trong, tem tròn Mộc Quả — đẹp để biếu, đậy kín sau mỗi lần dùng; hoặc Túi zip đứng refill, giá mềm hơn.' if h.get('box') in('octa','square') else 'Hộp quà Mộc Quả có cửa sổ nhìn rõ quả, kèm túi xách.') if cat=='deo' else None) or ('Set quà Mộc Quả gồm các túi zip nhãn Mộc Quả, kèm túi xách & thiệp (demo).' if cat=='set' else f'Đóng túi zip đứng Mộc Quả (mocqua.com) có cửa sổ nhìn rõ sản phẩm, khoá zip giữ {keep(cat)} sau khi mở.')
    o=dict(id=pid,name=h['name'],cat=cat,fruit=fr,flavour=h['flavour'],maker='mocqua',own=True,rank=rank)
    if not badge and h.get('pct',0)>=8: badge='Giá tốt'
    if badge:o['badge']=badge
    if cat=='set' and pid in GBP:
        k,b=GBP[pid];pack=b['pack'];o['pack']=pack;o['box']=b['type']
        o['contents']=[[c[0],c[1]] for c in b['contents']];o['occ']=b['occ']
        o['gallery']=['products/mqz/'+k.lower()+x for x in (('','-g3','-g4') if b['type']=='tubs' else ('','-g2','-g3','-g4'))]
    elif cat=='set':o['pack']=SETPACK.get(pid)
    if h.get('box') in('hongwin','hongcarton'):o['giftbox']=True;o['pack']=pack
    o['desc']=DS.build(pid,vs,cat,gb=(dict(GBP[pid][1],sku=GBP[pid][0]) if pid in GBP else None),name=h['name'])
    js='{'+','.join(f"{k}:{json.dumps(v,ensure_ascii=False)}" for k,v in o.items())+f",\n  variants:[{','.join(vv)}],\n  taste:{json.dumps(TASTE[cat])},\n  short:{json.dumps(h['short'],ensure_ascii=False)},\n  long:{json.dumps(h['short']+' '+pack,ensure_ascii=False)}}}"
    out.append(' '+js)
block='/* ==== MQZ-BEGIN: dòng Mộc Quả (mocqua.com) — sinh tự động bởi research/gen_data.py; giá theo quy tắc research/pricing.py (rẻ hơn 4–10% so với tham chiếu) ==== */\n'+',\n'.join(out)+',\n/* ==== MQZ-END ==== */'
p='/workspace/mocqua/js/data.js';s=open(p,encoding='utf-8').read()
if 'MQZ-BEGIN' in s: s=re.sub(r'/\* ==== MQZ-BEGIN.*?MQZ-END ==== \*/',lambda m:block,s,flags=re.S)
else:
    a=s.index(' /* ---- Sắp ra mắt: Mộc Quả tuyển chọn');b=s.index(' /* ---- Sắp ra mắt: ngành hàng khác')
    s=s[:a]+block+'\n'+s[b:]
open(p,'w',encoding='utf-8').write(s)
print(len(G),'products',sum(len(v) for v in G.values()),'skus')
