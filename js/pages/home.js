(function(){
const MQ=window.MQ,{$,$$}=MQ;
const live=MQ.PRODUCTS.filter(p=>!p.soon);
/* hero */
const sl=$$('[data-slides] img'),dots=$$('[data-dots] button');let cur=0,timer;
const go=i=>{cur=(i+sl.length)%sl.length;sl.forEach((s,k)=>s.classList.toggle('is-on',k===cur));dots.forEach((d,k)=>d.classList.toggle('is-on',k===cur))};
const auto=()=>{clearInterval(timer);timer=setInterval(()=>go(cur+1),5200)};
dots.forEach((d,k)=>d.addEventListener('click',()=>{go(k);auto()}));auto();
$('[data-stat-p]').textContent=live.length;$('[data-stat-sku]').textContent=live.reduce((s,p)=>s+p.variants.length,0);
const hp=MQ.byId('sau-rieng-say-thang-hoa');
$('[data-hero-chip]').innerHTML=`<img src="${MQ.img(hp.img,true)}" alt=""><span><small>Được săn nhiều</small>${hp.name}<em>${MQ.priceLabel(hp)} · 3 dòng sản phẩm</em></span>`;
$('[data-freeship-text]').textContent=`Miễn phí giao hàng cho đơn từ ${MQ.fmt(MQ.FREE_SHIP)}.`;
/* danh mục */
const cnt=f=>live.filter(f).length;
const CT=[
 ...['deo','thanghoa','gion'].map(k=>({href:`cua-hang.html?cat=${k}`,img:MQ.CATS[k].img,small:`${cnt(p=>p.cat===k)} sản phẩm`,h:MQ.CATS[k].name,p:MQ.CATS[k].desc})),
 {href:'cua-hang.html?flavour=muoiot',img:'products/dxmo300-45.jpg',small:`${cnt(p=>p.flavour==='muoiot')} sản phẩm`,h:'Vị muối ớt',p:'Mặn – cay – ngọt, ăn là ghiền.'},
 {href:'cua-hang.html?tag=small',img:'products/th080-45.jpg',small:'Từ 60.000đ',h:'Gói nhỏ 80g',p:'Nhỏ xinh, tiện bỏ túi, thử nhiều vị.'},
 {href:'cua-hang.html?line=mq',img:'products/zip-xoai-45.jpg',small:'Sắp ra mắt',h:'Mộc Quả tuyển chọn',p:'Túi zip nhãn Mộc Quả.'}
];
$('[data-cats]').innerHTML=CT.map(c=>`<a class="cat reveal" href="${c.href}"><img src="${MQ.img(c.img)}" alt="" loading="lazy"><div><div><small>${c.small}</small><h3>${c.h}</h3><p>${c.p}</p></div><span class="arrowc"><svg><use href="#i-arrow"/></svg></span></div></a>`).join('');
/* nổi bật */
const byRank=a=>[...a].sort((x,y)=>(x.rank||99)-(y.rank||99));
const sets={best:()=>byRank(live),thanghoa:()=>byRank(live.filter(p=>p.cat==='thanghoa')).concat(byRank(live.filter(p=>p.cat!=='thanghoa'))),muoiot:()=>byRank(live.filter(p=>p.flavour==='muoiot')).concat(byRank(live.filter(p=>p.flavour!=='muoiot'))),small:()=>byRank(live.filter(p=>p.variants.some(v=>v.g&&v.g<=100&&v.g>0))).concat(byRank(live.filter(p=>!p.variants.some(v=>v.g&&v.g<=100))))};
const grid=$('[data-home-grid]');
const show=t=>{grid.innerHTML=sets[t]().slice(0,8).map(p=>MQ.card(p)).join('');};
$$('[data-ptabs] .chip').forEach(b=>b.addEventListener('click',()=>{$$('[data-ptabs] .chip').forEach(x=>x.classList.toggle('is-on',x===b));show(b.dataset.t)}));show('best');
/* ba cách sấy */
const M={deo:{t:'Mềm dẻo · đậm vị',n:'Quả chín được sấy ở nhiệt độ vừa phải cho tới khi đạt độ dẻo — giữ vị chua ngọt tự nhiên, nhai “đã miệng”. Hợp xoài, thơm, me, đu đủ.'},
 thanghoa:{t:'Giòn xốp · tan trong miệng',n:'Cấp đông rồi rút nước trong chân không: miếng quả giữ gần như nguyên màu, hương và hình dáng, giòn xốp rất lạ. Hợp sầu riêng, xoài.'},
 gion:{t:'Giòn rụm · thơm lừng',n:'Sấy cho tới khi miếng quả giòn rụm, thơm mùi quả chín — món nhâm nhi cho cả nhà. Hợp mít.'}};
$('[data-mtabs]').innerHTML=Object.keys(M).map(k=>`<button class="chip" data-m="${k}">${MQ.CATS[k].short}</button>`).join('');
const pickM=k=>{const c=MQ.CATS[k],ps=byRank(live.filter(p=>p.cat===k));
  $$('[data-m]').forEach(b=>b.classList.toggle('is-on',b.dataset.m===k));
  $('[data-mvisual]').innerHTML=`<img src="${MQ.img(c.img)}" alt="${c.name}"><span>${c.short}</span>`;
  $('[data-mcard]').innerHTML=`<small>${M[k].t}</small><h3>${c.name}</h3><p>${M[k].n}</p><div class="region-card__prods">${ps.slice(0,3).map(p=>`<a class="rp" href="${MQ.url(p)}"><img src="${MQ.img(p.img,true)}" alt="" loading="lazy"><b>${p.name}</b><small>${MQ.priceLabel(p)}</small></a>`).join('')}</div><a class="btn btn--ghost btn--sm" href="cua-hang.html?cat=${k}">Xem ${ps.length} sản phẩm ${c.short.toLowerCase()} <svg><use href="#i-arrow"/></svg></a>`};
document.addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(b)pickM(b.dataset.m)});pickM('deo');
/* dòng sản phẩm Viza Food */
$('[data-lines]').innerHTML=Object.entries(MQ.LINES).filter(([k,l])=>l.maker==='viza').map(([k,l])=>{const ps=live.filter(p=>p.lines.includes(k));const v=ps.flatMap(p=>p.variants).find(v=>v.line===k);return `<a class="lineb" href="cua-hang.html?line=${k}">${v?`<img src="${MQ.img(v.img,true)}" alt="" loading="lazy">`:''}<b>${l.name}</b><small>${ps.length} sản phẩm</small></a>`}).join('');
/* quà, đánh giá, sắp có, bài viết */
$('[data-gifts]').innerHTML=MQ.GIFTS.map(MQ.giftCard).join('');
$('[data-teaser-art]').innerHTML=MQ.giftSvg('#7a2e22','#d8b878');
$('[data-reviews]').innerHTML=MQ.REVIEWS.slice(0,3).map(MQ.reviewCard).join('');
$('[data-soon]').innerHTML=MQ.PRODUCTS.filter(p=>p.own).slice(0,4).map(p=>MQ.card(p)).join('');
$('[data-posts]').innerHTML=MQ.POSTS.map(a=>MQ.postCard(a)).join('');
MQ.renderRecent();
MQ.reveal();
})();
