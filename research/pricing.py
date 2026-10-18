"""Mộc Quả own-label pricing rule (owner-approved, Oct 2026).
Our price = 4–10% below dacsancaocap.com's current SALE price of the equivalent item,
rounded to a psychological ending (…5.000 or …9.000).
 - traffic best sellers: target ~9% cheaper
 - standard items:       target ~7% cheaper
 - premium / gift items: target ~4.5% cheaper (sets, sầu riêng, vải thăng hoa)
Sấy dẻo come in Hũ PET (main, compared with their tub) and Túi zip (cheaper option; they sell
no bag for these, so the zip is compared with the same tub and placed at the deep end of the band).
Pipeline: mapping.py (spec from crawl) -> pricing.py (prices) -> gen_data.py (js/data.js)."""
import json,csv,datetime
SP='/workspace/mocqua/research/mocqua-own-label-spec.json'
D=json.load(open(SP))
TRAFFIC={'mqz-xoai-say-deo','mqz-dau-tay-say-deo','mqz-chanh-day-say-deo','mqz-mit-say-gion','mqz-xi-muoi-dac-biet','mqz-thap-cam-say-gion',
 'mqz-xoai-thang-hoa','mqz-thanh-long-thang-hoa','mqz-chum-ruot-muoi-ot','mqz-dua-non-say-deo','mqz-hong-say-deo','mqz-khoai-lang-say-gion'}
def tier(s):
    if s['cat']=='set' or 'sau-rieng' in s['pid'] or s['pid']=='mqz-vai-thang-hoa':return 'premium',0.045
    if s['pid'] in TRAFFIC:return 'traffic',0.09
    return 'standard',0.07
def cands(t):
    lo,hi=t*0.90,t*0.96   # 10% .. 4% cheaper
    out=[]
    k=int(lo//10000)*10000
    while k<=hi+10000:
        for e in (5000,9000):
            v=k+e
            if lo<=v<=hi:out.append(v)
        k+=10000
    if len(out)<2:   # narrow band on small prices: allow a clean …0.000 ending as well
        k=int(lo//10000)*10000
        while k<=hi+10000:
            if lo<=k<=hi:out.append(k)
            k+=10000
    return sorted(set(out))
for s in D['spec']:
    t=s['their_price'];name,target=tier(s);C=cands(t)
    assert C,(s['sku'],t)
    pick=min(C,key=lambda v:abs((1-v/t)-target))
    s['tier']=name
    if s['cat']=='deo':
        zip_=C[0]                       # deepest (closest to 10%)
        jar=pick if pick>zip_ else (C[1] if len(C)>1 else None)
        assert jar and jar>zip_,(s['sku'],C)
        s['price']=jar;s['price_zip']=zip_
    else:
        s['price']=pick;s.pop('price_zip',None)
    s['pct']=round(100*(1-s['price']/t),1)
    if 'price_zip' in s:s['pct_zip']=round(100*(1-s['price_zip']/t),1)
json.dump(D,open(SP,'w'),ensure_ascii=False,indent=1)
# update the reference CSV with the re-check date and our prices
P='/workspace/mocqua/research/dacsancaocap-own-label.csv'
rows=list(csv.DictReader(open(P,encoding='utf-8-sig')))
byname={s['their_name']:s for s in D['spec']}
fields=[f for f in rows[0].keys() if f not in('price_checked','mocqua_sku','mocqua_price','mocqua_pct_cheaper','mocqua_zip_price','mocqua_zip_pct_cheaper','mocqua_tier')]
fields+=['price_checked','mocqua_sku','mocqua_tier','mocqua_price','mocqua_pct_cheaper','mocqua_zip_price','mocqua_zip_pct_cheaper']
today='2026-10-18'
for r in rows:
    s=byname.get(r['their_name']);r['price_checked']=today
    if s:
        r['mocqua_sku']=s['sku']+('-HU' if s['cat']=='deo' else '');r['mocqua_tier']=s['tier'];r['mocqua_price']=s['price'];r['mocqua_pct_cheaper']=s['pct']
        r['mocqua_zip_price']=s.get('price_zip','');r['mocqua_zip_pct_cheaper']=s.get('pct_zip','')
w=csv.DictWriter(open(P,'w',newline='',encoding='utf-8-sig'),fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(rows)
for s in D['spec']:print(f"{s['sku']:16} {s['tier']:8} their {s['their_price']:>7} ours {s['price']:>7} ({s['pct']}%)"+(f"  zip {s['price_zip']} ({s['pct_zip']}%)" if 'price_zip' in s else ''))
print(sum(1 for r in rows if r.get('mocqua_sku')),'csv rows matched of',len(rows))
