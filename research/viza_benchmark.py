# Giá hàng chính hãng Viza (GoodGood, Yummy, KITA, F&H, Cheers+, hộp giấy) theo chuẩn dacsancaocap.com (18/10/2026).
# Quy tắc chủ shop: bằng giá họ hoặc rẻ hơn 5–9k; khác khối lượng thì quy đổi eq = P_ref*(w/w_ref)^0.88 (gói nhỏ đắt hơn/gram);
# Cheers+ cao hơn GoodGood 3–5k cùng khối lượng; nếu dưới giá vốn×1.3 thì giữ ở mức sàn + khuyến mãi tặng kèm bù.
# Script này ghi giá vào js/data.js (phần nhập tay, ngoài khối MQZ/VZH). Giá hộp giấy VZH nằm trong research/add_vizabox.py.
import re,json
P='/workspace/mocqua/js/data.js'
NEW={'MQ-DXO-100-FHX':35000,'MQ-DXO-100-FHG':35000,'MQ-DXO-200-FHX':69000,'MQ-DXO-200-FHG':69000,'MQ-DXO-500-FHG':165000,'MQ-DXO-500-FHV':165000,'MQ-DXO-500-FH':165000,
 'MQ-DXM-100-FHR':35000,'MQ-DXM-200-FHR':69000,'MQ-DXM-500-FH':165000,
 'MQ-DXO-200-GG':69000,'MQ-DXM-300-GG':100000,'MQ-DXM-200-GG':69000,
 'MQ-DXO-200-FHT':69000,'MQ-DXO-100-GG':35000,'MQ-DXO-150-YM':52000,  # MQ-DCO-080 đã gộp vào MQ-DCM-080-GG
 'MQ-DXC-200-CHA':73000,'MQ-DXO-150-VZ':52000,'MQ-DCM-080-GG':30000,
 'MQ-DXC-250-CHD':89000,'MQ-DXC-250-CHX':89000,'MQ-DXC-300-CHD':105000,'MQ-DXC-300-CHX':105000,
 'MQ-THXO-120-CH':229000,'MQ-THSR-105-YM':245000,
 'MQ-GMI-300-FH':85000,'MQ-GMI-500-FH':140000,
 'MQ-DTH-080-GG':30000,'MQ-DMC-080':55000,'MQ-DME-080-GG':15000,'MQ-DTL-080-GG':35000,'MQ-DDU-080-GG':30000}
# Giá cố định theo quyết định chủ shop (18/10/2026, gấp đôi giá benchmark) — luôn ghi đè NEW, chạy lại không mất.
OVERRIDES={'MQ-GSR-100-GG':110000,'MQ-GSR-100-KT':90000,  # sầu riêng sấy (không phải thăng hoa), giá chủ shop 18/10/2026
 'MQ-THMC-100-GG':149000,  # măng cụt TH GoodGood 100g: chủ shop chốt 149k (benchmark Palida 210g 320k ≈ 152k/100g)
 'MQ-CBX-100-GG':165000,'MQ-CBX-100-FH':165000,'MQ-CBX-100-MIX':165000,  # combo do chủ shop đặt
 'MQ-DME-080-GG':30000,'MQ-DDU-080-GG':60000,'MQ-DTL-080-GG':70000}
NEW.update(OVERRIDES)
s=open(P).read();n=0
for sku,p in NEW.items():
    pat=re.compile(r"(V(?:P\('[a-z]+',)?\(?'"+re.escape(sku)+r"',(?:\"[^\"]*\"|'[^']*'),\d+,(?:'[a-z]+'|null),)(\d+|null)(,)")
    s,k=pat.subn(lambda m:m.group(1)+str(p)+m.group(3),s);assert k==1,(sku,k);n+=k
open(P,'w').write(s);print('updated',n)
