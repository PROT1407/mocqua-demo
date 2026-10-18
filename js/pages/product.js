(function(){
const FIG=(im,cls='')=>im?`<figure class="dsc__fig ${cls}"><img src="${im.src.startsWith('desc/')?'assets/'+im.src+'?v='+MQ.IMGV:MQ.img(im.src)}" alt="${MQ.esc(im.alt||'')}" loading="lazy" width="1200" height="750">${im.cap||im.credit?`<figcaption>${im.cap?`<b>${MQ.esc(im.cap)}</b> `:''}${im.credit?(im.href?`<a href="${im.href}" target="_blank" rel="noopener">${MQ.esc(im.credit)}</a>`:MQ.esc(im.credit)):''}</figcaption>`:''}</figure>`:'';
const DESC=d=>`<div class="dsc"><div class="dsc__lead"><p>${MQ.esc(d.intro)}</p>${FIG(d.img,'dsc__fig--lead')}</div>${d.sec.map((x,i)=>`<section class="dsc__sec dsc__sec--${x.k}${x.img?' has-fig':''}"><div class="dsc__txt"><h3>${MQ.esc(x.h)}</h3>${(x.p||[]).map(t=>`<p>${MQ.esc(t)}</p>`).join('')}${x.li?`<ul>${x.li.map(t=>`<li>${MQ.esc(t)}</li>`).join('')}</ul>`:''}${x.spec?`<table class="dsc__spec"><tbody>${x.spec.map(r=>`<tr><th>${MQ.esc(r[0])}</th><td>${MQ.esc(r[1])}</td></tr>`).join('')}</tbody></table>`:''}</div>${FIG(x.img)}</section>`).join('')}</div>`;
const MQ=window.MQ,{$,$$}=MQ;
{const a=(MQ.ID_ALIAS||{})[MQ.qs('id')];if(a){const k=MQ.qs('sku');location.replace('san-pham.html?id='+a+(k?'&sku='+k:''));return}}
const p=MQ.byId(MQ.qs('id')||'xoai-say-deo');
{const k=MQ.qs('sku'),o=k&&p&&!MQ.vars(p).some(x=>x.sku===((MQ.SKU_ALIAS||{})[k]||k))&&MQ.PRODUCTS.find(x=>MQ.vars(x).some(y=>y.sku===k));if(o){location.replace(MQ.url(o)+'&sku='+k);return}}
const root=$('[data-pd]');
if(!p){root.innerHTML=`<div class="empty"><svg><use href="#mark"/></svg><h3>Không tìm thấy sản phẩm</h3><p>Sản phẩm có thể đã đổi tên hoặc ngừng kinh doanh.</p><a class="btn btn--dark" href="cua-hang.html">Về cửa hàng</a></div>`;$$('[data-bundle-wrap],.section').forEach(s=>s.hidden=true);return}
document.title=p.name+' | Mộc Quả (demo)';
$('[data-crumb]').insertAdjacentHTML('beforeend',`<span><a href="cua-hang.html?cat=${p.cat}">${MQ.CATS[p.cat].short}</a></span>${p.fruit?`<span><a href="cua-hang.html?fruit=${p.fruit}">${MQ.FRUITS[p.fruit].name}</a></span>`:''}<span>${p.name}</span>`);
MQ.recent.add(p.id);
const soon=!!p.soon, vars=MQ.vars(p);
let v=MQ.findVar(p,MQ.qs('sku'));
const maker=MQ.MAKERS[p.maker]||{};
const flv=p.flavour?MQ.FLAVOURS[p.flavour].name:'';
const bars=n=>Array.from({length:5},(_,i)=>`<b class="${i<n?'on':''}"></b>`).join('');
const imgsOf=x=>[x.img,x.back].filter(Boolean);
const allImgs0=()=>[...(p.gallery&&v===vars[0]?p.gallery:imgsOf(v)),...vars.filter(x=>x!==v).flatMap(imgsOf),...(p.gallery||[]).slice(1)].filter((x,i,a)=>x&&a.indexOf(x)===i);
const allImgs=()=>{const a=allImgs0();if(p.real)a.splice(1,0,p.real.img);return a};
const best=p.packs?Math.min(...vars.filter(x=>x.p&&x.g).map(x=>x.p/x.g)):0;
const varBtns=()=>(p.packs?MQ.sizeVars(p,v):vars).map(x=>`<button class="var${(p.packs?x.w===v.w:x===v)?' is-on':''}${x.p?'':' is-quote'}" data-sku="${x.sku}"><span>${MQ.esc(x.w)}</span>${x.line&&!p.own&&!p.packs?`<em>${MQ.lineName(x.line)}</em>`:''}<small>${soon?'—':x.p?MQ.fmt(x.p):'Liên hệ'}</small>${p.packs&&x.p&&x.g?`<i class="var__u">≈ ${MQ.per100(x)}</i>${x.p/x.g===best?'<b class="var__best">Lợi nhất</b>':''}`:''}</button>`).join('');
/* mẫu bao bì (cùng khối lượng = cùng giá) */
const packBtns=()=>!p.packs?'':Object.entries(p.packs).map(([k,pk])=>{const has=vars.some(x=>x.pk===k&&x.w===v.w),ws=[...new Set(vars.filter(x=>x.pk===k).map(x=>x.w))];
  return `<button type="button" class="sw${v.pk===k?' is-on':''}${has?'':' is-na'}" data-pk="${k}" title="${MQ.esc(pk.name)}${has?'':' · có ở '+ws.join(', ')}" aria-label="Mẫu bao bì ${MQ.esc(pk.name)}"><i style="background:linear-gradient(180deg,${pk.c[0]} 0 55%,${pk.c[1]} 55%)"></i><span>${MQ.esc(pk.name)}<small>${ws.join(' · ')}</small></span></button>`}).join('');
const spec=()=>[['Mã sản phẩm',`<code>${v.sku}</code>`],...(p.own?[['Thương hiệu','Mộc Quả · mocqua.com'],['Đóng gói',p.cat==='set'?(p.pack||'Set quà Mộc Quả'):(/^Hũ PET/.test(v.w)?'Hũ PET trong, nắp vặn xanh viền vàng, tem tròn Mộc Quả':/^Hộp vuông/.test(v.w)?'Hộp vuông nhựa PET trong, tem tròn Mộc Quả':/^Hộp bát giác/.test(v.w)?'Hộp bát giác nhựa PET trong, tem tròn Mộc Quả':p.giftbox?(p.pack||'Hộp quà Mộc Quả'):'Túi zip đứng có cửa sổ, nhãn Mộc Quả')]]:[['Nhà sản xuất',maker.name||'—'],['Dòng sản phẩm',MQ.lineName(v.line)||'Đang cập nhật']]),['Cách sấy',MQ.CATS[p.cat].name],['Hương vị',flv||'—'],['Khối lượng',(v.g?(v.w.split(' · ').find(x=>/\d/.test(x))||v.w):(v.note||'Đang xác nhận'))+(p.wnote?` <small class="wnote">(${MQ.esc(p.wnote)})</small>`:'')]];
const OCC=['Ăn vặt văn phòng, giờ nghỉ trưa','Mang theo khi du lịch, dã ngoại','Nhâm nhi cùng trà, cà phê, xem phim','Bày mâm quả, hộp quà Tết, quà biếu'];
root.innerHTML=`<div class="pd">
 <div class="gallery">
  <div class="gallery__thumbs" data-thumbs></div>
  <div class="gallery__main" data-zoom><img src="${MQ.img(v.img)}" alt="${MQ.esc(p.name)}" data-main>${p.oos?'<span class="badge badge--oos">Hết hàng</span>':p.badge?`<span class="badge badge--hot">${p.badge}</span>`:''}${p.own?'':'<span class="gallery__note">Ảnh bao bì thật · di chuột để phóng to</span>'}${p.real?`<span class="gallery__real" data-realcap hidden>${MQ.esc(p.real.cap)}</span>`:''}</div>
 </div>
 <div class="pinfo">
  <span class="pinfo__origin">${MQ.CATS[p.cat].name}${flv?' · '+flv:''}</span>
  <h1>${p.name}</h1>${p.tagline?`<p class="pinfo__tag">${MQ.esc(p.tagline)}</p>`:''}
  <div class="pinfo__brand">${p.own?'<span class="pinfo__mq"><i class="mqseal" aria-hidden="true">MQ</i>Thương hiệu: <b>Mộc Quả</b> · mocqua.com</span><span>Tuyển chọn &amp; đóng gói bởi Mộc Quả</span>':`<span>Nhà sản xuất: <b>${maker.name}</b></span><span>Dòng sản phẩm: <b data-line>${MQ.lineName(v.line)||'Đang cập nhật'}</b></span>`}<span class="pinfo__auth"><svg><use href="#i-shield"/></svg>${p.own?'Nguồn quả rõ ràng':'Hàng chính hãng'}</span>${p.maker==='viza'?`<a class="pinfo__shelf" href="${MQ.SHELF_URL}"><svg><use href="#i-shield"/></svg>Xem hàng trên kệ</a>`:''}</div>
  ${soon?`<p class="pinfo__short">${p.short}</p><p class="notice">Sản phẩm đang chuẩn bị ra mắt. Đăng ký để được báo khi mở bán.</p><button class="btn btn--gold" data-notify="${p.id}">Báo tôi khi có hàng</button>`:`
  <div class="pinfo__price" data-pricebox></div>${MQ.dealTag(p,' deal--lg')}
  ${p.own||p.vizabox?`<ul class="trust" aria-label="Cam kết"><li><svg><use href="#i-check"/></svg><span><b>Hoàn tiền 100%</b> nếu không hài lòng</span></li><li><svg><use href="#i-shield"/></svg><span>${p.own?'<b>Sản xuất tại VN</b> nguồn quả rõ vùng':'<b>Chính hãng Viza Food</b> nguyên hộp, nguyên tem'}</span></li><li><svg><use href="#i-gift"/></svg><span><b>Cam kết chất lượng</b> &amp; VSATTP</span></li></ul>`:''}
  <ul class="perks" data-perks></ul>
  <p class="pinfo__short">${p.short}</p>
  ${p.contents?`<div class="inbox"><div class="inbox__h"><svg><use href="#i-gift"/></svg>Trong ${p.box==='basket'?'giỏ':p.box==='tubs'||p.box==='boxes'?'combo':p.box&&p.box.startsWith('tray')?'khay':'hộp'} có <em>${p.contents.length} ${p.box==='boxes'?'hộp':p.box==='tubs'||p.box==='basket'||p.box==='jars6'?'hũ':'ngăn'} · ${(t=>t>=1000?(t/1000).toLocaleString('vi-VN')+'kg':t+'g')(p.contents.reduce((a,c)=>a+c[1],0))}</em></div><ol class="inbox__list">${p.contents.map(c=>`<li><span>${MQ.esc(c[0])}</span><b>${c[1]}g</b></li>`).join('')}</ol>${p.occ?`<div class="inbox__occ"><small>Dịp tặng:</small>${p.occ.map(o=>`<span>${MQ.esc(o)}</span>`).join('')}</div>`:''}</div>`:''}
  <div class="opt-label">Chọn quy cách <em data-wlabel></em></div>
  <div class="variants variants--rich" data-vars>${varBtns()}</div>
  ${p.packs?`<div class="opt-label">Mẫu bao bì <em data-pklabel></em></div><div class="swatches" data-packs>${packBtns()}</div><p class="pk-note">${p.pknote||'Cùng khối lượng – cùng giá, mọi mẫu bao bì. Bên trong là cùng một loại xoài sấy; mẫu túi thay đổi theo đợt hàng của nhà sản xuất.'}</p>`:''}${p.custom?`<a class="pk-custom" href="${MQ.zaloQuote(p,v)}" target="_blank" rel="noopener"><svg><use href="#i-zalo"/></svg><span>${MQ.esc(p.custom)}</span></a>`:''}
  <div data-buybox></div>`}
  <dl class="spec" data-spec></dl>
  <ul class="commit"><li><svg><use href="#i-shield"/></svg>${p.own?'Quả tuyển chọn, đóng gói mới mỗi đợt':'Hàng chính hãng, nguồn gốc rõ ràng'}</li><li><svg><use href="#i-check"/></svg>Đổi trả 7 ngày nếu lỗi, ẩm mốc</li><li><svg><use href="#i-truck"/></svg>Giao toàn quốc · miễn phí từ ${MQ.fmt(MQ.FREE_SHIP)}</li><li><svg><use href="#i-gift"/></svg>Gói quà &amp; thiệp viết tay miễn phí</li></ul>
  <div class="eta"><svg style="width:22px;height:22px;color:var(--gold)"><use href="#i-truck"/></svg><span>Giao đến</span><select data-eta-prov aria-label="Tỉnh thành">${MQ.provOptions('TP. Hồ Chí Minh')}</select><span>dự kiến <b data-eta></b></span></div>
  ${p.taste?`<div class="taste">${[['Ngọt','ngot'],['Chua','chua'],['Dẻo','deo'],['Giòn','gion']].map(([l,k])=>`<div><span>${l}</span><i>${bars(p.taste[k])}</i></div>`).join('')}</div>`:''}
 </div>
</div>
<div class="tabs" id="tabs">
 <div class="tabs__nav" role="tablist">${[['ds','Mô tả'],['ma',p.own?'Thương hiệu':'Nhà sản xuất'],['bq','Bảo quản & sử dụng'],['rv','Đánh giá']].map(([k,l],i)=>`<button role="tab" class="${i?'':'is-on'}" data-tab="${k}" id="tab-${k}">${l}</button>`).join('')}</div>
 <div class="tabs__panel is-on" data-panel="ds">${p.desc?DESC(p.desc):`<div class="prose"><p>${p.long||p.short}</p>
   <h4>Thông tin sản phẩm</h4><ul><li>Phân loại: ${MQ.CATS[p.cat].name}${flv?' · '+flv:''}</li><li>Quy cách đang bán: ${p.packs?MQ.sizeVars(p).map(x=>x.w+' — '+MQ.fmt(x.p)+' (≈ '+MQ.per100(x)+')').join(' · ')+'</li><li>Mẫu bao bì: '+Object.values(p.packs).map(k=>k.name).join(', ')+' — cùng khối lượng cùng giá':vars.map(x=>x.w+(x.line?' ('+MQ.lineName(x.line)+')':'')).join(' · ')}</li><li>Bao bì: ${p.own?(p.cat==='set'?(p.pack||'set quà Mộc Quả'):(vars.some(x=>/^(Hũ|Hộp)/.test(x.w))?'chọn Hũ PET trong nắp vặn có tem tròn Mộc Quả (đẹp để biếu, đậy kín nhiều lần) hoặc Túi zip đứng refill giá mềm hơn':'túi zip đứng Mộc Quả có cửa sổ nhìn rõ sản phẩm, khoá zip đóng mở nhiều lần')):'giữ nguyên bao bì gốc của nhà sản xuất'}</li>${p.own?'':''}<li>Thành phần, hạn sử dụng, thông tin dinh dưỡng: in trên bao bì (xem ảnh mặt sau nếu có).</li></ul>
   ${p.contents?`<h4>Thành phần hộp quà</h4><ul>${p.contents.map(c=>`<li>${MQ.esc(c[0])} — ${c[1]}g</li>`).join('')}</ul><h4>Dịp tặng phù hợp</h4><ul>${(p.occ||[]).map(o=>`<li>${o}</li>`).join('')}</ul>`:`<h4>Ăn lúc nào cũng hợp</h4><ul>${OCC.map(o=>`<li>${o}</li>`).join('')}</ul>`}</div></div>`}
 <div class="tabs__panel" data-panel="ma"><div class="maker">${MQ.mark('maker__mark')}<div><h4>${maker.name||'Mộc Quả'}</h4><p>${maker.note||''}</p>${p.own?'':`<p>Mộc Quả là nhà bán lẻ — phân phối nguyên bao bì các dòng sản phẩm của ${maker.name}: ${Object.values(MQ.LINES).filter(l=>l.maker===p.maker).map(l=>l.name).join(', ')}.</p>`}</div></div></div>
 <div class="tabs__panel" data-panel="bq">${p.desc&&p.desc.sec.find(x=>x.k==='dung')?`<div class="prose dsc__plain">${p.desc.sec.find(x=>x.k==='dung').p.map(t=>`<p>${MQ.esc(t)}</p>`).join('')}</div>`:''}<div class="prose"${p.desc&&p.desc.sec.find(x=>x.k==='dung')?' hidden':''}><ul><li>Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.</li><li>Sau khi mở, đóng kín miệng túi; dùng ngon nhất trong 7–10 ngày.</li><li>${p.cat==='deo'?'Có thể để ngăn mát tủ lạnh để giữ độ dẻo lâu hơn.':'Sản phẩm sấy giòn / thăng hoa rất dễ hút ẩm — nên dùng hết sau khi mở.'}</li><li>Hạn sử dụng: xem trên bao bì.</li></ul></div></div>
 <div class="tabs__panel" data-panel="rv">
   <div class="rsum rsum--empty"><div><p><b>Chưa có đánh giá cho sản phẩm này.</b></p><p class="small muted">Hãy là người đầu tiên chia sẻ cảm nhận.</p></div><button class="btn btn--line" data-rv-open>Viết đánh giá</button></div>
   <form class="rform" data-rform><div class="starpick" data-starpick>${[1,2,3,4,5].map(i=>`<button type="button" data-s="${i}" class="on" aria-label="${i} sao">★</button>`).join('')}</div><div class="row2"><label class="field"><span>Họ tên</span><input required name="n"></label><label class="field"><span>Tỉnh/thành</span><input name="c"></label></div><label class="field"><span>Nhận xét</span><textarea required rows="3" name="t"></textarea></label><button class="btn btn--dark" type="submit">Gửi đánh giá (demo)</button></form>
   <div data-rlist></div>
 </div>
</div>`;
/* gallery */
const main=$('[data-main]'),zoom=$('[data-zoom]');
const VID=p.video?`<button class="gthumb--vid" data-vid aria-label="Xem video sản phẩm"><img src="assets/${p.video.poster}?v=${MQ.IMGV}" alt=""><i aria-hidden="true"></i></button>`:'';
const drawThumbs=()=>{const t=allImgs().map((im,i)=>`<button class="${im===v.img?'is-on':''}" data-img="${im}" aria-label="${p.real&&im===p.real.img?'Ảnh thật ruột sản phẩm':'Ảnh '+(i+1)}"><img src="${MQ.img(p.real&&im===p.real.img?im.replace('.webp','-t.webp'):im,true)}" alt=""></button>`);if(VID)t.splice(1,0,VID);$('[data-thumbs]').innerHTML=t.join('')};
const hideVid=()=>{const x=zoom.querySelector('video');if(x){x.pause();x.remove()}main.hidden=false;zoom.classList.remove('has-vid')};
const showVid=()=>{if(zoom.querySelector('video'))return;main.hidden=true;zoom.classList.add('has-vid');zoom.classList.remove('zoom');
  zoom.insertAdjacentHTML('afterbegin',`<video class="gallery__vid" controls playsinline preload="none" poster="assets/${p.video.poster}?v=${MQ.IMGV}"><source src="assets/${p.video.src}?v=${MQ.IMGV}" type="video/mp4">Trình duyệt chưa hỗ trợ video.</video>`);const x=zoom.querySelector('video');x.play&&x.play().catch(()=>{})};
const realCap=im=>{const c=$('[data-realcap]');if(!c)return;const on=im===p.real.img;c.hidden=!on;zoom.classList.toggle('is-real',on);main.alt=on?p.real.cap+' — '+p.name:p.name};
drawThumbs();
$('[data-thumbs]').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-vid')){showVid();$$('[data-thumbs] button').forEach(x=>x.classList.toggle('is-on',x===b));return}hideVid();main.src=MQ.img(b.dataset.img);realCap(b.dataset.img);$$('[data-thumbs] button').forEach(x=>x.classList.toggle('is-on',x===b))});
zoom.addEventListener('mousemove',e=>{const r=zoom.getBoundingClientRect();zoom.style.setProperty('--zx',((e.clientX-r.left)/r.width*100)+'%');zoom.style.setProperty('--zy',((e.clientY-r.top)/r.height*100)+'%')});
zoom.addEventListener('mouseenter',()=>matchMedia('(hover:hover)').matches&&!zoom.classList.contains('has-vid')&&zoom.classList.add('zoom'));zoom.addEventListener('mouseleave',()=>zoom.classList.remove('zoom'));
const drawSpec=()=>{$('[data-spec]').innerHTML=spec().map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')};drawSpec();
/* tabs */
const openTab=k=>{$$('[data-tab]').forEach(b=>b.classList.toggle('is-on',b.dataset.tab===k));$$('[data-panel]').forEach(x=>x.classList.toggle('is-on',x.dataset.panel===k))};
document.addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(t)openTab(t.dataset.tab);const g=e.target.closest('[data-tab-go]');if(g){e.preventDefault();openTab(g.dataset.tabGo);$('#tabs').scrollIntoView({behavior:'smooth'})}});
/* reviews form */
let rs=5;$('[data-rv-open]').addEventListener('click',()=>$('[data-rform]').classList.toggle('is-on'));
$$('[data-starpick] button').forEach(b=>b.addEventListener('click',()=>{rs=+b.dataset.s;$$('[data-starpick] button').forEach(x=>x.classList.toggle('on',+x.dataset.s<=rs))}));
$('[data-rform]').addEventListener('submit',e=>{e.preventDefault();const f=e.target;$('[data-rlist]').insertAdjacentHTML('afterbegin',`<div class="ritem"><div><b>${MQ.esc(f.n.value)}</b><small>${MQ.esc(f.c.value||'Khách hàng')} · Vừa xong</small></div><div>${MQ.stars(rs)}<p>${MQ.esc(f.t.value)}</p><small class="muted">Đánh giá demo — chỉ hiển thị trên trình duyệt của bạn</small></div></div>`);f.reset();f.classList.remove('is-on');MQ.toast('Cảm ơn bạn đã đánh giá! (demo)')});
/* eta */
const etaSel=$('[data-eta-prov]'),upEta=()=>$('[data-eta]').textContent=MQ.eta(etaSel.value);etaSel.addEventListener('change',upEta);upEta();
if(!soon){
 const n=()=>{const q=$('[data-qty]');return q?Math.max(1,Math.min(99,+q.value||1)):1};
 const upd=()=>{
   $('[data-pricebox]').innerHTML=v.p?`<small>Giá bán</small><b>${MQ.fmt(v.p)}</b>${v.g?`<span class="pinfo__unit">≈ ${MQ.fmt(Math.round(v.p/v.g*100/100)*100)} / 100g</span>`:''}`:`<small>Giá</small><b class="is-quote">Liên hệ báo giá</b>`;
   const zipV=p.own&&p.cat!=='set'&&!p.giftbox&&!/^(Hũ|Hộp)/.test(v.w),T=MQ.TIERS;
   $('[data-perks]').innerHTML=v.p?[
     p.own&&(p.cat==='set'||p.giftbox)?`<li class="perk"><svg><use href="#i-gift"/></svg><span><b>Quà tặng kèm:</b> mỗi ${p.giftbox?'hộp quà':'set'} tặng 1 túi 100g — Xoài cát sấy dẻo, Dâu tây sấy dẻo hoặc Xí muội đỏ (chọn trong giỏ hàng).</span></li>`:'',
     p.combo?`<li class="perk"><svg><use href="#i-gift"/></svg><span><b><a href="san-pham.html?id=${p.combo.id}">${MQ.esc(p.combo.label)}</a></b> — chọn nhãn vàng GoodGood, xanh Fresh &amp; Healthy hoặc trộn. Mua lẻ đủ 5 túi 100g, giỏ hàng cũng tự tính giá combo.</span></li>`:'',
     p.bundle?`<li class="perk"><svg><use href="#i-gift"/></svg><span><b>Khuyến mãi: ${MQ.esc(p.bundle.label)}</b> — giỏ hàng tự thêm quà 0đ (${MQ.esc((MQ.byId(p.bundle.gid)||p).name)} · ${MQ.esc((MQ.findVar(MQ.byId(p.bundle.gid)||p,p.bundle.gsku)||{}).w||'')}) cho mỗi ${p.bundle.buy} ${p.bundle.buy>1?'hộp/gói':'combo'}.</span></li>`:'',
     zipV?`<li class="perk"><svg><use href="#i-cart"/></svg><span><b>Mua nhiều túi zip:</b> từ 3 túi Mộc Quả (cộng mọi vị) giảm 5%, từ 6 túi giảm 8%.</span></li>`:'',
     `<li class="perk"><svg><use href="#i-truck"/></svg><span>Đơn từ ${MQ.fmt(T[2].min)} <b>−${T[2].pct}%</b> · từ ${MQ.fmt(T[1].min)} <b>−${T[1].pct}%</b> · từ ${MQ.fmt(T[0].min)} <b>−${T[0].pct}%</b> · miễn phí giao từ ${MQ.fmt(MQ.FREE_SHIP)} — tự áp dụng trong giỏ. <a href="chinh-sach.html#khuyen-mai">Chi tiết</a></span></li>`
   ].join(''):'';
   $('[data-wlabel]').textContent=MQ.varLabel(p,v);
   if(p.packs){$('[data-vars]').innerHTML=varBtns();$('[data-packs]').innerHTML=packBtns();$('[data-pklabel]').textContent=p.packs[v.pk].name}else
   $$('[data-vars] .var').forEach(x=>x.classList.toggle('is-on',x.dataset.sku===v.sku));
   const ln=$('[data-line]');if(ln)ln.textContent=MQ.lineName(v.line)||'Đang cập nhật';
   $('[data-buybox]').innerHTML=p.oos?`<div class="oos"><p><b>Hết hàng</b> — đợt hàng này đã bán hết, Mộc Quả đang chờ lô mới từ nhà sản xuất. Để lại đăng ký, có hàng là chúng tôi báo ngay.</p><button class="btn btn--gold" data-notify="${p.id}">Báo khi có hàng</button><a class="btn btn--line" href="tel:${MQ.TEL}">Hỏi hotline ${MQ.HOTLINE}</a></div>`:v.p?`<div class="buy"><div class="qty"><button data-q="-1" aria-label="Giảm">−</button><input type="number" value="1" min="1" max="99" data-qty aria-label="Số lượng"><button data-q="1" aria-label="Tăng">+</button></div>
     <button class="btn btn--dark" data-add-pd>Thêm vào giỏ</button><button class="btn btn--gold" data-buy-now>Mua ngay</button>
     <button class="wishbig${MQ.wish.has(p.id)?' is-on':''}" data-wish="${p.id}" aria-label="Yêu thích"><svg><use href="#i-heart${MQ.wish.has(p.id)?'-f':''}"/></svg></button></div>
     <div class="pd-links"><button data-share><svg><use href="#i-share"/></svg>Sao chép liên kết</button><a href="hop-qua.html#tu-thiet-ke"><svg><use href="#i-gift"/></svg>Cho vào hộp quà tự chọn</a><a href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg>Đặt qua hotline ${MQ.HOTLINE}</a></div>`
     :MQ.quoteBox(p,v);
   hideVid();main.src=MQ.img(v.img);realCap(v.img);drawThumbs();drawSpec();
   const sb=$('[data-sticky]');sb.querySelector('[data-sp]').textContent=(v.p?MQ.fmt(v.p):'Liên hệ báo giá')+' · '+MQ.varLabel(p,v);
   if(p.oos)sb.querySelector('[data-add-pd]').outerHTML=`<button class="btn btn--gold btn--sm" data-notify="${p.id}">Báo khi có hàng</button>`;else sb.querySelector('[data-add-pd]').textContent=v.p?'Thêm vào giỏ':'Nhận báo giá';
   history.replaceState(null,'',MQ.url(p)+'&sku='+v.sku);
 };
 $('[data-sticky]').innerHTML=`<div class="stickybuy__in"><img src="${MQ.img(p.img,true)}" alt=""><b>${p.name}<small data-sp></small></b><button class="btn btn--gold btn--sm" data-add-pd>Thêm vào giỏ</button></div>`;
 $('[data-vars]').addEventListener('click',e=>{const b=e.target.closest('.var');if(!b)return;v=MQ.findVar(p,b.dataset.sku);upd()});
 if(p.packs)$('[data-packs]').addEventListener('click',e=>{const b=e.target.closest('.sw');if(!b)return;const k=b.dataset.pk;v=vars.find(x=>x.pk===k&&x.w===v.w)||vars.filter(x=>x.pk===k).sort((a,c)=>Math.abs(a.g-v.g)-Math.abs(c.g-v.g))[0];upd()});
 document.addEventListener('click',e=>{
   if(e.target.closest('[data-q]')){const q=$('[data-qty]');q.value=Math.max(1,Math.min(99,(+q.value||1)+ +e.target.closest('[data-q]').dataset.q))}
   if(e.target.closest('[data-share]'))navigator.clipboard?.writeText(location.href).then(()=>MQ.toast('Đã sao chép liên kết sản phẩm'),()=>MQ.toast('Liên kết: '+location.href));
   if(e.target.closest('[data-add-pd]')&&!p.oos){if(v.p)MQ.cart.addProduct(p.id,v.sku,n());else MQ.quickView(p.id,v.sku)}
   if(e.target.closest('[data-buy-now]')&&!p.oos){MQ.cart.addProduct(p.id,v.sku,n(),true);location.href='thanh-toan.html'}});
 upd();
 const bt=$('[data-vars]');new IntersectionObserver(([en])=>$('[data-sticky]').classList.toggle('is-on',!en.isIntersecting&&en.boundingClientRect.top<0)).observe(bt);
}
/* combo mua kèm */
const live=MQ.PRODUCTS.filter(x=>!x.soon&&x.id!==p.id&&MQ.minPrice(x));
const mates=[...live.filter(x=>x.cat!==p.cat),...live.filter(x=>x.fruit!==p.fruit)].filter((x,i,a)=>a.indexOf(x)===i).sort((a,b)=>(a.rank||99)-(b.rank||99)).slice(0,2);
if(soon||!v.p||!mates.length)$('[data-bundle-wrap]').hidden=true;else{
 const set=[p,...mates],on=set.map(()=>true);
 const sv=x=>x===p?v:MQ.defVar(x);
 const bw=$('[data-bundle]');
 const draw=()=>{const sel=set.filter((x,i)=>on[i]);const full=sel.reduce((s,x)=>s+sv(x).p,0);const disc=sel.length===set.length?Math.round(full*.05/1000)*1000:0;
  bw.innerHTML=`<div class="bundle__items">${set.map((x,i)=>`${i?'<span class="bundle__plus">+</span>':''}<div class="bundle__it${on[i]?'':' off'}"><label><input type="checkbox" data-bi="${i}"${on[i]?' checked':''}${i?'':' disabled'} aria-label="Chọn ${MQ.esc(x.name)}"></label><img src="${MQ.img(sv(x).img,true)}" alt=""><b>${x.name}</b><small>${MQ.esc(MQ.varLabel(x,sv(x)))} · ${MQ.fmt(sv(x).p)}</small></div>`).join('')}</div>
  <div class="bundle__sum"><span class="small muted">Tổng ${sel.length} sản phẩm</span><b>${MQ.fmt(full-disc)}</b>${disc?`<s>${MQ.fmt(full)}</s><small>Tiết kiệm ${MQ.fmt(disc)} khi mua trọn combo</small>`:'<small>Chọn đủ 3 món để được giảm 5%</small>'}<button class="btn btn--dark" data-bundle-add>Thêm ${sel.length} món vào giỏ</button></div>`};
 bw.addEventListener('change',e=>{const i=e.target.dataset.bi;if(i!==undefined){on[+i]=e.target.checked;draw()}});
 bw.addEventListener('click',e=>{if(!e.target.closest('[data-bundle-add]'))return;const full=set.every((x,i)=>on[i]);
  set.forEach((x,i)=>{if(!on[i])return;const s=sv(x),w=MQ.varLabel(x,s);MQ.cart.add(full?{key:x.id+'|'+s.sku+'|combo',id:x.id,sku:s.sku,name:x.name,w,meta:'Combo −5%',price:Math.round(s.p*.95/1000)*1000,img:s.img}:{key:x.id+'|'+s.sku,id:x.id,sku:s.sku,name:x.name,w,price:s.p,img:s.img},1)});
  MQ.toast('Đã thêm combo vào giỏ');MQ.bump();setTimeout(MQ.openCart,300)});
 draw();
}
$('[data-related]').innerHTML=MQ.PRODUCTS.filter(x=>!x.soon&&x.id!==p.id).sort((a,b)=>((b.cat===p.cat)+(b.fruit===p.fruit))-((a.cat===p.cat)+(a.fruit===p.fruit))||(a.rank-b.rank)).slice(0,8).map(x=>MQ.card(x)).join('');
MQ.renderRecent(p.id);
})();
