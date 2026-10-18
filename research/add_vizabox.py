# Thêm 5 sản phẩm hộp giấy 100g Viza Food + combo. Idempotent: thay khối VZH-BEGIN/END trong js/data.js.
# Giá bán lẻ = giá nhà cung cấp × 2 (riêng nhóm này, theo chủ cửa hàng). KHÔNG ghi giá nhà cung cấp lên site.
import json,re
P='/workspace/mocqua/js/data.js'
CR=json.load(open('/workspace/mocqua/assets/desc/credits.json'))
def img(k,alt,cap=None):
    c=CR[k];a=c['author'] or 'Wikimedia Commons'
    d={'src':f'desc/{k}.jpg','alt':alt,'credit':f"Ảnh: {a} · {c['license']} · Wikimedia Commons",'href':c['url']}
    if cap:d['cap']=cap
    return d
HSD='Thường 6–12 tháng kể từ ngày sản xuất (giá trị điển hình) — ngày cụ thể in trên hộp'
def spec(name_on_box,tp,ket):
    return [['Thương hiệu','Viza Food (hàng chính hãng, nguyên hộp)'],['Tên in trên hộp',name_on_box],['Khối lượng tịnh','KLT 100g'],
            ['Quy cách đóng gói','Hộp giấy đứng, in tranh minh hoạ — giữ nguyên bao bì gốc'],['Thành phần',tp+' (giá trị điển hình — xem nhãn phụ trên hộp)'],
            ['Kết cấu',ket],['Hạn sử dụng',HSD],['Bảo quản','Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp']]
GIFT_TAIL='Mộc Quả gói quà và viết thiệp tay miễn phí, nên bạn chỉ cần chọn vị, phần còn lại để chúng tôi lo.'
PRODS=[
 dict(id='vz-hat-sen-say',name='Hạt sen sấy giòn Viza Food',cat='hat',fruit='hatsen',flavour='nguyen',rank=40,badge='Hộp giấy 100g',
  sku='MQ-HHS-100-VZ',p=114000,img='vzh-sen',taste=dict(ngot=2,chua=0,deo=0,gion=5),
  short='Hạt sen sấy giòn tan, bùi và thơm nhẹ mùi sen — hộp giấy 100g chính hãng Viza Food, đẹp để biếu.',
  long='Hạt sen già sấy tới khi giòn xốp từ vỏ vào lõi: vị bùi, ngọt rất nhẹ, mùi sen thoang thoảng. Hộp giấy 100g Viza Food “Giòn Tan – Thơm Nhẹ”, bán nguyên hộp.',
  desc=dict(intro='Hạt sen sấy giòn là món chúng tôi hay mời khách nếm đầu tiên mỗi khi khui hộp mới. Cắn một hạt nghe tiếng “rộp” rất khẽ, rồi vị bùi và mùi sen thoang thoảng mới tới sau. Hộp 100g của Viza Food làm đúng điều dòng chữ trên hộp hứa hẹn: Giòn Tan – Thơm Nhẹ.',
   img=img('raw-hatsen','Gương sen khô — nơi hạt sen lớn lên'),
   sec=[dict(k='huong',h='Hương vị',p=['Hạt sen sấy giòn khác hẳn hạt sen khô dùng để nấu chè: hạt xốp đều từ vỏ vào lõi, không cứng răng, ăn liền được. Vị chủ đạo là vị bùi của hạt sen già, ngọt rất nhẹ nên ăn mãi không ngấy.','Người thích đồ ăn vặt “sạch vị”, không quá ngọt hay quá mặn, thường mê hạt sen ngay từ hộp đầu tiên.']),
        dict(k='nguon',h='Nguồn gốc',p=['Việt Nam có những vùng sen đã thành tên tuổi như Đồng Tháp hay Huế. Hạt sen được tách khỏi gương lúc đã già, sơ chế rồi sấy cho tới khi giòn. Công đoạn này tốn công, nhất là khâu tách hạt, nên hạt sen chưa bao giờ là món rẻ.','Vùng nguyên liệu và nơi sản xuất của từng lô được Viza Food in trên nhãn phụ. Mộc Quả bán nguyên hộp, không sang chiết, không dán đè.'],img=img('land-dongthap','Đầm sen miền Tây','Đầm sen miền Tây')),
        dict(k='spec',h='Thông tin sản phẩm',spec=spec('Hạt sen sấy · Dried Lotus Seeds','Hạt sen sấy','Giòn xốp, ăn liền')),
        dict(k='dung',h='Bảo quản & dùng',p=['Ăn liền như một món snack, nhâm nhi cùng trà sen hay trà xanh. Rắc lên sữa chua, chè hay bát ngũ cốc buổi sáng cũng rất hợp.','Đồ sấy giòn sợ nhất là hơi ẩm. Mở hộp rồi thì nên đổ phần còn lại vào hũ có nắp kín, để nơi khô mát, và dùng trong khoảng 1–2 tuần để hạt còn giòn như lúc mới mở.']),
        dict(k='qua',h='Hợp làm quà',p=['Hộp giấy đứng vẽ tranh đầm sen, cầm lên là thấy chỉn chu, đủ đẹp để biếu mà không cần gói thêm. Một hộp vừa làm quà nhỏ cho đồng nghiệp; ghép cùng hạt điều, macca hay dẻ cười là thành một phần quà Tết gọn gàng. '+GIFT_TAIL])])),
 dict(id='vz-hat-de-cuoi',name='Hạt dẻ cười Viza Food',cat='hat',fruit='decuoi',flavour='nguyen',rank=41,badge='Hộp giấy 100g',
  sku='MQ-HDC-100-VZ',p=130000,img='vzh-decuoi',taste=dict(ngot=1,chua=0,deo=0,gion=4),
  short='Hạt dẻ cười rang chín, vỏ nứt sẵn, nhân béo bùi — hộp giấy 100g Viza Food “Vị Béo – Hạnh Phúc”.',
  long='Hạt dẻ cười rang chín, vỏ nứt miệng dễ tách, nhân xanh vàng béo bùi và thơm. Hộp giấy 100g chính hãng Viza Food, bán nguyên hộp.',
  desc=dict(intro='Người ta gọi là “dẻ cười” vì khi chín, vỏ hạt tự nứt hé như một nụ cười. Còn với chúng tôi, đó là món ăn vặt khiến cả bàn trà chậm lại: ai cũng phải tách từng hạt, nhai từ tốn, rồi lại với tay lấy hạt tiếp theo. Hộp 100g của Viza Food có dòng chữ “Vị Béo – Hạnh Phúc”, nghe thì vui nhưng khá đúng.',
   img=img('raw-pistachio','Hạt dẻ cười rang, vỏ nứt sẵn'),
   sec=[dict(k='huong',h='Hương vị',p=['Hạt rang chín tới nên nhân giòn chắc, béo bùi, có mùi thơm rang rất riêng mà loại hạt khác không có. Vỏ nứt sẵn nên tách bằng tay rất dễ, không cần dụng cụ.','Mẹo nhỏ của người bán lâu năm: hạt nào vỏ khép kín thì dùng nửa vỏ của hạt đã ăn làm “chìa”, lách vào khe và xoay nhẹ là mở được.']),
        dict(k='nguon',h='Nguồn gốc',p=['Cây dẻ cười ưa khí hậu khô, nắng gắt. Phần lớn hạt dẻ cười trên thị trường Việt Nam được nhập từ những vùng trồng lớn như Mỹ hay Iran rồi rang, đóng gói trong nước. Đây là loại hạt có giá cao trong nhóm hạt dinh dưỡng, vì cây cần nhiều năm mới cho trái ổn định.','Xuất xứ nguyên liệu của từng lô được ghi trên nhãn phụ của Viza Food; chúng tôi giữ nguyên hộp để bạn kiểm tra.'],img=img('tree-pistachio','Chùm hạt dẻ cười trên cây','Hạt dẻ cười trên cây')),
        dict(k='spec',h='Thông tin sản phẩm',spec=spec('Hạt dẻ cười · Pistachios','Hạt dẻ cười rang, có thể có muối','Nguyên vỏ nứt sẵn, nhân giòn chắc')),
        dict(k='dung',h='Bảo quản & dùng',p=['Ngon nhất khi nhâm nhi cùng trà, cà phê hay một ly vang. Nhân dẻ cười bóc sẵn còn có thể rắc lên kem, bánh, sữa chua cho đẹp và thơm.','Sau khi mở hộp, cho hạt vào hũ hoặc túi kín, để nơi khô mát, tránh nắng; dùng trong khoảng 2–3 tuần để hạt giữ độ giòn và không bị ỉu dầu.']),
        dict(k='qua',h='Hợp làm quà',p=['Hạt dẻ cười gần như luôn có mặt trong khay bánh kẹo ngày Tết. Cái tên vui, ý nghĩa “cười nhiều” nên rất hợp để chúc. Hộp giấy vẽ tranh đồi cây và hai em nhỏ ngồi bóc hạt, trông ấm áp mà không phô trương. '+GIFT_TAIL])])),
 dict(id='vz-hat-macca-say',name='Hạt macca sấy nứt vỏ Viza Food',cat='hat',fruit='macca',flavour='nguyen',rank=42,badge='Hộp giấy 100g',
  sku='MQ-HMC-100-VZ',p=54000,img='vzh-macca',taste=dict(ngot=2,chua=0,deo=0,gion=3),
  short='Macca sấy nứt vỏ, nhân béo ngậy, bùi thơm — hộp giấy 100g Viza Food “Nứt Vỏ – Bùi Thơm”.',
  long='Hạt macca nguyên vỏ được sấy và khía nứt sẵn, tách nhẹ là ra nhân trắng ngà, béo ngậy và bùi. Hộp giấy 100g chính hãng Viza Food, giá dễ thử.',
  desc=dict(intro='Nếu phải chọn một loại hạt “béo” nhất, nhiều khách của chúng tôi sẽ chọn macca. Nhân trắng ngà, cắn vào giòn rồi tan dần thành vị béo ngậy, bùi bùi, thơm thoảng như sữa. Hộp 100g Viza Food “Nứt Vỏ – Bùi Thơm” là cách dễ nhất để thử macca mà không phải mua cả túi lớn.',
   img=img('raw-macca','Hạt macca nguyên vỏ và tách vỏ'),
   sec=[dict(k='huong',h='Hương vị',p=['Vỏ macca rất cứng, nên hạt được khía một đường nứt sẵn trước khi sấy. Chỉ cần lách nhẹ là nhân bật ra nguyên vẹn. Nhân sấy chín có độ giòn vừa phải, càng nhai càng béo, hậu vị ngọt nhẹ tự nhiên.','Đây là kiểu hạt ăn chậm: tách một hạt, nhấp một ngụm trà, chuyện trò thêm một chút.']),
        dict(k='nguon',h='Nguồn gốc',p=['Macca có quê gốc ở Úc, và vài năm gần đây được trồng ngày càng nhiều ở Tây Nguyên như Lâm Đồng, Đắk Lắk. Cây cần nhiều năm mới cho trái, vỏ cứng phải tách bằng máy chuyên dụng, nên macca vẫn được xếp vào nhóm hạt cao cấp.','Nguồn nguyên liệu cụ thể của từng lô được in trên nhãn phụ của Viza Food. Mộc Quả nhập và bán nguyên hộp.'],img=img('tree-macca','Chùm quả macca xanh trên cây','Quả macca trên cây')),
        dict(k='spec',h='Thông tin sản phẩm',spec=spec('Hạt macca sấy · Dried Macadamia Nuts','Hạt macca sấy','Nguyên vỏ khía nứt sẵn, nhân giòn béo')),
        dict(k='dung',h='Bảo quản & dùng',p=['Ăn trực tiếp, hoặc tách nhân để làm sữa hạt, rắc lên salad, granola. Nếu hộp có kèm khoá tách vỏ thì dùng khoá; không có thì một chiếc thìa inox lách vào khe nứt rồi xoay nhẹ là đủ.','Macca nhiều dầu tự nhiên nên rất sợ nóng và ẩm. Sau khi mở, đậy kín, để nơi khô mát hoặc ngăn mát tủ lạnh, dùng trong khoảng 2–3 tuần.']),
        dict(k='qua',h='Hợp làm quà',p=['Hộp tranh vườn macca và ngôi nhà nhỏ trên đồi, giá vừa phải mà vẫn trang trọng. Rất hợp để ghép thành hộp quà nhiều vị, hoặc tặng người lớn tuổi thích món hạt béo, mềm vừa răng. '+GIFT_TAIL])])),
 dict(id='vz-dua-say-gion',name='Dừa sấy giòn Viza Food',cat='gion',fruit='dua',flavour='nguyen',rank=43,badge='Hộp giấy 100g',
  sku='MQ-GDU-100-VZ',p=52000,img='vzh-dua',taste=dict(ngot=3,chua=0,deo=0,gion=5),
  short='Lát cơm dừa sấy giòn rụm, ngọt nhẹ, thơm béo — hộp giấy 100g Viza Food “Ngọt Ngào – Thanh Mát”.',
  long='Cơm dừa già thái lát mỏng, sấy tới khi giòn rụm và vàng nhẹ ở mép. Ngọt vừa, thơm béo mùi dừa. Hộp giấy 100g chính hãng Viza Food.',
  desc=dict(intro='Dừa sấy giòn là món mà trẻ con và người lớn đều “xử” hết một hộp lúc nào không hay. Lát cơm dừa mỏng, giòn rụm, mép hơi vàng, thơm mùi dừa nướng, ngọt vừa phải chứ không gắt. Viza Food in trên hộp: Ngọt Ngào – Thanh Mát, đúng tinh thần của một món ăn vặt nhẹ nhàng.',
   img=img('raw-dua','Trái dừa nguyên và dừa bổ đôi'),
   sec=[dict(k='huong',h='Hương vị',p=['Miếng dừa sấy giòn ngon là miếng cắn vào nghe giòn tan, không dai, không cứng. Vị béo tự nhiên của cơm dừa già được sấy lên thơm hơn, cuối miệng còn ngọt nhẹ và mùi dừa rất rõ.','Ăn không khô miệng như bánh snack chiên, nên hợp cho cả những buổi chiều muốn ăn gì đó “cho vui miệng”.']),
        dict(k='nguon',h='Nguồn gốc',p=['Nói tới dừa là nghĩ tới miền Tây, đặc biệt là Bến Tre, nơi dừa gắn với đời sống từng nhà. Dừa sấy giòn làm từ cơm dừa già, cùi dày; dừa được tách cơm, thái lát mỏng rồi sấy chậm để giòn mà không cháy.','Thông tin vùng nguyên liệu, cơ sở sản xuất từng lô có trên nhãn phụ của Viza Food. Chúng tôi giữ nguyên hộp gốc.'],img=img('land-bentre','Kênh rạch rợp bóng dừa miền Tây','Rặng dừa miền Tây')),
        dict(k='spec',h='Thông tin sản phẩm',spec=spec('Dừa sấy giòn · Crispy Dried Coconut','Cơm dừa, đường','Lát mỏng giòn rụm')),
        dict(k='dung',h='Bảo quản & dùng',p=['Ăn liền; rắc lên sữa chua, chè, kem hay bát yến mạch cho thêm giòn và thơm. Cũng rất hợp để bày đĩa mời khách cùng hạt sen, hạt điều.','Mở hộp rồi thì cho vào hũ kín ngay, để nơi khô mát, tránh nắng. Dừa sấy hút ẩm nhanh, nên dùng trong khoảng 1–2 tuần để lát dừa còn giòn.']),
        dict(k='qua',h='Hợp làm quà',p=['Hộp tranh bãi biển rặng dừa, màu ấm và vui mắt. Giá nhẹ nhàng, rất hợp làm quà cho các bé, quà văn phòng, hoặc ghép vào hộp quà Tết cho thêm một vị ngọt thanh. '+GIFT_TAIL])])),
 dict(id='vz-hat-dieu-rang-muoi',name='Hạt điều rang muối Viza Food',cat='hat',fruit='dieu',flavour='nguyen',rank=44,badge='Hộp giấy 100g',
  sku='MQ-HDR-100-VZ',p=70000,img='vzh-dieu',taste=dict(ngot=1,chua=0,deo=0,gion=4),
  short='Hạt điều rang muối giòn bùi, mặn vừa, đậm đà — hộp giấy 100g Viza Food “Mặn Mà – Đậm Đà”.',
  long='Hạt điều Việt Nam rang chín vàng, áo lớp muối mỏng vừa miệng. Nhân giòn, bùi, càng nhai càng đậm vị. Hộp giấy 100g chính hãng Viza Food.',
  desc=dict(intro='Hạt điều là loại hạt mà người Việt có quyền tự hào: Việt Nam nhiều năm liền là một trong những nước xuất khẩu điều lớn nhất thế giới. Hộp hạt điều rang muối 100g này của Viza Food đúng như tên gọi “Mặn Mà – Đậm Đà”: hạt rang vàng, giòn, mặn vừa đủ để thấy vị bùi béo của điều.',
   img=img('raw-dieu','Đĩa hạt điều rang'),
   sec=[dict(k='huong',h='Hương vị',p=['Hạt điều rang muối ngon là khi cắn vào giòn đều, không ỉu, không khét. Lớp muối chỉ đủ “đánh thức” vị béo của nhân, không mặn chát. Ăn vài hạt là hiểu vì sao điều luôn có mặt trên bàn nhậu, bàn trà và cả khay bánh Tết.']),
        dict(k='nguon',h='Nguồn gốc',p=['Cây điều được trồng nhiều ở Đông Nam Bộ và Tây Nguyên, nổi tiếng nhất là Bình Phước. Hạt điều nằm ngoài trái, dưới “quả giả” màu đỏ cam. Để có nhân trắng ăn được, hạt phải qua nhiều bước hấp, tách vỏ cứng, bóc vỏ lụa rồi mới rang. Phần nhiều vẫn cần bàn tay người làm, nên điều ngon không bao giờ rẻ.','Vùng nguyên liệu và nơi sản xuất từng lô có trên nhãn phụ Viza Food. Mộc Quả bán nguyên hộp gốc.'],img=img('raw-hat','Trái điều chín trên cây','Trái điều trên cây')),
        dict(k='spec',h='Thông tin sản phẩm',spec=spec('Hạt điều rang muối · Salted Roasted Cashews','Hạt điều, muối','Nhân nguyên, giòn bùi')),
        dict(k='dung',h='Bảo quản & dùng',p=['Ăn trực tiếp, nhâm nhi cùng trà, bia; hoặc giã dập rắc lên gỏi, xôi, salad. Người ăn nhạt có thể ăn kèm dừa sấy giòn để cân vị.','Sau khi mở, đậy kín, để nơi khô mát, tránh nắng; dùng trong khoảng 2–3 tuần để hạt không bị ỉu và không hôi dầu.']),
        dict(k='qua',h='Hợp làm quà',p=['Hộp tranh người nông dân thu hoạch điều bên vườn, đậm chất Việt, rất hợp làm quà cho bạn bè ở xa hay đối tác nước ngoài. Ghép cùng hạt sen, macca, dẻ cười là thành một hộp quà hạt đủ vị. '+GIFT_TAIL])])),
]
NM={'vz-hat-sen-say':'Hạt sen sấy giòn','vz-hat-de-cuoi':'Hạt dẻ cười','vz-hat-macca-say':'Hạt macca sấy nứt vỏ','vz-dua-say-gion':'Dừa sấy giòn','vz-hat-dieu-rang-muoi':'Hạt điều rang muối'}
SUM=sum(p['p'] for p in PRODS);CP=395000;assert 0.05<=1-CP/SUM<=0.08,(SUM,CP)
COMBO=dict(id='vz-combo-5-hop-hat',name='Combo 5 hộp hạt Viza Food',cat='hat',fruit='mix',flavour='mix',rank=39,badge=f'Combo −{round((1-CP/SUM)*100)}%',
  box='boxes',contents=[[NM[p['id']]+' (hộp giấy)',100] for p in PRODS],occ=['Quà Tết','Quà biếu đối tác','Khay mời khách','Ăn vặt văn phòng'],
  short=f'Đủ 5 hộp giấy 100g Viza Food: hạt sen, dẻ cười, macca, dừa sấy giòn, hạt điều — giá combo {CP//1000}.000đ, tiết kiệm hơn mua lẻ.',
  long='Bộ 5 hộp giấy 100g chính hãng Viza Food, mỗi hộp một vị, gom lại thành một phần quà hạt đủ đầy.',
  desc=dict(intro='Khách hay hỏi chúng tôi: “Nên lấy hộp nào?” Câu trả lời thật lòng là mỗi hộp một cái ngon, nên chúng tôi gom cả năm hộp vào một combo. Giòn tan của hạt sen, béo của dẻ cười, bùi ngậy của macca, ngọt thanh của dừa sấy và đậm đà của điều rang muối: đủ vị cho một bàn trà, một khay Tết, hay một món quà không phải đắn đo.',
   img={'src':'products/vzh-combo5','alt':'Năm hộp giấy Viza Food: hạt sen, hạt dẻ cười, macca, dừa sấy giòn, hạt điều','credit':'Ảnh chụp hàng thật tại Mộc Quả'},
   sec=[dict(k='huong',h='Trong combo có gì',li=['Hạt sen sấy, Giòn Tan – Thơm Nhẹ','Hạt dẻ cười, Vị Béo – Hạnh Phúc','Hạt macca sấy, Nứt Vỏ – Bùi Thơm','Dừa sấy giòn, Ngọt Ngào – Thanh Mát','Hạt điều rang muối, Mặn Mà – Đậm Đà'],p=['Mỗi hộp 100g, giữ nguyên bao bì gốc của Viza Food. Bạn có thể xem mô tả chi tiết từng vị ở trang sản phẩm lẻ.']),
        dict(k='spec',h='Thông tin sản phẩm',spec=[['Thương hiệu','Viza Food (hàng chính hãng, nguyên hộp)'],['Gồm','5 hộp giấy × KLT 100g (tổng 500g)'],['Quy cách đóng gói','Hộp giấy đứng in tranh, giữ nguyên bao bì gốc'],['Hạn sử dụng',HSD],['Bảo quản','Nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp']]),
        dict(k='dung',h='Bảo quản & dùng',p=['Mở hộp nào dùng hộp đó; phần còn lại đổ vào hũ kín, để nơi khô mát. Hộp chưa mở cứ để nguyên, xếp đứng cho đẹp như trên kệ.']),
        dict(k='qua',h='Hợp làm quà',p=['Năm hộp đứng cạnh nhau là năm bức tranh nhỏ: đầm sen, đồi dẻ cười, vườn macca, bãi dừa, vườn điều. Không cần gói cầu kỳ vẫn rất trang trọng. Mộc Quả xếp sẵn và viết thiệp tay miễn phí theo lời bạn dặn.'])]))
def js(o):return json.dumps(o,ensure_ascii=False)
def line(p):
    v=f"V('{p['sku']}','100g · hộp giấy',100,'vizabox',{p['p']},'{p['img']}')"
    meta={k:p[k] for k in ['id','name','cat','fruit','flavour']};
    s='{'+','.join(f'{k}:{js(v_)}' for k,v_ in meta.items())+f",maker:'viza',vizabox:true,rank:{p['rank']},badge:{js(p['badge'])},variants:[{v}],gallery:['products/{p['img']}','products/vzh-combo5'],taste:{js(p['taste'])},short:{js(p['short'])},long:{js(p['long'])},desc:{js(p['desc'])}}}"
    return s
c=COMBO
cl='{'+','.join(f'{k}:{js(c[k])}' for k in ['id','name','cat','fruit','flavour'])+f",maker:'viza',vizabox:true,rank:{c['rank']},badge:{js(c['badge'])},box:'boxes',contents:{js(c['contents'])},occ:{js(c['occ'])},variants:[V('MQ-CBH-5X100-VZ','Combo 5 hộp · 5 × 100g',500,'vizabox',{CP},'vzh-combo5')],gallery:['products/vzh-combo5',{','.join(js('products/'+p['img']) for p in PRODS)}],short:{js(c['short'])},long:{js(c['long'])},desc:{js(c['desc'])}}}"
block='/* ==== VZH-BEGIN: Viza Food hộp giấy 100g (sinh bởi research/add_vizabox.py) ==== */\n '+',\n '.join([line(p) for p in PRODS]+[cl])+',\n/* ==== VZH-END ==== */\n'
s=open(P).read()
if 'VZH-BEGIN' in s: s=re.sub(r'/\* ==== VZH-BEGIN.*?VZH-END ==== \*/\n',lambda m:block,s,flags=re.S)
else: s=s.replace('/* ==== MQZ-END ==== */\n','/* ==== MQZ-END ==== */\n'+block,1)
# bỏ sản phẩm "sắp ra mắt" hạt điều cũ
s=re.sub(r" \{id:'hat-dieu',name:'Hạt điều rang muối',cat:'hat'[^\n]*\n",'',s)
s=re.sub(r"  hat:  \{name:'Hạt dinh dưỡng'[^\n]*\n","  hat:      {name:'Hạt dinh dưỡng', short:'Hạt', desc:'Hạt sen, dẻ cười, macca, hạt điều — hộp giấy 100g chính hãng Viza Food, giòn bùi, đẹp để biếu.', img:'products/vzh-combo5-45.jpg'},\n",s)
if 'vizabox:' not in s.split('MQ.PRODUCTS')[0]:
    s=s.replace("  yummy:   {name:'Yummy', maker:'viza'}","  yummy:   {name:'Yummy', maker:'viza'},\n  vizabox: {name:'Viza Food · hộp giấy', short:'Hộp giấy', maker:'viza'}")
if 'decuoi:' not in s:
    s=s.replace("tao:{name:'Táo'},","tao:{name:'Táo'}, dua:{name:'Dừa'}, dieu:{name:'Hạt điều'}, decuoi:{name:'Hạt dẻ cười'}, macca:{name:'Hạt macca'},")
s=s.replace("   Giá bán lẻ = giá nhà cung cấp × 3 (theo chủ cửa hàng). Không hiển thị giá sỉ.","   Giá bán lẻ = giá nhà cung cấp × 3 (theo chủ cửa hàng); riêng nhóm Viza hộp giấy 100g (VZH) = × 2. Không hiển thị giá sỉ.")
open(P,'w').write(s);print('ok',SUM,CP,round((1-CP/SUM)*100,2))
