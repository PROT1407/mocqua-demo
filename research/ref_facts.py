"""Extract product facts (độ ẩm, xuất xứ, kích cỡ, bao bì, thành phần, khối lượng, HSD) from the
reference crawl (dacsancaocap.com product pages) for every matched own-label item. Facts only —
the wording on our site is written fresh in descriptions.py."""
import json,csv,re
R='/workspace/mocqua/research/'
L={json.loads(l)['url']:json.loads(l) for l in open('/tmp/dsc2/all.jsonl')}
H={x['h1']:x for x in L.values()}
rows=list(csv.DictReader(open(R+'dacsancaocap-own-label.csv',encoding='utf-8-sig')))
F={'am':r'Độ ẩm\s*:?\s*([^A-ZĐ]{1,20}?%)','xx':r'Xuất xứ\s*:?\s*([^\n]{1,30}?)(?= Kích| Thành| Khối| HSD|$)','kc':r'Kích cỡ\s*:?\s*([^\n]{1,40}?)(?= Kích thước| Thành| Khối|$)',
   'kt':r'Kích thước[^:]{0,20}:\s*([\d ,.xX×cm]{5,30}cm)','tp':r'Thành phần\s*:?\s*([^\n]{3,140}?)(?= Khối lượng| HSD| Kích|$)','kl':r'Khối lượng tịnh\s*:?\s*([^\n]{1,30}?)(?= HSD| Bảo| Kích|$)','hsd':r'HSD\s*:?\s*([^\n]{1,25}?(?:tháng|năm|ngày))'}
out={}
for r in rows:
    x=L.get(r['url']) or H.get(r['their_name'])
    if not x:continue
    t=re.sub(r'\s+',' ',x.get('desc') or '')
    f={k:(re.search(p,t,re.I).group(1).strip(' .,;') if re.search(p,t,re.I) else None) for k,p in F.items()}
    f['ref']=r['their_name'];f['url']=r['url']
    out[r['mocqua_sku'].replace('-HU','')]=f
json.dump(out,open(R+'ref-facts.json','w'),ensure_ascii=False,indent=1)
if __name__=='__main__':
    for k,v in out.items():print(k,{a:b for a,b in v.items() if a not in('url',)})
