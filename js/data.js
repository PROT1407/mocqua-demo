/* Mộc Quả — dữ liệu mẫu (DEMO). Giá là giá demo, chưa phải giá bán chính thức. */
window.MQ = window.MQ || {};
MQ.CATS = {
  deo:  {name:'Trái cây sấy dẻo', short:'Sấy dẻo', desc:'Mềm dẻo, giữ trọn vị ngọt tự nhiên của quả chín.'},
  gion: {name:'Trái cây sấy giòn', short:'Sấy giòn', desc:'Giòn tan, nhẹ bụng — món ăn vặt thanh lịch.'},
  mix:  {name:'Hộp mix & combo', short:'Hộp mix', desc:'Nhiều vị trong một hộp, tiện biếu tặng.'},
  tra:  {name:'Trà trái cây sấy', short:'Trà trái cây', desc:'Lát quả sấy dùng pha trà, decor bàn tiệc.'},
  hat:  {name:'Hạt dinh dưỡng', short:'Hạt', desc:'Sắp ra mắt', soon:true},
  cafe: {name:'Trà & cà phê', short:'Trà & cà phê', desc:'Sắp ra mắt', soon:true},
  mut:  {name:'Mứt & kẹo truyền thống', short:'Mứt & kẹo', desc:'Sắp ra mắt', soon:true}
};
MQ.REGIONS = {
  dalat:   {name:'Đà Lạt', area:'Tây Nguyên', note:'Cao nguyên sương mù, khí hậu ôn đới — quê hương của hồng, dâu tây và khoai lang mật.', x:62, y:72},
  mientay: {name:'Miền Tây', area:'Đồng bằng sông Cửu Long', note:'Phù sa màu mỡ, trái cây bốn mùa: xoài Cát Chu, mít, chuối xiêm, tắc.', x:44, y:90},
  binhthuan:{name:'Bình Thuận', area:'Duyên hải Nam Trung Bộ', note:'Nắng gió và đồi cát — vùng thanh long ruột đỏ nổi tiếng.', x:70, y:80},
  hungyen: {name:'Hưng Yên', area:'Đồng bằng sông Hồng', note:'Đất của nhãn lồng tiến vua, cùi dày, ngọt sắc.', x:44, y:16},
  lucngan: {name:'Lục Ngạn', area:'Trung du Bắc Bộ', note:'Vải thiều chín đỏ đồi mỗi độ tháng Sáu.', x:47, y:10},
  nhieuvung:{name:'Nhiều vùng', area:'Tuyển chọn', note:'Phối từ nhiều vùng quả.', x:56, y:50}
};
const S=(w,p,old)=>({w,p,old});
MQ.PRODUCTS = [
 {id:'hong-treo-gio',name:'Hồng treo gió Đà Lạt',cat:'deo',region:'dalat',origin:'Đà Lạt',img:'hong.jpg',gallery:['hong2.jpg','hong3.jpg'],sizes:[S('500g',345000,390000),S('1kg',650000,740000)],badge:'Bán chạy nhất',rating:4.9,reviews:128,sold:2140,taste:{ngot:5,chua:1,deo:5,gion:0},season:'Tháng 10 – Tháng 2',isNew:false,featured:1,
  short:'Hồng chín gọt tay, treo gió và xoa nhẹ mỗi ngày theo cách làm truyền thống — dẻo mịn, lớp phấn đường tự nhiên phủ trắng.',
  long:'Mỗi mùa hồng, chúng tôi chọn những trái hồng giòn chín tới trên các triền đồi Đà Lạt. Hồng được gọt vỏ bằng tay, treo trên giàn tre ở nơi thoáng gió, và được xoa nhẹ mỗi ngày để thịt quả mềm đều. Sau nhiều tuần, đường tự nhiên kết tinh thành lớp phấn trắng mỏng — dấu hiệu của một mẻ hồng treo gió đạt chuẩn.'},
 {id:'xoai-say-deo',name:'Xoài Cát Chu sấy dẻo',cat:'deo',region:'mientay',origin:'Cát Chu · Đồng Tháp',img:'xoai2.jpg',gallery:['xoai.jpg'],sizes:[S('250g',129000),S('500g',245000),S('1kg',470000)],badge:'',rating:4.8,reviews:96,sold:1830,taste:{ngot:4,chua:3,deo:4,gion:0},season:'Quanh năm',featured:2,
  short:'Xoài Cát Chu chín cây, thái lát dày vừa, sấy lạnh giữ sắc vàng óng và vị chua ngọt hài hoà.',
  long:'Xoài Cát Chu có thớ thịt mịn, hương thơm đặc trưng và vị chua thanh. Chúng tôi chỉ dùng quả chín tới, thái tay theo thớ để lát xoài dẻo đều mà không bị xơ.'},
 {id:'dau-tay-say',name:'Dâu tây Đà Lạt sấy dẻo',cat:'deo',region:'dalat',origin:'Đà Lạt',img:'dau.jpg',gallery:['dauthot.jpg'],sizes:[S('250g',165000),S('500g',315000)],badge:'',rating:4.7,reviews:74,sold:1210,taste:{ngot:3,chua:4,deo:4,gion:0},season:'Tháng 11 – Tháng 5',featured:3,
  short:'Dâu tây cao nguyên đỏ thắm, chua dịu, dẻo thơm — hợp dùng cùng sữa chua hay trà chiều.',
  long:'Dâu tây được hái vào sáng sớm khi còn mát, rửa sạch, bỏ cuống và sấy ở nhiệt độ thấp để giữ màu đỏ tự nhiên.'},
 {id:'thanh-long-say',name:'Thanh long ruột đỏ sấy giòn',cat:'gion',region:'binhthuan',origin:'Bình Thuận',img:'thanhlong.jpg',gallery:[],sizes:[S('100g',115000),S('250g',265000)],badge:'Sấy thăng hoa',rating:4.8,reviews:51,sold:860,taste:{ngot:3,chua:1,deo:0,gion:5},season:'Quanh năm',noSugar:true,featured:4,
  short:'Sấy thăng hoa giữ sắc đỏ rực tự nhiên; giòn xốp, tan nhẹ trong miệng, không thêm đường.',
  long:'Công nghệ sấy thăng hoa (sấy đông khô) rút nước ở nhiệt độ rất thấp nên lát thanh long giữ gần như nguyên vẹn màu sắc, hình dáng và hương vị.'},
 {id:'khoai-lang-mat',name:'Khoai lang mật sấy dẻo',cat:'deo',region:'dalat',origin:'Đà Lạt',img:'khoai.jpg',gallery:[],sizes:[S('300g',109000),S('600g',205000)],badge:'',rating:4.8,reviews:88,sold:1520,taste:{ngot:5,chua:0,deo:5,gion:0},season:'Quanh năm',featured:5,
  short:'Khoai lang mật hấp chín, sấy dẻo — ngọt lịm như mật, ăn no lâu, hợp làm bữa phụ.',
  long:'Khoai lang mật được hấp chín trước khi sấy để mật khoai chảy ra tự nhiên, tạo độ dẻo và vị ngọt sâu mà không cần thêm đường.'},
 {id:'long-nhan',name:'Long nhãn Hưng Yên',cat:'deo',region:'hungyen',origin:'Hưng Yên',img:'longnhan.jpg',gallery:[],sizes:[S('250g',185000),S('500g',355000)],badge:'Mới',isNew:true,rating:4.9,reviews:22,sold:310,taste:{ngot:5,chua:0,deo:4,gion:0},season:'Tháng 7 – Tháng 9',
  short:'Cùi nhãn lồng sấy vàng nâu, dẻo, thơm mùi mật — dùng ăn trực tiếp, nấu chè hay pha trà.',
  long:'Nhãn lồng Hưng Yên nổi tiếng cùi dày, hạt nhỏ. Long nhãn được bóc cùi bằng tay và sấy chậm cho tới khi cùi chuyển màu hổ phách.'},
 {id:'vai-thieu-say',name:'Vải thiều Lục Ngạn sấy',cat:'deo',region:'lucngan',origin:'Lục Ngạn',img:'vai.jpg',gallery:['vai2.jpg'],sizes:[S('500g',195000),S('1kg',370000)],badge:'Mới',isNew:true,rating:4.6,reviews:18,sold:240,taste:{ngot:4,chua:1,deo:3,gion:0},season:'Tháng 6 – Tháng 7',
  short:'Vải thiều sấy nguyên vỏ, cùi khô dẻo ngọt đậm — thức quà quen thuộc của mùa hè miền Bắc.',
  long:'Vải được sấy nguyên trái theo cách truyền thống của người Lục Ngạn, giữ lớp vỏ mỏng bảo vệ phần cùi bên trong.'},
 {id:'tac-say-deo',name:'Tắc sấy dẻo',cat:'deo',region:'mientay',origin:'Miền Tây',img:'tac.jpg',gallery:[],sizes:[S('250g',125000),S('500g',235000)],badge:'',rating:4.7,reviews:39,sold:640,taste:{ngot:3,chua:4,deo:4,gion:0},season:'Quanh năm',
  short:'Tắc (quất) nguyên trái sấy dẻo, chua ngọt the nhẹ — ngậm êm họng, pha trà tắc càng ngon.',
  long:'Tắc được khía nhẹ, ngâm cho bớt đắng rồi sấy chậm. Vị chua dịu và mùi tinh dầu vỏ tắc làm nên món quà rất "Tết".'},
 {id:'hong-deo-nguyen-trai',name:'Hồng sấy dẻo nguyên trái',cat:'deo',region:'dalat',origin:'Đà Lạt',img:'hong3.jpg',gallery:[],sizes:[S('500g',185000),S('1kg',350000)],badge:'',rating:4.6,reviews:41,sold:720,taste:{ngot:5,chua:0,deo:4,gion:0},season:'Tháng 10 – Tháng 2',
  short:'Hồng ép dẹt nguyên trái, dẻo mềm, giá dễ chịu — lựa chọn để thưởng thức hằng ngày.',
  long:'Khác với hồng treo gió, hồng sấy dẻo được ép dẹt và sấy trong buồng, cho thành phẩm đồng đều và mềm hơn.'},
 {id:'mit-say-gion',name:'Mít sấy giòn',cat:'gion',region:'mientay',origin:'Miền Tây',img:'mit.jpg',gallery:[],sizes:[S('200g',115000),S('500g',265000)],badge:'',rating:4.7,reviews:102,sold:1960,taste:{ngot:4,chua:0,deo:0,gion:5},season:'Quanh năm',featured:6,
  short:'Múi mít Thái chín vàng, giòn rụm, thơm lừng mùi mít chín.',
  long:'Mít được tách múi, bỏ hạt và sấy chân không ở nhiệt độ thấp để giữ độ giòn xốp và màu vàng tự nhiên.'},
 {id:'chuoi-say-gion',name:'Chuối sấy giòn',cat:'gion',region:'mientay',origin:'Miền Tây',img:'chuoi.jpg',gallery:['xoai.jpg'],sizes:[S('250g',89000),S('500g',165000)],badge:'',rating:4.5,reviews:67,sold:1340,taste:{ngot:3,chua:0,deo:0,gion:5},season:'Quanh năm',
  short:'Chuối lát mỏng sấy giòn tan, vị ngọt bùi quen thuộc — món ăn vặt cho cả nhà.',
  long:'Chuối được thái lát mỏng đều tay, sấy cho tới khi đạt độ giòn vừa, không quá cứng.'},
 {id:'chuoi-moc',name:'Chuối xiêm phơi nắng',cat:'deo',region:'mientay',origin:'Bến Tre',img:'chuoimoc.jpg',gallery:[],sizes:[S('250g',99000),S('500g',185000)],badge:'',rating:4.6,reviews:33,sold:520,taste:{ngot:4,chua:0,deo:4,gion:0},season:'Quanh năm',
  short:'Chuối xiêm chín tới, ép mỏng và phơi nắng tự nhiên — dẻo, ngọt thanh vị phù sa.',
  long:'Cách làm mộc mạc của các gia đình miệt vườn: chuối chín được ép dẹt và phơi dưới nắng nhiều ngày.'},
 {id:'khoai-mon-gion',name:'Khoai môn sấy giòn',cat:'gion',region:'dalat',origin:'Đà Lạt',img:'khoaimon.jpg',gallery:[],sizes:[S('250g',105000),S('500g',195000)],badge:'',rating:4.5,reviews:28,sold:450,taste:{ngot:2,chua:0,deo:0,gion:5},season:'Quanh năm',
  short:'Lát khoai môn vân tím, giòn bùi, thơm nhẹ — hợp nhâm nhi cùng trà nóng.',
  long:'Khoai môn được thái lát mỏng giữ nguyên vân tím tự nhiên, sấy giòn mà không bị khét.'},
 {id:'cam-lat-say',name:'Cam sành sấy lát',cat:'tra',region:'mientay',origin:'Miền Tây',img:'camlat.jpg',gallery:['cam2.jpg'],sizes:[S('100g',95000),S('250g',215000)],badge:'',rating:4.7,reviews:26,sold:390,taste:{ngot:2,chua:3,deo:0,gion:3},season:'Quanh năm',noSugar:true,
  short:'Lát cam sấy nguyên vỏ, thơm tinh dầu — thả vào trà, nước ấm hoặc trang trí bàn tiệc.',
  long:'Cam được thái lát đều, sấy khô ở nhiệt độ thấp để giữ màu cam rực và mùi tinh dầu vỏ.'},
 {id:'set-tra-cam-que',name:'Set trà cam quế hồi',cat:'tra',region:'nhieuvung',origin:'Tuyển chọn',img:'hero.jpg',gallery:['camlat.jpg'],sizes:[S('Hộp 10 gói',165000)],badge:'Quà Tết',rating:4.8,reviews:19,sold:280,taste:{ngot:1,chua:2,deo:0,gion:0},season:'Mùa đông',
  short:'Cam sấy, quế, hồi và đường phèn chia sẵn từng gói — pha một tách trà ấm áp ngày se lạnh.',
  long:'Mỗi gói gồm lát cam sấy, thanh quế, hoa hồi và một viên đường phèn nhỏ — chỉ cần thêm nước sôi.'},
 {id:'mix-5-vi',name:'Mix trái cây sấy 5 vị',cat:'mix',region:'nhieuvung',origin:'Tuyển chọn 5 vùng quả',img:'mix.jpg',gallery:[],sizes:[S('Hộp 400g',219000,245000)],badge:'Hộp mix',rating:4.8,reviews:57,sold:930,taste:{ngot:4,chua:2,deo:3,gion:3},season:'Quanh năm',featured:7,
  short:'Xoài, dâu, thanh long, mít và chuối — đủ vị dẻo giòn cho cả nhà trong một hộp.',
  long:'Năm vị được phối theo tỉ lệ cân bằng giữa dẻo và giòn, chua và ngọt.'},
 {id:'hu-thap-cam',name:'Bộ 4 hũ thập cẩm',cat:'mix',region:'nhieuvung',origin:'Tuyển chọn',img:'thapcam.jpg',gallery:[],sizes:[S('4 hũ · 800g',395000,440000)],badge:'Combo',rating:4.7,reviews:31,sold:410,taste:{ngot:4,chua:2,deo:3,gion:3},season:'Quanh năm',featured:8,
  short:'Bốn hũ thuỷ tinh nắp gỗ: xoài, mít, dâu, khoai lang — đẹp như một kệ bếp nhỏ.',
  long:'Hũ thuỷ tinh nắp gỗ có thể tái sử dụng — một món quà xinh xắn cho người yêu bếp.'},
 /* Sắp ra mắt */
 {id:'hat-dieu',name:'Hạt điều rang muối',cat:'hat',region:'nhieuvung',origin:'Bình Phước',img:'hat.jpg',sizes:[S('500g',0)],soon:true,short:'Điều loại W240 rang củi, vỏ lụa giòn thơm.'},
 {id:'hat-sen',name:'Hạt sen sấy',cat:'hat',region:'mientay',origin:'Đồng Tháp',img:'hatsen.jpg',sizes:[S('250g',0)],soon:true,short:'Hạt sen Tháp Mười sấy bùi, giòn nhẹ.'},
 {id:'ca-phe',name:'Cà phê Robusta rang mộc',cat:'cafe',region:'nhieuvung',origin:'Buôn Ma Thuột',img:'caphe.jpg',sizes:[S('500g',0)],soon:true,short:'Robusta Cầu Đất – Buôn Ma Thuột rang mộc, đậm và thơm.'},
 {id:'tra-shan',name:'Trà shan tuyết cổ thụ',cat:'cafe',region:'nhieuvung',origin:'Hà Giang',img:'tra.jpg',sizes:[S('100g',0)],soon:true,short:'Búp trà từ những cây shan tuyết hàng trăm năm tuổi.'},
 {id:'keo-dua',name:'Kẹo dừa ca cao',cat:'mut',region:'mientay',origin:'Bến Tre',img:'keodua.jpg',sizes:[S('400g',0)],soon:true,short:'Kẹo dừa truyền thống, gói giấy kiếng xinh xắn.'}
];
MQ.GIFTS = [
 {id:'hop-an-nhien',name:'Hộp An Nhiên',slots:4,w:'600g',price:590000,box:'#2b4a3d',ribbon:'#c9a868',items:['xoai-say-deo','dau-tay-say','thanh-long-say','khoai-lang-mat'],for:['gia-dinh','ban-be'],desc:'Nhỏ gọn, tinh tế — món quà thăm hỏi cho người thân, bạn bè.'},
 {id:'hop-sum-vay',name:'Hộp Sum Vầy',slots:6,w:'900g',price:790000,box:'#5b4632',ribbon:'#e2c48a',items:['xoai-say-deo','mit-say-gion','tac-say-deo','khoai-lang-mat','chuoi-moc','dau-tay-say'],for:['gia-dinh'],desc:'Sáu vị quen thuộc của ba miền cho mâm quả ngày đoàn viên.'},
 {id:'hop-phu-quy',name:'Hộp Phú Quý',slots:6,w:'1kg',price:990000,box:'#7a2e22',ribbon:'#d8b878',items:['hong-treo-gio','xoai-say-deo','dau-tay-say','long-nhan','tac-say-deo','thanh-long-say'],for:['gia-dinh','doi-tac'],tag:'Tết Đinh Mùi 2027',desc:'Có hồng treo gió Đà Lạt — vị quà Tết được yêu thích nhất. Hộp sơn mài đỏ son, thiệp thư pháp.'},
 {id:'hop-thinh-vuong',name:'Hộp Thịnh Vượng',slots:9,w:'1,6kg',price:1590000,box:'#1b1f1d',ribbon:'#b08d57',items:['hong-treo-gio','xoai-say-deo','dau-tay-say','long-nhan','vai-thieu-say','thanh-long-say','mit-say-gion','tac-say-deo','khoai-lang-mat'],for:['doi-tac','sep'],desc:'Trọn bộ sưu tập trong hộp gỗ khắc laser — trang trọng cho đối tác, khách hàng VIP.'}
];
MQ.BOX_OPTIONS = {
  sizes:[{slots:4,name:'Hộp 4 ngăn',fee:120000},{slots:6,name:'Hộp 6 ngăn',fee:160000},{slots:9,name:'Hộp 9 ngăn',fee:220000}],
  colors:[{id:'rung',name:'Xanh rừng',box:'#2b4a3d',ribbon:'#c9a868'},{id:'son',name:'Đỏ son',box:'#7a2e22',ribbon:'#d8b878'},{id:'mun',name:'Đen mun',box:'#1b1f1d',ribbon:'#b08d57'},{id:'nga',name:'Ngà mộc',box:'#d9c8a6',ribbon:'#7a2e22'}]
};
MQ.COUPONS = {
  MOCQUA10:{type:'pct',value:10,max:200000,desc:'Giảm 10% (tối đa 200.000đ)'},
  TET2027:{type:'fixed',value:100000,min:1000000,desc:'Giảm 100.000đ cho đơn từ 1.000.000đ'},
  FREESHIP:{type:'ship',desc:'Miễn phí giao hàng tiêu chuẩn'}
};
MQ.PROVINCES = ['TP. Hồ Chí Minh','Hà Nội','Đà Nẵng','Hải Phòng','Cần Thơ','Huế','An Giang','Bắc Ninh','Cà Mau','Cao Bằng','Đắk Lắk','Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Tĩnh','Hưng Yên','Khánh Hòa','Lai Châu','Lâm Đồng','Lạng Sơn','Lào Cai','Nghệ An','Ninh Bình','Phú Thọ','Quảng Ngãi','Quảng Ninh','Quảng Trị','Sơn La','Tây Ninh','Thái Nguyên','Thanh Hóa','Tuyên Quang','Vĩnh Long'];
MQ.POSTS = [
 {slug:'thuong-thuc-hong-treo-gio',cat:'Thưởng thức',title:'5 cách thưởng thức hồng treo gió trọn vị nhất',img:'hong2.jpg',date:'12/10/2026',read:'5 phút',excerpt:'Từ ăn nguyên miếng cùng trà sen đến thái lát ăn kèm phô mai — hồng treo gió có nhiều cách thưởng thức hơn bạn nghĩ.',products:['hong-treo-gio','set-tra-cam-que'],
  body:[['p','Hồng treo gió là thức quà "chậm": người làm phải chờ nhiều tuần, và người ăn cũng nên chậm lại một chút để cảm nhận hết vị ngọt sâu của nó. Dưới đây là năm cách thưởng thức mà đội ngũ Mộc Quả yêu thích.'],['h','1. Ăn nguyên miếng cùng trà nóng'],['p','Cách đơn giản và "chuẩn" nhất: xé một miếng hồng, nhâm nhi cùng tách trà sen, trà ô long hoặc trà shan tuyết. Vị chát nhẹ của trà làm vị ngọt của hồng thêm thanh.'],['h','2. Thái lát mỏng ăn kèm phô mai'],['p','Hồng treo gió thái lát mỏng đặt trên miếng phô mai brie hoặc camembert là món khai vị rất được lòng khách trong những bữa tiệc cuối năm.'],['h','3. Cuộn cùng hạt óc chó'],['p','Bổ đôi miếng hồng, đặt nửa nhân óc chó vào giữa rồi cuộn lại — giòn, bùi, dẻo, ngọt trong cùng một miếng.'],['quote','Mẹo nhỏ: để hồng ở ngăn mát tủ lạnh 15 phút trước khi thái, lát cắt sẽ gọn và đẹp hơn.'],['h','4. Pha trà hồng quế'],['p','Thái hạt lựu một miếng hồng, thêm một thanh quế nhỏ và nước sôi — sau 5 phút bạn có một tách trà ngọt dịu tự nhiên.'],['h','5. Bày mâm quả ngày Tết'],['p','Lớp phấn trắng tự nhiên khiến hồng treo gió trông như được rắc tuyết — rất đẹp khi bày cạnh mứt tắc đỏ cam và long nhãn hổ phách.']]},
 {slug:'say-lanh-khac-say-nong',cat:'Kiến thức',title:'Sấy lạnh, sấy thăng hoa và sấy nóng khác nhau thế nào?',img:'cam2.jpg',date:'28/09/2026',read:'6 phút',excerpt:'Vì sao cùng là thanh long nhưng có loại giòn xốp, có loại dẻo? Hiểu về công nghệ sấy để chọn đúng món mình thích.',products:['thanh-long-say','xoai-say-deo','mit-say-gion'],
  body:[['p','Trái cây sấy ngon hay không phụ thuộc rất nhiều vào cách sấy. Mỗi phương pháp cho ra một kết cấu và hương vị khác nhau.'],['h','Sấy nóng truyền thống'],['p','Dùng nhiệt độ cao để rút nước nhanh. Ưu điểm là nhanh và rẻ, nhưng dễ làm quả sẫm màu và mất bớt hương thơm.'],['h','Sấy lạnh'],['p','Sấy ở nhiệt độ thấp với không khí khô tuần hoàn. Thời gian lâu hơn nhưng giữ được màu sắc và độ dẻo — phù hợp với xoài, dâu, khoai lang.'],['h','Sấy thăng hoa (đông khô)'],['p','Quả được cấp đông rồi rút nước trong môi trường chân không. Nước thăng hoa trực tiếp từ đá thành hơi, nên lát quả giữ gần như nguyên hình dáng, màu sắc, và có độ giòn xốp đặc trưng.'],['quote','Mộc Quả chọn phương pháp sấy riêng cho từng loại quả — không có một công thức chung cho tất cả.'],['h','Chọn thế nào?'],['p','Thích dẻo, đậm vị: chọn sấy lạnh. Thích giòn nhẹ, ít ngọt: chọn sấy thăng hoa. Thích vị mộc mạc truyền thống: chọn phơi nắng hoặc treo gió.']]},
 {slug:'goi-y-qua-tet-doanh-nghiep',cat:'Quà tặng',title:'Gợi ý quà Tết doanh nghiệp 2027: tinh tế, đúng ngân sách',img:'cho.jpg',date:'15/09/2026',read:'4 phút',excerpt:'Checklist chọn quà Tết cho đối tác và nhân viên: ngân sách, thời gian đặt, cá nhân hoá và giao hàng theo danh sách.',products:['hop-phu-quy','hop-thinh-vuong'],
  body:[['p','Quà Tết doanh nghiệp không chỉ là món quà — đó là lời chào năm mới mang hình ảnh thương hiệu của bạn. Dưới đây là vài gợi ý để chọn quà vừa tinh tế vừa đúng ngân sách.'],['h','Chốt ngân sách và số lượng sớm'],['p','Thời điểm lý tưởng để đặt quà Tết là 6–8 tuần trước Tết. Đặt sớm giúp bạn có nhiều lựa chọn mẫu hộp và thời gian in ấn logo.'],['h','Cá nhân hoá vừa đủ'],['p','Một tấm thiệp viết tay tên người nhận, logo ép kim nhỏ trên nắp hộp — chừng đó đủ để món quà trở nên riêng tư mà không phô trương.'],['h','Giao theo danh sách'],['p','Gửi cho chúng tôi danh sách người nhận, Mộc Quả sẽ giao tận nơi, chụp ảnh xác nhận và gửi báo cáo cho bộ phận hành chính.'],['quote','Ưu đãi demo: đơn từ 50 hộp được tặng thiệp thư pháp viết tay cho từng người nhận.']]}
];
MQ.REVIEWS = [
 {name:'Chị Thu Hà',city:'Hà Nội',rating:5,text:'Hồng treo gió dẻo, ngọt thanh, không gắt. Hộp quà đẹp đến mức bố mẹ tôi không nỡ bóc.',product:'Hộp Phú Quý'},
 {name:'Anh Minh Khoa',city:'TP. Hồ Chí Minh',rating:5,text:'Công ty tôi đặt 150 hộp quà Tết cho đối tác. Mẫu mã sang, giao đúng danh sách, đối tác khen rất nhiều.',product:'Quà doanh nghiệp'},
 {name:'Chị Ngọc Lan',city:'Đà Nẵng',rating:5,text:'Xoài sấy dẻo thơm đúng vị xoài Cát Chu, con tôi ăn vặt thay bánh kẹo. Sẽ mua lại.',product:'Xoài Cát Chu sấy dẻo'},
 {name:'Anh Quốc Bảo',city:'Cần Thơ',rating:4,text:'Thanh long sấy giòn màu rất đẹp, vị ngọt nhẹ. Mong shop có thêm gói nhỏ 50g để mang đi làm.',product:'Thanh long ruột đỏ sấy giòn'},
 {name:'Chị Hoài An',city:'Huế',rating:5,text:'Tự thiết kế hộp quà trên web rất vui, thiệp viết tay đúng lời mình gửi. Mẹ chồng rất thích.',product:'Hộp quà tự chọn'}
];
MQ.SEASONS = [ // tháng 1..12 — lịch mùa quả (tham khảo)
 {name:'Hồng Đà Lạt',m:[1,2,10,11,12]},{name:'Dâu tây',m:[1,2,3,4,5,11,12]},{name:'Vải thiều',m:[6,7]},{name:'Nhãn lồng',m:[7,8,9]},{name:'Xoài Cát Chu',m:[3,4,5,6,9,10]},{name:'Thanh long',m:[1,2,3,4,5,6,7,8,9,10,11,12]},{name:'Tắc',m:[10,11,12,1]}
];
