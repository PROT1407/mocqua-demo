"""Sync the gift-box catalog (mocqua-giftboxes.json) into the own-label spec + reference CSV.
Run before pricing.py -> gen_data.py. Idempotent."""
import json,csv
R='/workspace/mocqua/research/'
B=json.load(open(R+'mocqua-giftboxes.json'))['boxes'];SP=R+'mocqua-own-label-spec.json';D=json.load(open(SP))
L=[json.loads(l) for l in open('/tmp/dsc2/all.jsonl')] if __import__('os').path.exists('/tmp/dsc2/all.jsonl') else None
by={s['sku']:s for s in D['spec']}
def lead(n):return n.split(':')[0] if ':' in n else n
for sku,b in B.items():
    names=[c[0] for c in b['contents']]
    short=(f"{len(names)} ngăn: " if b['type'] not in('tubs','basket','jars6') else '')+', '.join(n.lower() if i else n for i,n in enumerate(names))+'. '
    if b['type'] in('tubs',):short=' · '.join(names)+'. '
    short+=b['pack'].split(';')[0]+'.'
    s=by.get(sku)
    if not s:
        s=dict(idx=b['their_idx'],cat='set',fruit='mixdeo',flavour='mix',sku=sku,their_name=b['their_name'],their_price=b['their_price'])
        D['spec'].append(s);by[sku]=s
    s.update(pid=b['pid'],name=b['name'],variant=b['variant'],sub=', '.join(lead(n) for n in names[:3])+'…' if len(names)>3 else ' · '.join(names),
             short=short,g=sum(c[1] for c in b['contents']),set=[c[2] for c in b['contents']])
json.dump(D,open(SP,'w'),ensure_ascii=False,indent=1)
P=R+'dacsancaocap-own-label.csv'
rows=list(csv.DictReader(open(P,encoding='utf-8-sig')));have={r['their_name'] for r in rows};fields=list(rows[0].keys())
for sku,b in B.items():
    if 'their_name' in b and b['their_name'] not in have and L:
        x=L[b['their_idx']];orig=int((x.get('orig') or '0').split()[0].replace(',','') or 0)
        rows.append({'their_name':b['their_name'],'weight':b['variant'].split('·')[0].strip(),'variants':'','their_price':b['their_price'],'their_list_price':orig or '',
            'category':'Hộp Mứt Truyền Thống (VN)','own_label_packaging':'(xem ảnh tham chiếu) — Mộc Quả: '+b['pack'].split(';')[0],'short_description':(x.get('intro') or '')[:300],'url':x['url']})
w=csv.DictWriter(open(P,'w',newline='',encoding='utf-8-sig'),fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(rows)
print(len(D['spec']),'spec rows;',len(rows),'csv rows')
