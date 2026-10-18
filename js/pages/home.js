(function(){
const MQ=window.MQ,{$,$$}=MQ;
const live=MQ.PRODUCTS.filter(p=>!p.soon);
const byRank=a=>[...a].sort((x,y)=>(x.rank||99)-(y.rank||99));
const cnt=f=>live.filter(f).length;
const own=live.filter(p=>p.own), viza=live.filter(p=>p.maker==='viza');
/* sidebar */
$('[data-side]').innerHTML=MQ.side();
/* banner slider */
const CUT=f=>`assets/products/mqz/cut/${f}.webp?v=${MQ.IMGV}`, VCUT=f=>`assets/products/cut/${f}.webp`;
const SL=[
 {cls:'mq',href:'cua-hang.html?line=mq',k:'Thương hiệu riêng · mocqua.com',h:'Mộc Quả <em>hũ PET &amp; túi zip</em>',p:`${own.length} sản phẩm: sấy thăng hoa, sấy dẻo, ô mai, set quà. Nhìn rõ quả trước khi mua.`,cta:'Mua dòng Mộc Quả',imgs:[CUT('mqz-omxd-250'),CUT('mqz-dxo-500-hu'),CUT('mqz-ddy-500-hu')]},
 {cls:'th',href:'cua-hang.html?cat=thanghoa',k:'Sấy thăng hoa',h:'Giòn xốp, <em>giữ trọn màu &amp; vị quả</em>',p:`${cnt(p=>p.cat==='thanghoa')} sản phẩm sầu riêng Ri6, xoài cát, thanh long, vải Lục Ngạn… túi 100g – 200g.`,cta:'Xem sấy thăng hoa',imgs:[VCUT('tsr105'),CUT('mqz-thsr-100c'),CUT('mqz-thtld-100')]},
 {cls:'tet',href:'cua-hang.html?cat=set',k:'Quà Tết Đinh Mùi 2027',h:'Set quà &amp; <em>hộp quà Tết</em>',p:'Khay mứt, hộp quả &amp; hạt, giỏ quà đóng sẵn — hoặc tự thiết kế hộp quà kèm thiệp viết tay.',cta:'Chọn quà Tết',cta2:['hop-qua.html#tu-thiet-ke','Tự thiết kế hộp quà'],gift:true,imgs:[CUT('mqz-setht-700')]},
 {cls:'vz',href:'cua-hang.html?line='+Object.keys(MQ.LINES).filter(k=>MQ.LINES[k].maker==='viza').join(','),k:'Hàng chính hãng',h:'Viza Food <em>· 5 dòng sản phẩm</em>',p:`GoodGood, Fresh &amp; Healthy, Cheers+, KITA, Yummy — ${viza.length} sản phẩm nguyên bao bì, đủ quy cách.`,cta:'Xem hàng Viza Food',imgs:[VCUT('dx350'),VCUT('gm500'),VCUT('dxmo300')]}
];
$('[data-slides]').innerHTML=SL.map((s,i)=>`<a class="slide slide--${s.cls}${i?'':' is-on'}" href="${s.href}" aria-label="${s.k}"${i?' aria-hidden="true" tabindex="-1"':''}>
  <div class="slide__copy"><small>${s.k}</small><h2>${s.h}</h2><p>${s.p}</p><span class="slide__cta"><span class="cbtn cbtn--buy">${s.cta} →</span>${s.cta2?`<span class="cbtn cbtn--line" data-href="${s.cta2[0]}">${s.cta2[1]}</span>`:''}</span></div>
  <div class="slide__art">${s.gift?MQ.giftSvg('#7a2e22','#d8b878','slide__gift'):''}${s.imgs.map((m,k)=>`<img src="${m}" alt="" ${i?'loading="lazy"':''} style="--k:${k}">`).join('')}</div></a>`).join('');
$('[data-dots]').innerHTML=SL.map((s,i)=>`<button class="${i?'':'is-on'}" aria-label="Banner ${i+1}: ${s.k}"></button>`).join('');
const sl=$$('.slide'),dots=$$('[data-dots] button');let cur=0,timer;
const go=i=>{cur=(i+sl.length)%sl.length;sl.forEach((s,k)=>{s.classList.toggle('is-on',k===cur);s.setAttribute('aria-hidden',k!==cur);s.tabIndex=k===cur?0:-1});dots.forEach((d,k)=>d.classList.toggle('is-on',k===cur))};
const auto=()=>{clearInterval(timer);timer=setInterval(()=>go(cur+1),5500)};
dots.forEach((d,k)=>d.addEventListener('click',()=>{go(k);auto()}));
$$('[data-sl]').forEach(b=>b.addEventListener('click',()=>{go(cur+ +b.dataset.sl);auto()}));
$('[data-slider]').addEventListener('click',e=>{const h=e.target.closest('[data-href]');if(h){e.preventDefault();location.href=h.dataset.href}});
let sx=null;$('[data-slider]').addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
$('[data-slider]').addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40){go(cur+(dx<0?1:-1));auto()}sx=null});
auto();
/* 2 ô quảng cáo cạnh banner */
const muoi=MQ.byId('xoai-say-deo-muoi-ot');
$('[data-hban-side]').innerHTML=`<a class="ptile ptile--gift" href="hop-qua.html#tu-thiet-ke">${MQ.giftSvg('#1e3a2f','#c4a265')}<span><small>Mới</small><b>Tự thiết kế hộp quà</b><em>Chọn vị · màu hộp · lời chúc</em></span></a>
<a class="ptile ptile--hot" href="cua-hang.html?flavour=muoiot"><img src="${VCUT('dxmo300')}" alt=""><span><small>Ăn là ghiền</small><b>Vị muối ớt</b><em>${cnt(p=>p.flavour==='muoiot')} sản phẩm · mặn – cay – ngọt</em></span></a>`;
$('[data-freeship-text]').textContent=`Miễn phí từ ${MQ.fmt(MQ.FREE_SHIP)}`;
/* danh mục nhanh (mobile) */
const MC=[['cua-hang.html?cat=thanghoa','Sấy thăng hoa'],['cua-hang.html?cat=deo','Sấy dẻo'],['cua-hang.html?cat=gion','Sấy giòn'],['cua-hang.html?cat=omai','Ô mai'],['cua-hang.html?cat=set','Set quà'],['cua-hang.html?line=mq','Mộc Quả'],['cua-hang.html?flavour=muoiot','Muối ớt'],['hop-qua.html','Hộp quà Tết']];
$('[data-mcats]').innerHTML=MC.map(([h,l])=>`<a href="${h}">${l}</a>`).join('');
/* các khu sản phẩm theo danh mục */
const fruitsOf=ps=>{const m={};ps.forEach(p=>{if(p.fruit)m[p.fruit]=(m[p.fruit]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0])};
const SEC=[
 {id:'thang-hoa',t:'Trái cây sấy thăng hoa',q:'cat=thanghoa',ps:live.filter(p=>p.cat==='thanghoa'),n:8},
 {id:'say-deo',t:'Trái cây sấy dẻo',q:'cat=deo',ps:live.filter(p=>p.cat==='deo'),n:8},
 {promo:'mq'},
 {id:'say-gion',t:'Trái cây sấy giòn',q:'cat=gion',ps:live.filter(p=>p.cat==='gion'),n:4},
 {id:'o-mai',t:'Ô mai &amp; xí muội',q:'cat=omai',ps:live.filter(p=>p.cat==='omai'),n:8},
 {promo:'gift'},
 {id:'set-qua',t:'Set quà &amp; khay mứt',q:'cat=set',ps:live.filter(p=>p.cat==='set'),n:4,extra:['hop-qua.html','Hộp quà Tết 2027']},
 {id:'viza-food',t:'Hàng chính hãng Viza Food',q:'line='+Object.keys(MQ.LINES).filter(k=>MQ.LINES[k].maker==='viza').join(','),ps:viza,n:8,lines:true}
];
const promo={
 mq:`<a class="pstrip pstrip--mq" href="cua-hang.html?line=mq"><span class="pstrip__imgs">${['mqz-ddy-500-hu','mqz-gmi-500','mqz-omcr-1000'].map(f=>`<img src="${CUT(f)}" alt="" loading="lazy">`).join('')}</span><span class="pstrip__t"><small>Thương hiệu riêng · mocqua.com</small><b>Mộc Quả — ${own.length} sản phẩm túi zip đứng</b><em>Cửa sổ trong suốt nhìn rõ quả · khoá zip giữ quả dẻo thơm, giòn xốp</em></span><span class="cbtn cbtn--buy">Xem tất cả →</span></a>`,
 gift:`<a class="pstrip pstrip--gift" href="hop-qua.html#tu-thiet-ke"><span class="pstrip__imgs">${MQ.giftSvg('#7a2e22','#d8b878')}</span><span class="pstrip__t"><small>Quà Tết Đinh Mùi 2027</small><b>Tự thiết kế hộp quà của riêng bạn</b><em>Chọn kích thước, màu hộp, từng gói quả và lời chúc — xem trước ngay trên màn hình</em></span><span class="cbtn cbtn--buy">Bắt đầu chọn →</span></a>`};
$('[data-psecs]').innerHTML=SEC.map(s=>{if(s.promo)return promo[s.promo];
  const subs=s.lines?Object.entries(MQ.LINES).filter(([k,l])=>l.maker==='viza').map(([k,l])=>`<a href="cua-hang.html?line=${k}">${l.name}</a>`).join(''):fruitsOf(s.ps).map(f=>`<a href="cua-hang.html?${s.q}&fruit=${f}">${MQ.FRUITS[f].name}</a>`).join('')+(s.extra?`<a href="${s.extra[0]}">${s.extra[1]}</a>`:'');
  return `<section class="psec" id="${s.id}"><div class="psec__bar"><h2><a href="cua-hang.html?${s.q}">${s.t}</a></h2><nav class="psec__sub">${subs}</nav><a class="psec__all" href="cua-hang.html?${s.q}">Xem tất cả <b>${s.ps.length}</b> →</a></div>
  <div class="pgrid pgrid--4">${byRank(s.ps).slice(0,s.n).map(p=>MQ.card(p)).join('')}</div></section>`}).join('');
/* đối tác Viza Food */
$('[data-lines]').innerHTML=Object.entries(MQ.LINES).filter(([k,l])=>l.maker==='viza').map(([k,l])=>{const ps=live.filter(p=>p.lines.includes(k));const v=ps.flatMap(p=>p.variants).find(v=>v.line===k);return `<a class="lineb" href="cua-hang.html?line=${k}">${v?`<img src="${MQ.img(v.img,true)}" alt="" loading="lazy">`:''}<b>${l.name}</b><small>${ps.length} sản phẩm</small></a>`}).join('');
MQ.renderRecent();
})();
