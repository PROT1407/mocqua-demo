/* Mộc Quả — dữ liệu sản phẩm (website DEMO).
   Giá bán lẻ = giá nhà cung cấp × 3 (theo chủ cửa hàng). Không hiển thị giá sỉ.
   p:null  => hiển thị "Liên hệ báo giá".
   maker: nhà sản xuất (MQ.MAKERS) — hiện tại 'viza'; sau này có thể là 'mocqua' (hàng Mộc Quả tự đóng gói). */
window.MQ = window.MQ || {};
MQ.CATS = {
  deo:      {name:'Trái cây sấy dẻo', short:'Sấy dẻo', desc:'Mềm dẻo, giữ trọn vị ngọt của quả chín — ăn vặt mỗi ngày.', img:'products/dx350-45.jpg'},
  thanghoa: {name:'Trái cây sấy thăng hoa', short:'Sấy thăng hoa', desc:'Giòn xốp tan trong miệng, giữ màu và hương gần như quả tươi.', img:'products/tsr105-45.jpg'},
  gion:     {name:'Trái cây sấy giòn', short:'Sấy giòn', desc:'Giòn rụm, thơm lừng — món nhâm nhi cho cả nhà.', img:'products/gm500-45.jpg'},
  hat:  {name:'Hạt dinh dưỡng', short:'Hạt', desc:'Sắp ra mắt', soon:true},
  cafe: {name:'Trà & cà phê', short:'Trà & cà phê', desc:'Sắp ra mắt', soon:true},
  mut:  {name:'Mứt & kẹo truyền thống', short:'Mứt & kẹo', desc:'Sắp ra mắt', soon:true}
};
MQ.FRUITS = {
  xoai:{name:'Xoài'}, saurieng:{name:'Sầu riêng'}, mit:{name:'Mít'}, me:{name:'Me'}, thanhlong:{name:'Thanh long'},
  thom:{name:'Thơm (dứa)'}, dudu:{name:'Đu đủ'}, coc:{name:'Cóc'}, mangcau:{name:'Mãng cầu'}
};
MQ.FLAVOURS = { nguyen:{name:'Nguyên vị'}, muoiot:{name:'Muối ớt'} };
/* Nhà sản xuất & dòng sản phẩm */
MQ.MAKERS = {
  viza:   {name:'Viza Food', site:'vizafood.com', note:'Nhà sản xuất trái cây sấy hơn 10 năm trên thị trường, có mặt tại nhiều hệ thống siêu thị và sân bay trên toàn quốc.'},
  mocqua: {name:'Mộc Quả', soon:true, note:'Dòng Mộc Quả tuyển chọn — trái cây sấy đóng túi zip tại Mộc Quả (sắp ra mắt).'}
};
MQ.LINES = {
  goodgood:{name:'GoodGood', maker:'viza'},
  fh:      {name:'Fresh & Healthy', short:'F&H', maker:'viza'},
  cheers:  {name:'Cheers+', maker:'viza'},
  kita:    {name:'KITA', maker:'viza'},
  yummy:   {name:'Yummy', maker:'viza'},
  mq:      {name:'Mộc Quả tuyển chọn', maker:'mocqua', soon:true}
};
/* V(sku, khối lượng, gram, dòng sp, giá bán lẻ|null, ảnh, ảnh mặt sau, ghi chú) */
const V=(sku,w,g,line,p,img,back,note)=>({sku,w,g,line,p,img:img&&('products/'+img),back:back&&('products/'+back),note});
MQ.PRODUCTS = [
 {id:'xoai-say-deo',name:'Xoài sấy dẻo',cat:'deo',fruit:'xoai',flavour:'nguyen',maker:'viza',rank:1,badge:'Bán chạy',
  variants:[V('MQ-DXO-200-GG','200g',200,'goodgood',90000,'dx200','dx200_back'),V('MQ-DXO-350-FH','350g',350,'fh',150000,'dx350','dx350_back'),V('MQ-DXO-500-FH','500g',500,'fh',180000,'dx500'),V('MQ-DXO-NEW-FH','Bao bì mới',0,'fh',null,'dxnew',null,'Khối lượng đang xác nhận')],
  taste:{ngot:4,chua:2,deo:4,gion:0},
  short:'Lát xoài chín vàng óng, dẻo mềm, chua ngọt hài hoà — món ăn vặt "quốc dân" cho cả nhà.',
  long:'Xoài chín được chọn lọc, thái lát và sấy dẻo để giữ màu vàng tự nhiên cùng vị chua ngọt đặc trưng. Có nhiều quy cách từ gói 200g tiện mang theo đến túi 500g cho gia đình.'},
 {id:'xoai-say-deo-muoi-ot',name:'Xoài sấy dẻo muối ớt',cat:'deo',fruit:'xoai',flavour:'muoiot',maker:'viza',rank:2,badge:'Vị muối ớt',
  variants:[V('MQ-DXM-S-GG','Gói nhỏ',0,'goodgood',null,'dxmogn',null,'Khối lượng đang xác nhận'),V('MQ-DXM-200-GG','200g',200,'goodgood',null,'dxmo200','dxmo200_back'),V('MQ-DXM-300-GG','300g',300,'goodgood',150000,'dxmo300'),V('MQ-DXM-500-FH','500g',500,'fh',213000,'dxmo500','dxmo500_back')],
  taste:{ngot:3,chua:3,deo:4,gion:0},
  short:'Xoài dẻo áo lớp muối ớt mặn mặn cay cay — ăn một miếng là muốn thêm miếng nữa.',
  long:'Vị ngọt của xoài chín gặp vị mặn – cay của muối ớt tạo nên món ăn vặt "gây nghiện", rất hợp để nhâm nhi cùng bạn bè hay làm quà vui.'},
 {id:'xoai-chin-cay',name:'Xoài sấy dẻo chín cây',cat:'deo',fruit:'xoai',flavour:'nguyen',maker:'viza',rank:6,
  variants:[V('MQ-DXC-500-CHD','500g · nhãn đỏ',500,'cheers',null,'dxc500'),V('MQ-DXC-500-CHX','500g · nhãn xanh',500,'cheers',null,'dxc500_green')],
  taste:{ngot:5,chua:1,deo:4,gion:0},
  short:'Xoài chín cây sấy dẻo, ngọt đậm tự nhiên — túi lớn 500g cho gia đình và văn phòng.',
  long:'Chỉ dùng xoài chín tới trên cây nên lát xoài thơm, ngọt sâu và mềm. Bao bì Cheers+ hai màu nhãn đỏ và nhãn xanh.'},
 {id:'xoai-say-thang-hoa',name:'Xoài sấy thăng hoa',cat:'thanghoa',fruit:'xoai',flavour:'nguyen',maker:'viza',rank:5,badge:'Mới lạ',
  variants:[V('MQ-THXO-120-CH','120g',120,'cheers',210000,'tx120')],
  taste:{ngot:4,chua:2,deo:0,gion:5},
  short:'Xoài sấy thăng hoa giòn xốp, tan nhẹ trong miệng, giữ màu và hương xoài gần như tươi.',
  long:'Công nghệ sấy thăng hoa rút nước ở nhiệt độ rất thấp, nhờ vậy miếng xoài giữ được màu sắc, hình dáng và hương vị tự nhiên, cho cảm giác giòn tan rất lạ miệng.'},
 {id:'sau-rieng-say-thang-hoa',name:'Sầu riêng sấy thăng hoa',cat:'thanghoa',fruit:'saurieng',flavour:'nguyen',maker:'viza',rank:3,badge:'Cao cấp',
  variants:[V('MQ-THSR-100-GG','100g',100,'goodgood',150000,'tsr100g','tsr100g_back'),V('MQ-THSR-100-KT','100g',100,'kita',150000,'tsr100k'),V('MQ-THSR-105-YM','105g',105,'yummy',270000,'tsr105')],
  taste:{ngot:5,chua:0,deo:0,gion:5},
  short:'Múi sầu riêng sấy thăng hoa giòn xốp, béo thơm, ít mùi hơn sầu riêng tươi — "vua trái cây" tiện mang theo.',
  long:'Sầu riêng chín được sấy thăng hoa để giữ trọn vị béo ngọt và màu vàng tự nhiên. Miếng sầu riêng giòn xốp, tan trong miệng; túi kín, dễ mang đi du lịch hay làm quà biếu.'},
 {id:'mit-say-gion',name:'Mít sấy giòn',cat:'gion',fruit:'mit',flavour:'nguyen',maker:'viza',rank:4,
  variants:[V('MQ-GMI-300-FH','300g',300,'fh',null,'gm300'),V('MQ-GMI-500-FH','500g',500,'fh',240000,'gm500','gm500_back')],
  taste:{ngot:4,chua:0,deo:0,gion:5},
  short:'Múi mít vàng giòn rụm, thơm lừng mùi mít chín — túi lớn ăn cả nhà.',
  long:'Mít chín được tách múi, sấy giòn để giữ độ xốp và màu vàng tự nhiên. Món ăn vặt quen thuộc, hợp mọi lứa tuổi.'},
 {id:'thom-say-deo',name:'Thơm (dứa) sấy dẻo',cat:'deo',fruit:'thom',flavour:'nguyen',maker:'viza',rank:7,
  variants:[V('MQ-DTH-080-GG','80g',80,'goodgood',60000,'th080')],
  taste:{ngot:4,chua:3,deo:4,gion:0},
  short:'Khoanh thơm sấy dẻo chua ngọt thanh mát — gói 80g nhỏ xinh, giá dễ thương.',
  long:'Thơm chín được cắt khoanh và sấy dẻo, giữ vị chua ngọt tự nhiên. Gói 80g tiện bỏ túi, hợp làm quà nhỏ.'},
 {id:'coc-say-deo',name:'Cóc sấy dẻo',cat:'deo',fruit:'coc',flavour:'nguyen',maker:'viza',rank:8,
  variants:[V('MQ-DCO-080','80g',80,null,60000,'ph-coc')],
  taste:{ngot:3,chua:4,deo:3,gion:1},
  short:'Cóc sấy dẻo chua chua ngọt ngọt, giòn dai nhẹ — vị tuổi thơ trong gói 80g.',
  long:'Cóc được sấy dẻo giữ vị chua thanh đặc trưng. Ảnh bao bì đang được cập nhật.'},
 {id:'mang-cau-say-deo',name:'Mãng cầu sấy dẻo',cat:'deo',fruit:'mangcau',flavour:'nguyen',maker:'viza',rank:9,
  variants:[V('MQ-DMC-080','80g',80,null,120000,'ph-mangcau')],
  taste:{ngot:4,chua:3,deo:4,gion:0},
  short:'Mãng cầu sấy dẻo thơm, chua ngọt dịu — một vị quà khác lạ.',
  long:'Mãng cầu chín được sấy dẻo, giữ hương thơm đặc trưng. Ảnh bao bì đang được cập nhật.'},
 {id:'me-say-deo-muoi-ot',name:'Me sấy dẻo muối ớt',cat:'deo',fruit:'me',flavour:'muoiot',maker:'viza',rank:10,
  variants:[V('MQ-DME-080-GG','80g',80,'goodgood',null,'me080','me080_real')],
  taste:{ngot:3,chua:5,deo:4,gion:0},
  short:'Me dẻo áo muối ớt chua – cay – mặn – ngọt đủ vị, càng ăn càng cuốn.',
  long:'Me được sấy dẻo và tẩm muối ớt, giữ vị chua đặc trưng. Gói 80g (Dried Salted Chili Tamarind).'},
 {id:'thanh-long-say-deo',name:'Thanh long sấy dẻo',cat:'deo',fruit:'thanhlong',flavour:'nguyen',maker:'viza',rank:11,
  variants:[V('MQ-DTL-080-GG','80g',80,'goodgood',null,'tl080')],
  taste:{ngot:3,chua:1,deo:4,gion:0},
  short:'Thanh long ruột đỏ sấy dẻo, màu hồng tím tự nhiên, ngọt nhẹ.',
  long:'Thanh long được sấy dẻo giữ sắc hồng tím tự nhiên. Gói 80g (Dried Dragon).'},
 {id:'du-du-say-deo',name:'Đu đủ sấy dẻo',cat:'deo',fruit:'dudu',flavour:'nguyen',maker:'viza',rank:12,
  variants:[V('MQ-DDU-080-GG','80g',80,'goodgood',null,'dd080')],
  taste:{ngot:4,chua:1,deo:4,gion:0},
  short:'Đu đủ chín sấy dẻo, màu cam tươi, ngọt dịu dễ ăn.',
  long:'Đu đủ chín được cắt miếng và sấy dẻo. Gói 80g (Dried Papaya).'},
 /* ---- Sắp ra mắt: Mộc Quả tuyển chọn (túi zip, đóng gói tại Mộc Quả) ---- */
 {id:'mq-zip-xoai',name:'Xoài sấy dẻo · túi zip',cat:'deo',fruit:'xoai',flavour:'nguyen',maker:'mocqua',soon:true,own:true,
  variants:[V('MQ-ZDXO-500','500g',500,'mq',null,'zip-xoai')],short:'Dòng Mộc Quả tuyển chọn — xoài sấy dẻo đóng túi zip kraft, có cửa sổ nhìn rõ sản phẩm.'},
 {id:'mq-zip-mit',name:'Mít sấy giòn · túi zip',cat:'gion',fruit:'mit',flavour:'nguyen',maker:'mocqua',soon:true,own:true,
  variants:[V('MQ-ZGMI-250','250g',250,'mq',null,'zip-mit')],short:'Dòng Mộc Quả tuyển chọn — mít sấy giòn túi zip, đóng gói tại Mộc Quả.'},
 {id:'mq-zip-saurieng',name:'Sầu riêng thăng hoa · túi zip',cat:'thanghoa',fruit:'saurieng',flavour:'nguyen',maker:'mocqua',soon:true,own:true,
  variants:[V('MQ-ZTHSR-200','200g',200,'mq',null,'zip-saurieng')],short:'Dòng Mộc Quả tuyển chọn — sầu riêng sấy thăng hoa túi zip 200g.'},
 {id:'mq-zip-thom',name:'Thơm sấy dẻo · túi zip',cat:'deo',fruit:'thom',flavour:'nguyen',maker:'mocqua',soon:true,own:true,
  variants:[V('MQ-ZDTH-500','500g',500,'mq',null,'zip-thom')],short:'Dòng Mộc Quả tuyển chọn — thơm sấy dẻo túi zip 500g.'},
 /* ---- Sắp ra mắt: ngành hàng khác ---- */
 {id:'hat-dieu',name:'Hạt điều rang muối',cat:'hat',img:'hat.jpg',variants:[V('','500g',500,null,null)],soon:true,short:'Điều rang củi, vỏ lụa giòn thơm.'},
 {id:'ca-phe',name:'Cà phê Robusta rang mộc',cat:'cafe',img:'caphe.jpg',variants:[V('','500g',500,null,null)],soon:true,short:'Robusta rang mộc, đậm và thơm.'},
 {id:'keo-dua',name:'Kẹo dừa ca cao',cat:'mut',img:'keodua.jpg',variants:[V('','400g',400,null,null)],soon:true,short:'Kẹo dừa truyền thống, gói giấy kiếng xinh xắn.'}
];
/* chuẩn hoá: ảnh chính = ảnh biến thể đầu tiên; sizes = biến thể (tương thích code cũ) */
MQ.PRODUCTS.forEach(p=>{p.sizes=p.variants;if(!p.img)p.img=p.variants[0].img;else p.img=p.img;
  p.lines=[...new Set(p.variants.map(v=>v.line).filter(Boolean))];});
MQ.GIFTS = [
 {id:'hop-an-nhien',name:'Hộp An Nhiên',slots:4,w:'4 món',price:450000,box:'#2b4a3d',ribbon:'#c9a868',items:['xoai-say-deo','thom-say-deo','coc-say-deo','mang-cau-say-deo'],for:['gia-dinh','ban-be'],desc:'Bốn vị dẻo chua ngọt — món quà thăm hỏi nhỏ xinh cho người thân, bạn bè.'},
 {id:'hop-sum-vay',name:'Hộp Sum Vầy',slots:6,w:'6 món',price:790000,box:'#5b4632',ribbon:'#e2c48a',items:['xoai-say-deo','xoai-say-deo-muoi-ot','mit-say-gion','thom-say-deo','coc-say-deo','mang-cau-say-deo'],for:['gia-dinh'],desc:'Đủ dẻo, giòn, muối ớt cho mâm quả ngày đoàn viên.'},
 {id:'hop-phu-quy',name:'Hộp Phú Quý',slots:6,w:'6 món',price:1090000,box:'#7a2e22',ribbon:'#d8b878',items:['sau-rieng-say-thang-hoa','xoai-say-thang-hoa','xoai-say-deo','xoai-say-deo-muoi-ot','mit-say-gion','mang-cau-say-deo'],for:['gia-dinh','doi-tac'],tag:'Tết Đinh Mùi 2027',desc:'Có sầu riêng sấy thăng hoa — vị quà sang được yêu thích. Hộp đỏ son, thiệp thư pháp.'},
 {id:'hop-thinh-vuong',name:'Hộp Thịnh Vượng',slots:9,w:'9 món',price:1490000,box:'#1b1f1d',ribbon:'#b08d57',items:['sau-rieng-say-thang-hoa','xoai-say-thang-hoa','xoai-say-deo','xoai-say-deo-muoi-ot','xoai-chin-cay','mit-say-gion','thom-say-deo','coc-say-deo','mang-cau-say-deo'],for:['doi-tac','sep'],desc:'Trọn bộ sấy dẻo – giòn – thăng hoa trong hộp cứng sang trọng cho đối tác, khách hàng VIP.'}
];
MQ.BOX_OPTIONS = {
  sizes:[{slots:4,name:'Hộp 4 ngăn',fee:90000},{slots:6,name:'Hộp 6 ngăn',fee:120000},{slots:9,name:'Hộp 9 ngăn',fee:160000}],
  colors:[{id:'rung',name:'Xanh rừng',box:'#2b4a3d',ribbon:'#c9a868'},{id:'son',name:'Đỏ son',box:'#7a2e22',ribbon:'#d8b878'},{id:'mun',name:'Đen mun',box:'#1b1f1d',ribbon:'#b08d57'},{id:'nga',name:'Ngà mộc',box:'#d9c8a6',ribbon:'#7a2e22'}]
};
MQ.COUPONS = {
  MOCQUA10:{type:'pct',value:10,max:100000,desc:'Giảm 10% (tối đa 100.000đ)'},
  TET2027:{type:'fixed',value:50000,min:600000,desc:'Giảm 50.000đ cho đơn từ 600.000đ'},
  FREESHIP:{type:'ship',desc:'Miễn phí giao hàng tiêu chuẩn'}
};
MQ.PROVINCES = ['TP. Hồ Chí Minh','Hà Nội','Đà Nẵng','Hải Phòng','Cần Thơ','Huế','An Giang','Bắc Ninh','Cà Mau','Cao Bằng','Đắk Lắk','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Tĩnh','Hưng Yên','Khánh Hòa','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Nghệ An','Ninh Bình','Phú Thọ','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sơn La','Tây Ninh','Thái Nguyên','Thanh Hóa','Tuyên Quang','Vĩnh Long'];
MQ.POSTS = [
 {slug:'5-cach-an-xoai-say-deo',cat:'Thưởng thức',title:'5 cách thưởng thức xoài sấy dẻo ngon hơn bạn nghĩ',img:'products/dx350.jpg',date:'12/10/2026',read:'4 phút',excerpt:'Không chỉ là món ăn vặt: xoài sấy dẻo còn hợp với sữa chua, trà, salad và cả mâm quả Tết.',products:['xoai-say-deo','xoai-say-deo-muoi-ot'],
  body:[['p','Xoài sấy dẻo là món ăn vặt quen thuộc, nhưng chỉ cần thay đổi một chút cách ăn là bạn đã có thêm nhiều trải nghiệm mới. Dưới đây là năm cách đội ngũ Mộc Quả yêu thích.'],['h','1. Ăn trực tiếp cùng trà nóng'],['p','Vị chua ngọt của xoài rất hợp với trà xanh hoặc trà ô long — cân bằng vị chát nhẹ của trà.'],['h','2. Thả vào sữa chua hoặc granola'],['p','Cắt nhỏ lát xoài, trộn cùng sữa chua và hạt cho bữa sáng nhanh mà đủ chất.'],['h','3. Phiên bản muối ớt cho buổi tụ tập'],['p','Xoài sấy dẻo muối ớt mặn mặn cay cay là "vua" của những buổi xem phim, tán gẫu cùng bạn bè.'],['quote','Mẹo nhỏ: đóng kín túi zip sau khi mở để xoài luôn dẻo và thơm.'],['h','4. Trộn salad'],['p','Vài lát xoài dẻo thái sợi làm salad rau xanh thêm vị ngọt tự nhiên.'],['h','5. Bày mâm quả, hộp quà'],['p','Sắc vàng óng của xoài làm mâm quả Tết và hộp quà tặng thêm tươi tắn — kết hợp cùng sầu riêng thăng hoa, mít sấy giòn để đủ vị.']]},
 {slug:'say-lanh-khac-say-nong',cat:'Kiến thức',title:'Sấy dẻo, sấy giòn và sấy thăng hoa khác nhau thế nào?',img:'products/tsr105.jpg',date:'28/09/2026',read:'6 phút',excerpt:'Vì sao cùng là xoài nhưng có loại dẻo, có loại giòn xốp? Hiểu về cách sấy để chọn đúng món mình thích.',products:['xoai-say-thang-hoa','xoai-say-deo','sau-rieng-say-thang-hoa','mit-say-gion'],
  body:[['p','Trái cây sấy ngon hay không phụ thuộc rất nhiều vào cách sấy. Mỗi phương pháp cho ra một kết cấu và hương vị khác nhau.'],['h','Sấy nóng truyền thống'],['p','Dùng nhiệt độ cao để rút nước nhanh. Ưu điểm là nhanh và rẻ, nhưng dễ làm quả sẫm màu và mất bớt hương thơm.'],['h','Sấy lạnh'],['p','Sấy ở nhiệt độ thấp với không khí khô tuần hoàn. Thời gian lâu hơn nhưng giữ được màu sắc và độ dẻo — phù hợp với xoài, thơm, đu đủ — cho ra miếng quả dẻo mềm.'],['h','Sấy thăng hoa (đông khô)'],['p','Quả được cấp đông rồi rút nước trong môi trường chân không. Nước thăng hoa trực tiếp từ đá thành hơi, nên lát quả giữ gần như nguyên hình dáng, màu sắc, và có độ giòn xốp đặc trưng.'],['quote','Mỗi cách sấy hợp với một loại quả — Mộc Quả phân loại rõ Sấy dẻo · Sấy giòn · Sấy thăng hoa để bạn chọn nhanh.'],['h','Chọn thế nào?'],['p','Thích dẻo, đậm vị: chọn sấy dẻo (xoài, thơm, me…). Thích giòn rụm: chọn sấy giòn (mít). Thích giòn xốp tan trong miệng, giữ hương như quả tươi: chọn sấy thăng hoa (sầu riêng, xoài).']]},
 {slug:'goi-y-qua-tet-doanh-nghiep',cat:'Quà tặng',title:'Gợi ý quà Tết doanh nghiệp 2027: tinh tế, đúng ngân sách',img:'cho.jpg',date:'15/09/2026',read:'4 phút',excerpt:'Checklist chọn quà Tết cho đối tác và nhân viên: ngân sách, thời gian đặt, cá nhân hoá và giao hàng theo danh sách.',products:['hop-phu-quy','hop-thinh-vuong'],
  body:[['p','Quà Tết doanh nghiệp không chỉ là món quà — đó là lời chào năm mới mang hình ảnh thương hiệu của bạn. Dưới đây là vài gợi ý để chọn quà vừa tinh tế vừa đúng ngân sách.'],['h','Chốt ngân sách và số lượng sớm'],['p','Thời điểm lý tưởng để đặt quà Tết là 6–8 tuần trước Tết. Đặt sớm giúp bạn có nhiều lựa chọn mẫu hộp và thời gian in ấn logo.'],['h','Cá nhân hoá vừa đủ'],['p','Một tấm thiệp viết tay tên người nhận, logo ép kim nhỏ trên nắp hộp — chừng đó đủ để món quà trở nên riêng tư mà không phô trương.'],['h','Giao theo danh sách'],['p','Gửi cho chúng tôi danh sách người nhận, Mộc Quả sẽ giao tận nơi, chụp ảnh xác nhận và gửi báo cáo cho bộ phận hành chính.'],['quote','Ưu đãi demo: đơn từ 50 hộp được tặng thiệp thư pháp viết tay cho từng người nhận.']]}
];
MQ.REVIEWS = [
 {name:'Chị Thu Hà',city:'Hà Nội',rating:5,text:'Sầu riêng sấy thăng hoa giòn tan, béo mà không ngấy. Mua làm quà cho đồng nghiệp ai cũng hỏi mua ở đâu.',product:'Sầu riêng sấy thăng hoa'},
 {name:'Anh Minh Khoa',city:'TP. Hồ Chí Minh',rating:5,text:'Công ty đặt hộp quà Tết cho đối tác, Mộc Quả tư vấn kỹ, giao đúng danh sách.',product:'Quà doanh nghiệp'},
 {name:'Chị Ngọc Lan',city:'Đà Nẵng',rating:5,text:'Xoài sấy dẻo muối ớt cay vừa, con gái tôi mê. Túi 500g ăn được lâu.',product:'Xoài sấy dẻo muối ớt'},
 {name:'Anh Quốc Bảo',city:'Cần Thơ',rating:4,text:'Mít sấy giòn thơm, giòn đều. Mong shop có thêm túi zip nhỏ để mang đi làm.',product:'Mít sấy giòn'},
 {name:'Chị Hoài An',city:'Huế',rating:5,text:'Tự chọn hộp quà trên web rất vui, thiệp viết đúng lời mình gửi. Mẹ chồng rất thích.',product:'Hộp quà tự chọn'}
];
MQ.SEASONS = [ // tháng 1..12 — mùa quả tươi (tham khảo); sản phẩm sấy có quanh năm
 {name:'Xoài',m:[3,4,5,6]},{name:'Sầu riêng',m:[5,6,7,8]},{name:'Mít',m:[1,2,3,4,5,6,7,8,9,10,11,12]},{name:'Thanh long',m:[1,2,3,4,5,6,7,8,9,10,11,12]},{name:'Thơm (dứa)',m:[3,4,5,6,7]},{name:'Mãng cầu',m:[7,8,9,10]},{name:'Me',m:[12,1,2,3]}
];
