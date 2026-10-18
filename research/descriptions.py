# -*- coding: utf-8 -*-
"""Builds the structured product description (desc) for every Mộc Quả own-label product.
Copy lives in desc_text.py (hand-written); facts (độ ẩm, HSD, kích thước hộp…) come from ref-facts.json when the
reference listed them, otherwise sensible defaults for the category. Images: assets/desc/ (credits.json)."""
import json,os,sys;sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from desc_text import P,SETS
R='/workspace/mocqua/research/';A='/workspace/mocqua/assets/desc/'
RF=json.load(open(R+'ref-facts.json'));CR=json.load(open(A+'credits.json'))
LAND={'dongthap':'Đầm sen miền Tây','dalat':'Đồi chè và rẫy rau ở Đà Lạt','mientay':'Kênh rạch miệt vườn miền Tây','hue':'Sông Hương, Huế','hungyen':'Cây nhãn trĩu quả',
 'bentre':'Dừa nước ven kênh, miền Tây','tiengiang':'Miệt vườn Cái Bè, Tiền Giang','lucngan':'Vải thiều vào mùa','binhthuan':'Vườn thanh long','hanoi':'Hồ Gươm, Hà Nội','taybac':'Đường lên cao nguyên Mộc Châu'}
RAWN={'ximuoi':'mo','hat':'hat'}
AM={'deo':'≤ 35%','omai':'≤ 30%','thanghoa':'≤ 5%','gion':'≤ 5%','kho':'≤ 25%'}
HSD={'deo':'6 tháng','omai':'12 tháng','thanghoa':'12 tháng','gion':'9 tháng','kho':'12 tháng','set':'6 tháng'}
ZIPSZ={100:'14 × 22 cm',200:'16 × 24 cm',250:'16 × 24 cm',500:'20 × 30 cm',1000:'26 × 36 cm'}
PROC={
 'deo':'Nguyên liệu được chọn lúc chín tới, sơ chế và cắt tay theo thớ, ngâm đường vừa đủ ngọt rồi sấy ở nhiệt thấp nhiều giờ để nước rút ra từ từ — miếng mứt dẻo đều từ ngoài vào trong, không bị cứng mặt. Không phẩm màu, không hương liệu: màu bạn thấy là màu của quả.',
 'omai':'Mỗi mẻ ô mai được làm theo công thức riêng, đi qua nhiều công đoạn muối – rim – phơi sấy, có khi kéo dài cả tuần. Chúng tôi làm mẻ nhỏ để kiểm soát độ mặn ngọt và giữ quả ráo, sạch.',
 'thanghoa':'Quả được cấp đông sâu rồi đưa vào buồng chân không, nơi nước đá thăng hoa thẳng thành hơi. Không qua nhiệt cao, không chiên, không thêm đường — miếng quả giữ gần như nguyên hình, màu và mùi, chỉ nhẹ đi rất nhiều.',
 'gion':'Quả được sấy chân không ở nhiệt độ thấp với một lượng nhỏ dầu thực vật để miếng nở giòn, sau đó ly tâm tách dầu. Nhờ vậy miếng giòn rụm mà không ngấy, không ám mùi dầu.',
 'kho':'Quả được sấy khô chậm theo cách truyền thống, đảo đều tay nhiều mẻ cho khô từ trong ra ngoài, giữ được vị ngọt sậm và mùi thơm đặc trưng.',
}
CAM=['Hoàn tiền 100% nếu bạn không hài lòng — chỉ cần chụp ảnh gửi Mộc Quả trong 7 ngày.','Sản xuất tại Việt Nam, nguồn quả rõ vùng trồng.',
     'Cơ sở sản xuất đạt điều kiện vệ sinh an toàn thực phẩm; mỗi lô in rõ ngày sản xuất và hạn dùng.']
CAMX={'deo':'Không phẩm màu, không chất bảo quản tổng hợp.','omai':'Không phẩm màu; vị mặn ngọt cân bằng, không gắt.','thanghoa':'100% quả, không thêm đường, không chiên.','gion':'Không chất bảo quản; dầu được tách kỹ sau khi sấy.','kho':'100% quả, không thêm đường.'}
KEEP={'deo':'Bảo quản nơi khô ráo, thoáng mát, tránh nắng. Sau khi mở, đậy kín nắp hộp hoặc kéo khoá zip; trời nồm nên để ngăn mát tủ lạnh và dùng trong khoảng 1 tháng.',
 'omai':'Để nơi khô ráo, thoáng mát, tránh nắng; đậy kín sau mỗi lần dùng để ô mai không bị chảy đường.',
 'thanghoa':'Đồ sấy thăng hoa rất hút ẩm: kéo kín khoá zip ngay sau mỗi lần lấy, không để ngăn mát, nên dùng hết trong 5–7 ngày sau khi mở.',
 'gion':'Kéo kín khoá zip sau khi mở để giữ giòn; để nơi khô ráo, tránh nắng; ngon nhất trong 2 tuần sau khi mở.',
 'kho':'Để nơi khô ráo, thoáng mát; sau khi mở nên cho vào hũ kín hoặc ngăn mát để giữ cùi dẻo.'}
GIFT='Mua set quà được tặng 1 túi 100g theo lựa chọn; đơn từ 1.000.000đ tặng túi giấy quà & thiệp viết tay Mộc Quả.'
def img(k,alt):
    c=CR.get(k)
    if not c or not os.path.exists(A+k+'.jpg'):return None
    return dict(src='desc/'+k+'.jpg',alt=alt,credit=f"Ảnh: {c['author'] or 'Wikimedia Commons'} · {c['license']} · Wikimedia Commons",href=c['url'])
def box_spec(s,cat):
    b=s.get('box');g=s['g']
    if b=='square':return 'Hộp vuông nhựa PET trong, tem tròn Mộc Quả '+('20 × 20 × 8 cm' if g>=1000 else '18 × 18 × 6 cm')
    if b=='octa':return 'Hộp bát giác nhựa PET trong, tem tròn Mộc Quả · 19 × 19 × 6 cm'
    if b=='hongwin':return 'Hộp quà ngăn kéo có cửa sổ (2 khay × 500g) · 30 × 20 × 6 cm, kèm túi xách'
    if b=='hongcarton':return 'Hộp giấy quai xách có cửa sổ (2 khay × 500g) · 26 × 14 × 14 cm'
    return None
def build(pid,rows,cat,gb=None,name=''):
    if cat=='set':return build_set(pid,rows,gb,name)
    t=P[pid];h=rows[0];f=RF.get(h['sku'],{}) or {}
    pack=[];bs=box_spec(h,cat)
    if bs:pack.append(bs)
    if 'price_zip' in h or cat!='deo':
        sz=sorted({r['g'] for r in rows});pack.append('Túi zip đứng có cửa sổ · '+' / '.join(f"{ZIPSZ.get(g,'')}" for g in sz))
    kl=' · '.join(sorted({(f"{r['g']//1000}kg" if r['g']>=1000 else f"{r['g']}g") for r in rows}))
    spec=[['Độ ẩm',(f.get('am') or AM[cat]).replace('<','≤')],['Xuất xứ',t['x']],['Dạng / kích cỡ',t['d']],['Thành phần',t['t']],['Khối lượng tịnh',kl],
          ['Quy cách đóng gói',' — hoặc — '.join(pack)],['Hạn sử dụng',f.get('hsd') or HSD[cat]],['Bảo quản','Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp']]
    raw=img('raw-'+RAWN.get(t['raw'],t['raw']),name+' — quả tươi')
    bowl=dict(src=f'desc/bowl-{pid}.jpg',alt=name+' bày trong bát',credit='Ảnh dựng Mộc Quả từ ảnh chụp quả sấy (nguồn trong CREDITS.md)') if os.path.exists(A+f'bowl-{pid}.jpg') else None
    land=img('land-'+t['r'],LAND.get(t['r'],''));
    if land:land['cap']=LAND.get(t['r'])
    base=PROC[cat] if not(cat=='deo' and 'đường' not in t['t']) else 'Nguyên liệu được chọn lúc chín tới, sơ chế bằng tay rồi sấy ở nhiệt thấp, chậm và đều — vị ngọt hoàn toàn đến từ đường tự nhiên trong quả, không thêm đường, không phẩm màu.'
    proc=base+((' '+t['q']) if t.get('q') else '')
    S=[dict(k='huong',h='Hương vị',p=[t['h']],img=bowl),dict(k='nguon',h='Nguồn gốc',p=[t['n']],img=land),dict(k='quy',h='Quy trình',p=[proc]),
       dict(k='spec',h='Thông tin sản phẩm',spec=spec),dict(k='dung',h='Bảo quản & dùng',p=[t['u'],KEEP[cat]]),
       dict(k='qua',h='Hợp làm quà',p=[t['g']+(' Hộp có sẵn túi xách, chỉ cần thêm thiệp.' if h.get('box') in('hongwin','hongcarton') else ''),GIFT]),
       dict(k='cam',h='Cam kết của Mộc Quả',li=CAM+[CAMX[cat]])]
    return dict(intro=t['i'],img=raw,sec=S)
def build_set(pid,rows,gb,name):
    h=rows[0];intro=SETS.get(pid,h.get('short',''))
    S=[]
    if gb:
        tot=sum(c[1] for c in gb['contents'])
        S.append(dict(k='huong',h='Trong hộp có gì',p=['Mỗi vị được chọn để bổ sung cho nhau: có vị chua, vị ngọt, có món dẻo, món giòn — mở ra ai cũng tìm được món mình thích.'],
                      li=[f"{c[0]} — {c[1]}g" for c in gb['contents']]+[f"Tổng khối lượng tịnh: {tot}g"],img=dict(src=f"products/mqz/{gb['sku'].lower()}-g3.jpg",alt=name+' — cận cảnh các ngăn',credit='Ảnh dựng Mộc Quả') if gb['type']!='tubs' else None))
        S.append(dict(k='spec',h='Thông tin sản phẩm',spec=[['Quy cách',gb['pack']],['Khối lượng tịnh',f'{tot}g'],['Xuất xứ','Quả và hạt Việt Nam, đóng hộp tại Mộc Quả'],['Hạn sử dụng','6 tháng kể từ ngày đóng hộp'],['Bảo quản','Nơi khô ráo, thoáng mát; đậy kín sau khi mở']]))
        S.append(dict(k='qua',h='Hợp làm quà',p=['Hợp cho: '+', '.join(gb['occ'])+'.','Mỗi set đều kèm túi xách và thiệp; ghi lời chúc khi đặt hàng, chúng tôi viết tay giúp bạn. '+GIFT]))
    S.append(dict(k='quy',h='Chúng tôi đóng hộp thế nào',p=['Từng ngăn được cân riêng và lót giấy chống ẩm; hộp được dán tem niêm phong Mộc Quả trước khi giao. Mứt và hạt lấy từ cùng mẻ với hàng bán lẻ, nên hương vị không khác những gói bạn đã quen.']))
    S.append(dict(k='cam',h='Cam kết của Mộc Quả',li=CAM+['Đổi hộp mới nếu hộp móp méo khi nhận hàng.']))
    return dict(intro=intro,img=None,sec=S)
