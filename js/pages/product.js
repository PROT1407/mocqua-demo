(function(){
const MQ=window.MQ,{$,$$}=MQ;
const p=MQ.byId(MQ.qs('id')||'hong-treo-gio');
const root=$('[data-pd]');
if(!p){root.innerHTML=`<div class="empty"><svg><use href="#mark"/></svg><h3>Không tìm thấy sản phẩm</h3><p>Sản phẩm có thể đã đổi tên hoặc ngừng kinh doanh.</p><a class="btn btn--dark" href="cua-hang.html">Về cửa hàng</a></div>`;$$('[data-bundle-wrap],.section').forEach(s=>s.hidden=true);return}
document.title=p.name+' | Mộc Quả (demo)';
$('[data-crumb]').insertAdjacentHTML('beforeend',`<span><a href="cua-hang.html?cat=${p.cat}">${MQ.CATS[p.cat].short}</a></span><span>${p.name}</span>`);
MQ.recent.add(p.id);
const imgs=[p.img,...(p.gallery||[])];
const NUT={deo:[['Năng lượng','~ 320 kcal'],['Carbohydrate','~ 78 g'],['Chất xơ','~ 6 g'],['Đạm','~ 2 g'],['Chất béo','< 1 g']],gion:[['Năng lượng','~ 400 kcal'],['Carbohydrate','~ 70 g'],['Chất xơ','~ 7 g'],['Đạm','~ 3 g'],['Chất béo','~ 12 g']],tra:[['Năng lượng','~ 250 kcal'],['Carbohydrate','~ 60 g'],['Chất xơ','~ 10 g'],['Vitamin C','có'],['Chất béo','< 1 g']],mix:[['Năng lượng','~ 350 kcal'],['Carbohydrate','~ 75 g'],['Chất xơ','~ 7 g'],['Đạm','~ 2,5 g'],['Chất béo','~ 5 g']]};
const batch='MQ-'+p.id.split('-').map(s=>s[0]).join('').toUpperCase()+'-2610-'+(String(p.sold||7).slice(-2).padStart(2,'0'));
const reg=MQ.REGIONS[p.region];
const bars=v=>Array.from({length:5},(_,i)=>`<b class="${i<v?'on':''}"></b>`).join('');
const soon=!!p.soon;
const sizeBtns=p.sizes.map((s,i)=>`<button class="var${i?'':' is-on'}" data-i="${i}">${s.w}<small>${soon?'—':MQ.fmt(s.p)}</small></button>`).join('');
const sampleRev=[{n:'Chị Phương Thảo',c:'TP. Hồ Chí Minh',r:5,t:'Đóng gói rất kỹ, vị ngọt tự nhiên đúng như mô tả. Mua làm quà ai cũng hỏi mua ở đâu.'},{n:'Anh Đức Long',c:'Hà Nội',r:5,t:'Lần thứ ba đặt rồi, chất lượng đều. Giao nhanh hơn dự kiến một ngày.'},{n:'Chị Mai Anh',c:'Đà Nẵng',r:4,t:'Ngon, hơi ngọt với mình một chút nhưng cả nhà rất thích. Sẽ thử thêm vị khác.'}];
root.innerHTML=`<div class="pd">
 <div class="gallery">
  <div class="gallery__thumbs">${imgs.map((im,i)=>`<button class="${i?'':'is-on'}" data-img="${im}" aria-label="Ảnh ${i+1}"><img src="${MQ.img(im)}" alt=""></button>`).join('')}</div>
  <div class="gallery__main" data-zoom><img src="${MQ.img(p.img)}" alt="${MQ.esc(p.name)}" data-main>${p.badge?`<span class="badge${p.featured===1?' badge--gold':''}">${p.badge}</span>`:''}<span class="gallery__note">Ảnh minh hoạ · di chuột để phóng to</span></div>
 </div>
 <div class="pinfo">
  <span class="pinfo__origin">${p.origin} · ${MQ.CATS[p.cat].name}</span>
  <h1>${p.name}</h1>
  <div class="pinfo__meta">${soon?'<span class="badge badge--line" style="position:static">Sắp ra mắt</span>':`${MQ.stars(p.rating)}<a href="#tab-rv" data-tab-go="rv">${p.rating} · ${p.reviews} đánh giá mẫu</a><span>Đã bán ${p.sold.toLocaleString('vi-VN')}+ (số liệu mẫu)</span>`}</div>
  ${soon?`<p class="pinfo__short">${p.short}</p><p class="notice">Sản phẩm dự kiến ra mắt Xuân 2027. Đăng ký để được báo khi mở bán.</p><button class="btn btn--gold" data-notify="${p.id}">Báo tôi khi có hàng</button>`:`
  <div class="pinfo__price"><b data-price>${MQ.fmt(p.sizes[0].p)}</b><s data-old>${p.sizes[0].old?MQ.fmt(p.sizes[0].old):''}</s><span class="demo-tag">Giá demo</span></div>
  <p class="pinfo__unit" data-unit></p>
  <p class="pinfo__short">${p.short}</p>
  <div class="opt-label">Khối lượng <em data-wlabel>${p.sizes[0].w}</em></div>
  <div class="variants" data-vars>${sizeBtns}</div>
  <div class="buy"><div class="qty"><button data-q="-1" aria-label="Giảm">−</button><input type="number" value="1" min="1" max="99" data-qty aria-label="Số lượng"><button data-q="1" aria-label="Tăng">+</button></div>
   <button class="btn btn--dark" data-add-pd>Thêm vào giỏ</button><button class="btn btn--gold" data-buy-now>Mua ngay</button>
   <button class="wishbig${MQ.wish.has(p.id)?' is-on':''}" data-wish="${p.id}" aria-label="Yêu thích"><svg><use href="#i-heart${MQ.wish.has(p.id)?'-f':''}"/></svg></button></div>
  <div class="pd-links"><button data-share><svg><use href="#i-share"/></svg>Sao chép liên kết</button><a href="hop-qua.html#tu-thiet-ke"><svg><use href="#i-gift"/></svg>Thêm vào hộp quà tự thiết kế</a><a href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg>Đặt qua hotline ${MQ.HOTLINE}</a></div>`}
  <div class="perks"><div><svg><use href="#i-truck"/></svg><span><b>Miễn phí giao hàng</b>cho đơn từ 500.000đ</span></div><div><svg><use href="#i-shield"/></svg><span><b>Đổi trả 7 ngày</b>nếu sản phẩm lỗi, ẩm mốc</span></div><div><svg><use href="#i-gift"/></svg><span><b>Gói quà miễn phí</b>kèm thiệp viết tay</span></div><div><svg><use href="#i-leaf"/></svg><span><b>Mùa vụ</b>${p.season||'Đang cập nhật'}</span></div></div>
  <div class="eta"><svg style="width:22px;height:22px;color:var(--gold)"><use href="#i-truck"/></svg><span>Giao đến</span><select data-eta-prov aria-label="Tỉnh thành">${MQ.provOptions('TP. Hồ Chí Minh')}</select><span>dự kiến <b data-eta></b></span></div>
  ${p.taste?`<div class="taste">${[['Ngọt','ngot'],['Chua','chua'],['Dẻo','deo'],['Giòn','gion']].map(([l,k])=>`<div><span>${l}</span><i>${bars(p.taste[k])}</i></div>`).join('')}</div>`:''}
  <div class="batch"><svg style="width:20px;height:20px;color:var(--gold)"><use href="#i-shield"/></svg>Mã lô truy xuất: <code>${batch}</code><a href="#tab-or" data-tab-go="or" style="text-decoration:underline">Xem hành trình mẻ quả</a></div>
 </div>
</div>
<div class="tabs" id="tabs">
 <div class="tabs__nav" role="tablist">${[['ds','Mô tả'],['nu','Dinh dưỡng'],['bq','Bảo quản & sử dụng'],['or','Nguồn gốc'],['rv','Đánh giá']].map(([k,l],i)=>`<button role="tab" class="${i?'':'is-on'}" data-tab="${k}" id="tab-${k}">${l}</button>`).join('')}</div>
 <div class="tabs__panel is-on" data-panel="ds"><div class="prose"><p>${p.long||p.short}</p><p>Mỗi gói được hút ẩm và đóng trong túi zip giấy kraft tráng bạc, dễ bảo quản sau khi mở. Phù hợp làm món ăn vặt hằng ngày, đãi khách hoặc biếu tặng.</p><ul><li>Xuất xứ: ${p.origin} (${reg.area})</li><li>Phân loại: ${MQ.CATS[p.cat].name}</li><li>Quy cách: ${p.sizes.map(s=>s.w).join(' / ')}</li><li>Mùa vụ: ${p.season||'—'}</li></ul></div></div>
 <div class="tabs__panel" data-panel="nu"><table class="ntable"><caption>Giá trị tham khảo trên 100g — số liệu minh hoạ cho bản demo</caption><tbody>${(NUT[p.cat]||NUT.deo).map(([a,b])=>`<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</tbody></table></div>
 <div class="tabs__panel" data-panel="bq"><div class="prose"><ul><li>Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</li><li>Sau khi mở, kéo kín miệng túi zip; dùng ngon nhất trong 7–10 ngày.</li><li>Có thể để ngăn mát tủ lạnh để giữ độ ${p.cat==='gion'?'giòn':'dẻo'} lâu hơn.</li><li>Hạn sử dụng: 6 tháng kể từ ngày sản xuất (in trên bao bì).</li><li>Gợi ý: ${p.cat==='tra'?'pha với 200ml nước sôi, thêm mật ong tuỳ thích.':'dùng kèm trà nóng, sữa chua, ngũ cốc hoặc bày mâm quả ngày Tết.'}</li></ul></div></div>
 <div class="tabs__panel" data-panel="or"><div class="prose"><p><b>${reg.name}</b> — ${reg.note}</p><p>Mã lô <code>${batch}</code> cho biết vùng trồng, ngày thu hái và ngày sấy của mẻ quả này. (Dữ liệu hành trình là minh hoạ.)</p></div>
   <div class="journey-line"><div><b>Thu hái</b>${reg.name} · 02/10/2026</div><div><b>Sơ chế</b>Rửa, gọt, thái tay</div><div><b>Sấy</b>${p.cat==='gion'?'Sấy chân không / thăng hoa':'Sấy lạnh 18–36 giờ'}</div><div><b>Kiểm định</b>Độ ẩm, cảm quan</div><div><b>Đóng gói</b>10/10/2026</div></div></div>
 <div class="tabs__panel" data-panel="rv">
   <div class="rsum"><div><div class="rsum__score">${p.rating||'—'}</div>${MQ.stars(p.rating||5,16)}<p class="small muted">${p.reviews||0} đánh giá mẫu</p></div>
   <div class="rsum__bars">${[5,4,3,2,1].map(s=>{const v=s===5?78:s===4?16:s===3?4:s===2?1:1;return `<div><span>${s}★</span><i><b style="width:${v}%"></b></i><span>${v}%</span></div>`}).join('')}</div>
   <button class="btn btn--line" data-rv-open>Viết đánh giá</button></div>
   <form class="rform" data-rform><div class="starpick" data-starpick>${[1,2,3,4,5].map(i=>`<button type="button" data-s="${i}" class="on" aria-label="${i} sao">★</button>`).join('')}</div><div class="row2"><label class="field"><span>Họ tên</span><input required name="n"></label><label class="field"><span>Tỉnh/thành</span><input name="c"></label></div><label class="field"><span>Nhận xét</span><textarea required rows="3" name="t"></textarea></label><button class="btn btn--dark" type="submit">Gửi đánh giá (demo)</button></form>
   <div data-rlist>${sampleRev.map(r=>`<div class="ritem"><div><b>${r.n}</b><small>${r.c} · Đã mua hàng</small></div><div>${MQ.stars(r.r)}<p>${r.t}</p><small class="muted">Nhận xét mẫu</small></div></div>`).join('')}</div>
 </div>
</div>`;
/* gallery */
const main=$('[data-main]'),zoom=$('[data-zoom]');
$$('.gallery__thumbs button').forEach(b=>b.addEventListener('click',()=>{main.src=MQ.img(b.dataset.img);$$('.gallery__thumbs button').forEach(x=>x.classList.toggle('is-on',x===b))}));
zoom.addEventListener('mousemove',e=>{const r=zoom.getBoundingClientRect();zoom.style.setProperty('--zx',((e.clientX-r.left)/r.width*100)+'%');zoom.style.setProperty('--zy',((e.clientY-r.top)/r.height*100)+'%')});
zoom.addEventListener('mouseenter',()=>matchMedia('(hover:hover)').matches&&zoom.classList.add('zoom'));zoom.addEventListener('mouseleave',()=>zoom.classList.remove('zoom'));
/* tabs */
const openTab=k=>{$$('[data-tab]').forEach(b=>b.classList.toggle('is-on',b.dataset.tab===k));$$('[data-panel]').forEach(x=>x.classList.toggle('is-on',x.dataset.panel===k))};
document.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t)openTab(t.dataset.tab);const g=e.target.closest('[data-tab-go]');if(g){e.preventDefault();openTab(g.dataset.tabGo);$('#tabs').scrollIntoView({behavior:'smooth'})}});
/* reviews form */
let rs=5;$('[data-rv-open]').addEventListener('click',()=>$('[data-rform]').classList.toggle('is-on'));
$$('[data-starpick] button').forEach(b=>b.addEventListener('click',()=>{rs=+b.dataset.s;$$('[data-starpick] button').forEach(x=>x.classList.toggle('on',+x.dataset.s<=rs))}));
$('[data-rform]').addEventListener('submit',e=>{e.preventDefault();const f=e.target;$('[data-rlist]').insertAdjacentHTML('afterbegin',`<div class="ritem"><div><b>${MQ.esc(f.n.value)}</b><small>${MQ.esc(f.c.value||'Khách hàng')} · Vừa xong</small></div><div>${MQ.stars(rs)}<p>${MQ.esc(f.t.value)}</p><small class="muted">Đánh giá demo — chỉ hiển thị trên trình duyệt của bạn</small></div></div>`);f.reset();f.classList.remove('is-on');MQ.toast('Cảm ơn bạn đã đánh giá! (demo)')});
/* eta */
const etaSel=$('[data-eta-prov]'),upEta=()=>$('[data-eta]').textContent=MQ.eta(etaSel.value);etaSel.addEventListener('change',upEta);upEta();
/* share */
$('[data-share]')?.addEventListener('click',()=>{navigator.clipboard?.writeText(location.href).then(()=>MQ.toast('Đã sao chép liên kết sản phẩm'),()=>MQ.toast('Liên kết: '+location.href))});
if(!soon){
 let si=0;const qty=$('[data-qty]');
 const upd=()=>{const s=p.sizes[si];$('[data-price]').textContent=MQ.fmt(s.p);$('[data-old]').textContent=s.old?MQ.fmt(s.old):'';$('[data-wlabel]').textContent=s.w;
   const g=parseFloat(s.w.replace(',','.'))*(/kg/.test(s.w)?1000:1);$('[data-unit]').textContent=g&&/g$/.test(s.w)?`≈ ${MQ.fmt(s.p/g*100)} / 100g`:'';
   const sb=$('[data-sticky]');sb.querySelector('[data-sp]').textContent=MQ.fmt(s.p)+' · '+s.w};
 $('[data-sticky]').innerHTML=`<div class="stickybuy__in"><img src="${MQ.img(p.img)}" alt=""><b>${p.name}<small data-sp></small></b><button class="btn btn--gold btn--sm" data-add-pd>Thêm vào giỏ</button></div>`;
 $$('[data-vars] .var').forEach(b=>b.addEventListener('click',()=>{si=+b.dataset.i;$$('[data-vars] .var').forEach(x=>x.classList.toggle('is-on',x===b));upd()}));
 $$('[data-q]').forEach(b=>b.addEventListener('click',()=>{qty.value=Math.max(1,Math.min(99,(+qty.value||1)+ +b.dataset.q))}));
 const n=()=>Math.max(1,Math.min(99,+qty.value||1));
 document.addEventListener('click',e=>{if(e.target.closest('[data-add-pd]'))MQ.cart.addProduct(p.id,p.sizes[si].w,n());if(e.target.closest('[data-buy-now]')){MQ.cart.addProduct(p.id,p.sizes[si].w,n(),true);location.href='thanh-toan.html'}});
 upd();
 const bt=$('.buy');new IntersectionObserver(([en])=>$('[data-sticky]').classList.toggle('is-on',!en.isIntersecting&&en.boundingClientRect.top<0)).observe(bt);
}
/* bundle */
const live=MQ.PRODUCTS.filter(x=>!x.soon&&x.id!==p.id);
const mates=[...live.filter(x=>x.region===p.region),...live.filter(x=>x.cat!==p.cat)].filter((x,i,a)=>a.indexOf(x)===i).slice(0,2);
if(soon||!mates.length)$('[data-bundle-wrap]').hidden=true;else{
 const set=[p,...mates],on=set.map(()=>true);
 const bw=$('[data-bundle]');
 const draw=()=>{const sel=set.filter((x,i)=>on[i]);const full=sel.reduce((s,x)=>s+x.sizes[0].p,0);const disc=sel.length===set.length?Math.round(full*.05/1000)*1000:0;
  bw.innerHTML=`<div class="bundle__items">${set.map((x,i)=>`${i?'<span class="bundle__plus">+</span>':''}<div class="bundle__it${on[i]?'':' off'}"><label><input type="checkbox" data-bi="${i}"${on[i]?' checked':''}${i?'':' disabled'} aria-label="Chọn ${MQ.esc(x.name)}"></label><img src="${MQ.img(x.img)}" alt=""><b>${x.name}</b><small>${x.sizes[0].w} · ${MQ.fmt(x.sizes[0].p)}</small></div>`).join('')}</div>
  <div class="bundle__sum"><span class="small muted">Tổng ${sel.length} sản phẩm</span><b>${MQ.fmt(full-disc)}</b>${disc?`<s>${MQ.fmt(full)}</s><small>Tiết kiệm ${MQ.fmt(disc)} khi mua trọn combo</small>`:'<small>Chọn đủ 3 món để được giảm 5%</small>'}<button class="btn btn--dark" data-bundle-add>Thêm ${sel.length} món vào giỏ</button></div>`;
  bw.dataset.disc=disc};
 bw.addEventListener('change',e=>{const i=e.target.dataset.bi;if(i!==undefined){on[+i]=e.target.checked;draw()}});
 bw.addEventListener('click',e=>{if(!e.target.closest('[data-bundle-add]'))return;const full=set.every((x,i)=>on[i]);
  set.forEach((x,i)=>{if(!on[i])return;const s=x.sizes[0];MQ.cart.add(full?{key:x.id+'|'+s.w+'|combo',id:x.id,name:x.name,w:s.w,meta:'Combo −5%',price:Math.round(s.p*.95/1000)*1000,img:x.img}:{key:x.id+'|'+s.w,id:x.id,name:x.name,w:s.w,price:s.p,img:x.img},1)});
  MQ.toast('Đã thêm combo vào giỏ');MQ.bump();setTimeout(MQ.openCart,300)});
 draw();
}
$('[data-related]').innerHTML=live.filter(x=>x.cat===p.cat||x.region===p.region).slice(0,8).map(x=>MQ.card(x)).join('');
MQ.renderRecent(p.id);
})();
