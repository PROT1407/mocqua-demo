"""Square/octagon PET boxes and Hồng gift boxes (owner request 10:4x, 18/10/2026).
- the 17 reference 'Hộp nhựa trong' items are square clear PET boxes -> our box option becomes 'Hộp vuông PET' (-HV)
- new own-label items for reference products sold in octagon clear boxes / gift boxes"""
import json,csv
R='/workspace/mocqua/research/'
SP=json.load(open(R+'mocqua-own-label-spec.json'))
URL={r['their_name']:r['url'] for r in csv.DictReader(open(R+'dacsancaocap-excluded.csv',encoding='utf-8-sig'))}
NEW=[
 dict(pid='mqz-coc-non-say-deo',name='Cóc non sấy dẻo',fruit='coc',flavour='nguyen',sku='MQZ-DCO-500',sub='Chua giòn, ngọt dịu',g=500,box='octa',
      short='Cóc non miền Tây sấy dẻo, giữ nguyên trái — chua dịu, ngọt nhẹ, cắn sần sật.',their_name='Cóc Sấy Dẻo Đặt Biệt (0.5kg)',their_price=180000,price=169000,price_zip=165000),
 dict(pid='mqz-vo-buoi-say-deo',name='Vỏ bưởi sấy dẻo',fruit='voboi',flavour='nguyen',sku='MQZ-DVB-500',sub='Thơm the, ngọt vừa',g=500,box='octa',
      short='Vỏ bưởi da xanh Bến Tre sấy dẻo — vàng óng, thơm the đặc trưng, ngọt vừa phải.',their_name='Vỏ Bưởi Sấy Dẻo Đặt Biệt (0.5kg)',their_price=175000,price=165000,price_zip=159000),
 dict(pid='mqz-ca-chua-bi-say-deo',name='Cà chua bi sấy dẻo',fruit='cachua',flavour='nguyen',sku='MQZ-DCC-500',sub='Chua ngọt, dẻo mọng',g=500,box='octa',
      short='Cà chua bi Đà Lạt sấy dẻo nguyên trái — đỏ tự nhiên, chua ngọt hài hoà, dẻo mọng.',their_name='Cà Chua Sấy Dẻo Đặc Biệt (0.5kg)',their_price=165000,price=155000,price_zip=149000),
 dict(pid='mqz-tao-say-deo',name='Táo sấy dẻo',fruit='tao',flavour='nguyen',sku='MQZ-DTA-500',sub='Thơm táo, chua dẻo',g=500,box='octa',
      short='Táo lát sấy dẻo còn rõ mùi táo chín, chua nhẹ đầu lưỡi rồi ngọt dần.',their_name='Táo Sấy Dẻo Đặc Biệt (0.5kg)',their_price=185000,price=175000,price_zip=169000),
 dict(pid='mqz-hong-treo-say-gio',name='Hồng treo sấy gió Đà Lạt — hộp quà',fruit='hong',flavour='nguyen',sku='MQZ-DHT-1000',sub='Nguyên trái, mềm dẻo',g=1000,box='hongwin',variant='Hộp quà 2 × 500g',
      short='Hồng Đà Lạt treo sấy gió kiểu Nhật, nguyên trái to — mềm dẻo, ngọt sâu. Hộp ngăn kéo cửa sổ, sẵn để biếu.',their_name='Hồng Dẻo Sấy Treo Việt Nhật XK (1kg)',their_price=580000,price=539000),
 dict(pid='mqz-hong-say-deo-hop-xach',name='Hồng sấy dẻo nguyên trái — hộp xách',fruit='hong',flavour='nguyen',sku='MQZ-DHV-1000',sub='Nguyên trái, ngọt đậm',g=1000,box='hongcarton',variant='Hộp xách 2 × 500g',
      short='Hồng sấy dẻo nguyên trái Đà Lạt trong hộp quai xách — ngọt đậm, dẻo mềm, món quà mang đi tiện tay.',their_name='Hồng Sấy Dẻo Việt Nhật (1kg)',their_price=470000,price=439000),
]
have={s['sku'] for s in SP['spec']};mx=max(s['idx'] for s in SP['spec'])
SQ={'MQZ-DXO-500','MQZ-DDY-500','MQZ-DCD-500','MQZ-DTL-500','MQZ-DMI-500','MQZ-DNH-500','MQZ-DHO-1000','MQZ-DHOE-500','MQZ-DDN-500','MQZ-DTH-500','MQZ-DDD-500','MQZ-DCA-500','MQZ-DKL-1000','MQZ-DOI-500','MQZ-DMC-500','MQZ-DGU-500','MQZ-DHS-500'}
for s in SP['spec']:
    if s['sku'] in SQ:s['box']='square'
for n in NEW:
    if n['sku'] in have:continue
    mx+=1;n=dict(idx=mx,cat='deo',set=None,tier='standard',variant=n.pop('variant','500g' if n['g']==500 else '1kg'),**n)
    n['pct']=round((1-n['price']/n['their_price'])*100,1)
    if 'price_zip' in n:n['pct_zip']=round((1-n['price_zip']/n['their_price'])*100,1)
    SP['spec'].append(n)
json.dump(SP,open(R+'mocqua-own-label-spec.json','w'),ensure_ascii=False,indent=1)
# CSV: move the reference rows from excluded -> own-label
rows=list(csv.DictReader(open(R+'dacsancaocap-own-label.csv',encoding='utf-8-sig')));fn=list(rows[0].keys())
PK={'octa':'Hộp bát giác nhựa trong + tem tròn','hongwin':'Hộp quà ngăn kéo có cửa sổ','hongcarton':'Hộp giấy quai xách'}
names={r['their_name'] for r in rows}
for r in rows:
    if r['mocqua_sku'].endswith('-HU') and r['mocqua_sku'][:-3] in SQ:r['mocqua_sku']=r['mocqua_sku'][:-3]+'-HV';r['own_label_packaging']='Hộp vuông nhựa trong + tem tròn'
for n in NEW:
    if n['their_name'] in names:continue
    r={k:'' for k in fn};r.update(their_name=n['their_name'],weight=str(n['g'])+'g',their_price=n['their_price'],category='Sấy dẻo',own_label_packaging=PK[n['box']],
      short_description=n['short'],url=URL.get(n['their_name'],''),price_checked='2026-10-18',mocqua_sku=n['sku']+('-HB' if n['box']=='octa' else ''),mocqua_tier='standard',
      mocqua_price=n['price'],mocqua_pct_cheaper=round((1-n['price']/n['their_price'])*100,1))
    if 'price_zip' in n:r.update(mocqua_zip_price=n['price_zip'],mocqua_zip_pct_cheaper=round((1-n['price_zip']/n['their_price'])*100,1))
    rows.append(r)
with open(R+'dacsancaocap-own-label.csv','w',encoding='utf-8-sig',newline='') as f:w=csv.DictWriter(f,fn);w.writeheader();w.writerows(rows)
ex=list(csv.DictReader(open(R+'dacsancaocap-excluded.csv',encoding='utf-8-sig')));efn=list(ex[0].keys())
ex=[r for r in ex if r['their_name'] not in {n['their_name'] for n in NEW}]
with open(R+'dacsancaocap-excluded.csv','w',encoding='utf-8-sig',newline='') as f:w=csv.DictWriter(f,efn);w.writeheader();w.writerows(ex)
print(len(SP['spec']),'spec rows;',len(rows),'own-label rows;',len(ex),'excluded')
