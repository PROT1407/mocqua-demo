# Builds research CSV + Mộc Quả own-label spec from the dacsancaocap crawl (Oct 2026)
import json,csv,re,math
L={r['idx']:r for r in map(json.loads,open('/workspace/mocqua/research/_crawl-dacsancaocap.jsonl'))}
CAT={'omai':'Ô Mai Xí Muội (VN)','deo':'Trái Cây Sấy Dẻo (VN)','gion':'Trái Cây Sấy Giòn (VN)','mut':'Hộp Mứt Truyền Thống (VN)'}
PK={}
for i in list(range(0,14))+[37,38,39,40,41,42,43,44,45,55]: PK[i]='Túi zip kraft có cửa sổ, tem tròn "Đặc sản cao cấp Nafarm" (dacsancaocap)'
for i in [14,15,16,17,18,19,20,23,24,27,28,29,31,32,33,34,35]: PK[i]='Hộp nhựa trong (tub), tem tròn "dacsancaocap.com"'
for i in [46,47,48,49,50,51,52,53,54]: PK[i]='Túi zip trong/bạc, nhãn vàng "traicayhatsay.com"'
for i in [58,65]: PK[i]='Hộp quà nhiều ngăn, tem tròn Nafarm'
for i in [59,60,61,63]: PK[i]='Hũ nhựa (combo 2 hũ + túi xách), tem Nafarm'
for i in [64,67,71]: PK[i]='Khay/giỏ nhựa nhiều ngăn, tem tròn "dacsancaocap.com"'
for i in [68,69]: PK[i]='Hộp quà cứng, tem tròn Nafarm'
PK[70]='Giỏ quà, các túi/hộp dán tem "dacsancaocap.com"'
# idx: (product id, product name, variant label, cat, fruit, flavour, sku, sub, short)
S={
0:('mqz-o-mai-mo-man','Ô mai mơ mặn','500g','omai','mo','ximuoi','MQZ-OMMO-500','Mơ chua mặn, hậu ngọt','Quả mơ ủ kiểu xí muội, vị chua mặn đậm đà và hậu ngọt nhẹ — nhâm nhi cùng trà nóng rất hợp.'),
1:('mqz-xi-muoi-dac-biet','Xí muội đặc biệt','Đỏ · 250g','omai','ximuoi','ximuoi','MQZ-OMXD-250','Đỏ cay ngọt · trắng chua mặn','Hai vị xí muội kinh điển: đỏ cay ngọt và trắng chua mặn thanh — túi zip 250g tiện nhâm nhi.'),
2:('mqz-xi-muoi-dac-biet','Xí muội đặc biệt','Trắng · 250g','omai','ximuoitrang','ximuoi','MQZ-OMXT-250',None,None),
3:('mqz-man-deo-duong-ot','Mận sấy dẻo đường ớt','1kg','omai','man','muoiot','MQZ-OMMA-1000','Chua – ngọt – cay','Mận sấy dẻo áo đường ớt, chua ngọt cay the — túi lớn 1kg cho cả nhà và văn phòng.'),
4:('mqz-me-ngao-duong','Me trái ngào đường','500g','omai','me','duong','MQZ-OMMN-500','Ngọt dịu, chua nhẹ','Me nguyên trái ngào đường lớp áo mỏng, chua ngọt dịu dàng — món quà vặt tuổi thơ.'),
5:('mqz-me-xi-muoi','Me trái xí muội','500g','omai','me','ximuoi','MQZ-OMMX-500','Chua mặn đậm vị','Me nguyên trái tẩm xí muội chua mặn, ăn tới đâu thấm tới đó.'),
6:('mqz-o-mai-me-gung-tac','Ô mai me gừng tắc','500g','omai','me','ximuoi','MQZ-OMMG-500','Ấm gừng, thơm tắc','Me dẻo hoà vị gừng ấm và tắc thơm — ô mai kiểu Hà thành cho ngày se lạnh.'),
7:('mqz-dau-tam-ngao-duong','Dâu tằm ngào đường','500g','omai','dautam','duong','MQZ-OMDT-500','Chua ngọt, tím mọng','Dâu tằm ngào đường giữ sắc tím tự nhiên, chua ngọt mọng — ăn vặt hay pha trà đều ngon.'),
8:('mqz-dau-tay-ngao-duong','Dâu tây ngào đường','500g','omai','dautay','duong','MQZ-OMDY-500','Đỏ mọng, ngọt thanh','Dâu tây Đà Lạt ngào đường đỏ mọng, ngọt thanh, chua nhẹ cuối vị.'),
9:('mqz-chum-ruot-muoi-ot','Chùm ruột muối ớt','1kg','omai','chumruot','muoiot','MQZ-OMCR-1000','Chua giòn, cay mặn','Chùm ruột muối ớt chua giòn, cay mặn — đặc sản ăn vặt khó cưỡng, túi lớn 1kg.'),
10:('mqz-me-ngao-cay','Me ngào đường vị cay','500g','omai','me','muoiot','MQZ-OMMC-500','Ngọt trước, cay sau','Me ngào đường thêm chút ớt cay, ngọt trước cay sau, càng ăn càng cuốn.'),
11:('mqz-me-xi-muoi-chum-ruot','Me xí muội chùm ruột','500g','omai','me','ximuoi','MQZ-OMMR-500','Hai vị chua hoà quyện','Me xí muội kết hợp chùm ruột — hai vị chua tự nhiên hoà quyện, mặn ngọt vừa phải.'),
12:('mqz-xi-muoi-khong-hat','Xí muội không hạt','500g','omai','ximuoi','ximuoi','MQZ-OMXK-500','Thịt dày, không hạt','Xí muội tách hạt thịt dày, dẻo, chua mặn hậu ngọt — tiện ăn, không vướng hạt.'),
13:('mqz-xi-muoi-dao-hong','Xí muội đào hồng','500g','omai','dao','ximuoi','MQZ-OMDA-500','Thơm đào, chua dịu','Đào hồng làm xí muội thơm hương đào, chua dịu ngọt thanh, màu hồng xinh mắt.'),
14:('mqz-hat-sen-say-deo','Hạt sen sấy dẻo','500g','deo','hatsen','nguyen','MQZ-DHS-500','Bùi bở, ngọt thanh','Hạt sen tươi sấy dẻo bùi bở, ngọt thanh — món mứt thanh tao cho mâm trà ngày Tết.'),
15:('mqz-thanh-long-say-deo','Thanh long ruột đỏ sấy dẻo','500g','deo','thanhlong','nguyen','MQZ-DTL-500','Sắc hồng tím tự nhiên','Thanh long ruột đỏ sấy dẻo giữ sắc hồng tím tự nhiên, ngọt nhẹ, dẻo mềm.'),
16:('mqz-chanh-day-say-deo','Chanh dây sấy dẻo','500g','deo','chanhday','nguyen','MQZ-DCD-500','Chua ngọt, thơm nồng','Chanh dây sấy dẻo cả hạt, chua ngọt thơm nồng — lạ miệng, rất đưa trà.'),
17:('mqz-dau-tay-say-deo','Dâu tây Đà Lạt sấy dẻo','500g','deo','dautay','nguyen','MQZ-DDY-500','Dâu Đà Lạt chọn trái','Dâu tây Đà Lạt chọn trái, sấy dẻo giữ vị chua ngọt và màu đỏ tươi.'),
18:('mqz-mang-cau-say-deo','Mãng cầu xiêm sấy dẻo','500g','deo','mangcau','nguyen','MQZ-DMC-500','Chua thanh, thơm dịu','Mãng cầu xiêm sấy dẻo chua thanh, thơm dịu, thớ mềm — vị quà miền Tây.'),
19:('mqz-gung-say-deo','Gừng Huế sấy dẻo','500g','deo','gung','nguyen','MQZ-DGU-500','Cay ấm, ngọt nhẹ','Gừng Huế lát mỏng sấy dẻo cay ấm, ngọt nhẹ — ấm bụng ngày lạnh, hợp trà gừng.'),
20:('mqz-xoai-say-deo','Xoài cát sấy dẻo','500g','deo','xoai','nguyen','MQZ-DXO-500','Lát dày, vàng óng','Xoài cát chín cây thái lát dày, sấy dẻo vàng óng, chua ngọt hài hoà.'),
23:('mqz-dua-non-say-deo','Dừa non sấy dẻo','500g','deo','duanon','nguyen','MQZ-DDN-500','Sợi dẻo, béo thơm','Cơm dừa non sấy dẻo sợi mềm, béo thơm, ngọt vừa — mứt dừa kiểu mới ít ngọt.'),
24:('mqz-thom-say-deo','Thơm sấy dẻo','500g','deo','thom','nguyen','MQZ-DTH-500','Chua ngọt thanh mát','Thơm chín sấy dẻo chua ngọt thanh mát, thớ mềm, thơm đặc trưng.'),
27:('mqz-du-du-say-deo','Đu đủ sấy dẻo','500g','deo','dudu','nguyen','MQZ-DDD-500','Cam tươi, ngọt dịu','Đu đủ chín sấy dẻo màu cam tươi, ngọt dịu, dễ ăn cho cả trẻ nhỏ.'),
28:('mqz-cam-lat-say-deo','Cam lát sấy dẻo','500g','deo','cam','nguyen','MQZ-DCA-500','Cả vỏ thơm tinh dầu','Cam thái lát cả vỏ sấy dẻo, thơm tinh dầu cam, chua ngọt nhẹ — đẹp cho khay trà.'),
29:('mqz-hong-say-deo','Hồng Đà Lạt sấy dẻo','Hồng chẻ · 1kg','deo','hong','nguyen','MQZ-DHO-1000','Dẻo quánh, ngọt sâu','Hồng Đà Lạt sấy dẻo quánh, ngọt sâu tự nhiên — có loại hồng chẻ và hồng nguyên trái ép.'),
32:('mqz-hong-say-deo','Hồng Đà Lạt sấy dẻo','Nguyên trái ép · 500g','deo','hong','nguyen','MQZ-DHOE-500',None,None),
31:('mqz-khoai-lang-mat-say-deo','Khoai lang mật sấy dẻo','1kg','deo','khoailang','nguyen','MQZ-DKL-1000','Mật ngọt, dẻo thơm','Khoai lang mật Đà Lạt sấy dẻo, ngọt mật tự nhiên — ăn vặt lành, no lâu.'),
33:('mqz-oi-say-deo','Ổi sấy dẻo','500g','deo','oi','nguyen','MQZ-DOI-500','Giòn dai, chua ngọt','Ổi sấy dẻo giòn dai, chua ngọt, thơm mùi ổi chín.'),
34:('mqz-mit-say-deo','Mít sấy dẻo','500g','deo','mit','nguyen','MQZ-DMI-500','Múi vàng, thơm lừng','Mít chín sấy dẻo múi vàng, dẻo mềm, thơm lừng — khác hẳn mít sấy giòn.'),
35:('mqz-nhan-say-deo','Nhãn Hưng Yên sấy dẻo','500g','deo','nhan','nguyen','MQZ-DNH-500','Cùi dày, ngọt lịm','Nhãn lồng Hưng Yên bóc cùi sấy dẻo, ngọt lịm, thơm mùi nhãn — pha chè, ăn vặt đều ngon.'),
37:('mqz-sung-thang-hoa','Sung sấy thăng hoa','100g','thanghoa','sung','nguyen','MQZ-THSU-100','Giòn xốp, ngọt nhẹ','Sung sấy thăng hoa giòn xốp, ngọt nhẹ, giữ vân hạt đẹp mắt.'),
38:('mqz-mang-cau-thang-hoa','Mãng cầu xiêm sấy thăng hoa','100g','thanghoa','mangcau','nguyen','MQZ-THMC-100','Tan nhẹ, chua thanh','Mãng cầu xiêm sấy thăng hoa giòn tan, chua thanh, thơm như quả tươi.'),
39:('mqz-nhan-thang-hoa','Nhãn Hưng Yên sấy thăng hoa','100g','thanghoa','nhan','nguyen','MQZ-THNH-100','Giòn tan, ngọt thơm','Nhãn Hưng Yên sấy thăng hoa giòn tan, ngọt thơm, giữ màu cùi nhãn.'),
40:('mqz-thanh-long-thang-hoa','Thanh long sấy thăng hoa','Ruột trắng · 100g','thanghoa','thanhlongtrang','nguyen','MQZ-THTLT-100','Ruột trắng & ruột đỏ','Thanh long sấy thăng hoa giòn xốp, giữ nguyên hạt đen — chọn ruột trắng thanh mát hoặc ruột đỏ đậm màu.'),
41:('mqz-thanh-long-thang-hoa','Thanh long sấy thăng hoa','Ruột đỏ · 100g','thanghoa','thanhlong','nguyen','MQZ-THTLD-100',None,None),
42:('mqz-thom-thang-hoa','Thơm Queen sấy thăng hoa','100g','thanghoa','thom','nguyen','MQZ-THTH-100','Giòn xốp, chua ngọt','Thơm Queen sấy thăng hoa giòn xốp, chua ngọt tươi — vị nhiệt đới trong túi nhỏ.'),
43:('mqz-xoai-thang-hoa','Xoài cát sấy thăng hoa','100g','thanghoa','xoai','nguyen','MQZ-THXO-100','Vàng tươi, tan trong miệng','Xoài cát sấy thăng hoa vàng tươi, giòn xốp, tan trong miệng.'),
44:('mqz-sau-rieng-ri6-thang-hoa','Sầu riêng Ri6 sấy thăng hoa','Múi cắt · 100g','thanghoa','saurieng','nguyen','MQZ-THSR-100C','Cơm vàng, hạt lép','Sầu riêng Ri6 cơm vàng hạt lép sấy thăng hoa, giòn xốp, béo thơm — chọn múi cắt hoặc nguyên múi.'),
45:('mqz-sau-rieng-ri6-thang-hoa','Sầu riêng Ri6 sấy thăng hoa','Nguyên múi · 100g','thanghoa','saurieng','nguyen','MQZ-THSR-100N',None,None),
51:('mqz-sau-rieng-thang-hoa-200','Sầu riêng sấy thăng hoa túi lớn','200g','thanghoa','saurieng','nguyen','MQZ-THSR-200','Túi lớn tiết kiệm','Sầu riêng sấy thăng hoa giòn xốp, béo thơm — túi lớn 200g tiết kiệm cho cả nhà cùng ăn.'),
55:('mqz-vai-thang-hoa','Vải Lục Ngạn sấy thăng hoa','100g','thanghoa','vai','nguyen','MQZ-THVA-100','Thơm hương vải','Vải thiều Lục Ngạn sấy thăng hoa giòn tan, thơm hương vải, ngọt thanh.'),
46:('mqz-mit-say-gion','Mít Thái sấy giòn','500g','gion','mit','nguyen','MQZ-GMI-500','Giòn rụm, múi to','Mít Thái múi to sấy giòn rụm, thơm lừng — túi zip 500g ăn cả nhà.'),
47:('mqz-khoai-mon-say-gion','Khoai môn sấy giòn','500g','gion','khoaimon','nguyen','MQZ-GKM-500','Bùi bùi, giòn tan','Khoai môn thái que sấy giòn, bùi bùi, thơm nhẹ — món nhâm nhi lành.'),
48:('mqz-thap-cam-say-gion','Trái cây thập cẩm sấy giòn','500g','gion','mix','nguyen','MQZ-GTC-500','Mít, chuối, khoai, đậu…','Mix nhiều loại trái cây và củ sấy giòn trong một túi — tiết kiệm, đủ vị, tiếp khách tiện.'),
49:('mqz-khoai-lang-say-gion','Khoai lang Đà Lạt sấy giòn','Vàng · 500g','gion','khoailangvang','nguyen','MQZ-GKLV-500','Ruột vàng & ruột tím','Khoai lang Đà Lạt thái lát sấy giòn, ngọt bùi tự nhiên — chọn ruột vàng hoặc ruột tím.'),
50:('mqz-khoai-lang-say-gion','Khoai lang Đà Lạt sấy giòn','Tím · 500g','gion','khoailangtim','nguyen','MQZ-GKLT-500',None,None),
54:('mqz-chuoi-say-gion','Chuối sấy giòn','500g','gion','chuoi','nguyen','MQZ-GCH-500','Giòn ngọt, giá mềm','Chuối chín thái lát sấy giòn, ngọt tự nhiên — món ăn vặt giá mềm cho cả nhà.'),
52:('mqz-nhan-say-kho','Nhãn sấy khô nguyên vỏ','1kg','kho','nhan','nguyen','MQZ-KNH-1000','Long nhãn nguyên vỏ','Nhãn sấy khô nguyên vỏ kiểu truyền thống, cùi dẻo ngọt đậm — bóc ăn hoặc nấu chè.'),
53:('mqz-vai-say-kho','Vải thiều sấy khô','1kg','kho','vai','nguyen','MQZ-KVA-1000','Vải khô nguyên trái','Vải thiều sấy khô nguyên trái, cùi dẻo ngọt sâu — quà quê Bắc Giang.'),
58:('mqz-hop-9-vi','Hộp quà 9 vị quả & quà','980g','set','mixdeo','mix','MQZ-SET9-980','9 ngăn · me, dâu tằm, táo đỏ…','Hộp 9 ngăn gồm các vị me ngào, dâu tằm, táo đỏ, kiwi, thập cẩm dẻo, kẹo trái cây… — món quà nhiều màu sắc.'),
59:('mqz-bo-12-vi-mut','Bộ 12 vị mứt sấy dẻo','1,7kg','set','mixdeo','mix','MQZ-SET12-1700','2 hũ · 12 loại quả','Hai hũ lớn trộn 12 loại trái cây sấy dẻo — đủ vị cho khay trà ngày Tết.'),
60:('mqz-doi-thom-say','Đôi thơm sấy: mộc & muối ớt','1kg','set','thom','mix','MQZ-SETTH-1000','Không đường thêm','Cặp thơm sấy mộc và thơm muối ớt không thêm đường — một vị thanh, một vị đậm.'),
61:('mqz-bo-mut-dua-non','Bộ mứt dừa non 4 vị','1,2kg','set','duanon','mix','MQZ-SETDN-1200','Sữa · lá dứa · cà phê · khoai môn','Mứt dừa non dạng viên 4 vị màu tự nhiên — đẹp mắt, béo thơm, hợp đãi khách.'),
63:('mqz-doi-mut-muoi-ot','Đôi mứt muối ớt: thơm & mãng cầu','1kg','set','thom','muoiot','MQZ-SETMO-1000','Chua cay ngọt mặn','Thơm và mãng cầu sấy dẻo áo muối ớt — chua cay ngọt mặn hoà quyện.'),
64:('mqz-khay-mut-7-vi','Khay mứt 7 vị','750g','set','mixdeo','mix','MQZ-SETK7-750','Xoài, thơm, vỏ bưởi, táo…','Khay 7 ngăn: xoài, thơm, vỏ bưởi, táo, đu đủ, cóc, cà chua sấy dẻo — mâm mứt truyền thống gọn đẹp.'),
67:('mqz-khay-mut-5-vi','Khay mứt 5 vị thượng hạng','500g','set','mixdeo','mix','MQZ-SETK5-500','Chanh dây, gừng, dừa non…','Khay 5 ngăn: chanh dây, gừng, dừa non, xoài, dâu sấy dẻo — tinh gọn mà sang.'),
68:('mqz-hop-qua-hat','Hộp quả & hạt Mộc Quả','1kg · 4 vị','set','mixdeo','mix','MQZ-SETH4-1000','Hạt điều, hạt sen, xoài, dâu','Hộp quà cứng gồm hạt điều, hạt sen, xoài và dâu tây sấy — chọn 600g (3 vị) hoặc 1kg (4 vị).'),
69:('mqz-hop-qua-hat','Hộp quả & hạt Mộc Quả','600g · 3 vị','set','mixdeo','mix','MQZ-SETH3-600',None,None),
70:('mqz-gio-qua-viet','Giỏ quà quả Việt','2,5kg','set','mixdeo','mix','MQZ-SETGIO-2500','4 vị quả sấy · giỏ mây','Giỏ quà 4 loại trái cây sấy tuyển chọn (xoài, chanh dây, thơm, dâu tây) — quà biếu Tết trọn vẹn.'),
71:('mqz-gio-mut-6-vi','Giỏ mứt dẻo 6 vị','650g','set','mixdeo','mix','MQZ-SETG6-650','Xoài, thơm, dâu, vỏ bưởi…','Giỏ mứt 6 vị dẻo truyền thống — xoài, thơm, dâu, vỏ bưởi, hạt dưa — xinh xắn cho quà thăm hỏi.'),
}
SETS={58:['me','dautam','taodo'],59:['xoai','thanhlong','cam'],60:['thom','thom'],61:['duanon','duanon','duanon'],63:['thom','mangcau'],64:['xoai','vobuoi','dudu'],67:['chanhday','gung','dautay'],68:['hatsen','xoai','dautay','hatsen'],69:['hatsen','xoai','dautay'],70:['xoai','chanhday','thom','dautay'],71:['xoai','thom','vobuoi']}
SETNAMES={'me':'Me ngào','dautam':'Dâu tằm','taodo':'Táo đỏ','xoai':'Xoài','thanhlong':'Thanh long','cam':'Cam lát','thom':'Thơm','duanon':'Dừa non','mangcau':'Mãng cầu','vobuoi':'Vỏ bưởi','dudu':'Đu đủ','chanhday':'Chanh dây','gung':'Gừng','dautay':'Dâu tây','hatsen':'Hạt sen'}
def num(s): return int(re.sub(r'\D','',s)) if s else None
def ours(p): return int(math.floor(p*0.95/5000)*5000)
def gram(lbl):
    m=re.search(r'([\d,\.]+)\s*(kg|g)',lbl);v=float(m.group(1).replace(',','.'));return int(v*1000) if m.group(2)=='kg' else int(v)
rows=[];spec=[]
for i,(pid,pn,vl,cat,fr,fl,sku,sub,short) in S.items():
    r=L[i];their=num(r['price']);orig=num(r['orig'])
    w=re.search(r'\(([^)]*)\)',r['h1']).group(1)
    intro=re.sub(r'\s+',' ',r['intro'] or '').strip();d=intro if len(intro)<=260 else intro[:260].rsplit(' ',1)[0]+'…'
    rows.append(dict(idx=i,their_name=r['h1'],weight=w,variants='1 quy cách',their_price=their,their_list_price=orig or '',category=CAT[r['cat']],own_label_packaging=PK[i],short_description=d,url=r['url']))
    spec.append(dict(idx=i,pid=pid,name=pn,variant=vl,cat=cat,fruit=fr,flavour=fl,sku=sku,sub=sub,short=short,their_name=r['h1'],their_price=their,price=ours(their),g=gram(vl if re.search(r'\d',vl) else w),set=SETS.get(i)))
rows.sort(key=lambda x:x['idx'])
with open('/workspace/mocqua/research/dacsancaocap-own-label.csv','w',newline='',encoding='utf-8-sig') as f:
    wr=csv.DictWriter(f,fieldnames=['their_name','weight','variants','their_price','their_list_price','category','own_label_packaging','short_description','url'],extrasaction='ignore');wr.writeheader();wr.writerows(rows)
EX=[(21,'Cóc non — hộp bát giác nhãn bên thứ ba'),(22,'Vỏ bưởi — hộp bát giác nhãn bên thứ ba'),(25,'Hồng dẻo treo — hộp quà thương hiệu khác'),(26,'Hồng sấy dẻo Việt Nhật — hộp thương hiệu khác'),(30,'Cà chua — hộp bát giác nhãn bên thứ ba'),(36,'Táo sấy dẻo — hộp bát giác nhãn bên thứ ba'),(56,'Táo đỏ — túi "Red Dates" thương hiệu khác'),(57,'Khay 6 món khô (khô gà, bò, mực) — không phải trái cây'),(62,'Hộp hạt dinh dưỡng 01 — chỉ có hạt'),(65,'Set 6 món — chủ yếu gạo lứt, kẹo, socola'),(66,'Hộp Mix 8 món — hộp tim "Deluxe Dried Fruits" thương hiệu khác'),(72,'Khay hạt dinh dưỡng 02 — chỉ có hạt')]+[(i,'Hàng nhập khẩu thương hiệu khác (Kirkland, Nuts Talk, Mourad\'s, Palida, TidJai…)') for i in range(105,130)]+[(130,'Cùi bưởi khô — hàng rời, không nhãn riêng')]
with open('/workspace/mocqua/research/dacsancaocap-excluded.csv','w',newline='',encoding='utf-8-sig') as f:
    wr=csv.writer(f);wr.writerow(['their_name','their_price','category_key','reason','url'])
    for i,why in EX: wr.writerow([L[i]['h1'],num(L[i]['price']),L[i]['cat'],why,L[i]['url']])
    wr.writerow(['Trái Cây Tươi Sạch (23 sp)','','tuoi','Trái cây tươi nhập khẩu bán rời theo kg, không đóng gói nhãn riêng','https://dacsancaocap.com/qua-tang-cao-cap-dac-san-tu-cac-vung-mien/trai-cay-tuoi-sach-vn-nk-viet-nam-nhap-khau-dac-san-cao-cap-nafarm-ho-chi-minh-hcm/'])
    wr.writerow(['Trái Cây Cấp Đông (9 sp)','','capdong','Trái cây cấp đông bán rời, ảnh không có nhãn riêng','https://dacsancaocap.com/nguyen-lieu-che-bien-thuc-pham-093-8828-883/trai-cay-cap-dong-lanh-dac-san-nong-san-viet-farm-food-vn/'])
spec.sort(key=lambda x:x['idx'])
json.dump(dict(spec=spec,setnames=SETNAMES),open('/workspace/mocqua/research/mocqua-own-label-spec.json','w'),ensure_ascii=False,indent=1)
from collections import Counter
print(len(rows),Counter(r['category'] for r in rows),len(set(s['pid'] for s in spec)),'products')
