(function(){
const MQ=window.MQ,{$,$$}=MQ;
/* hero slideshow */
const sl=$$('[data-slides] img'),dots=$$('[data-dots] button');let cur=0,timer;
const go=i=>{cur=(i+sl.length)%sl.length;sl.forEach((s,k)=>s.classList.toggle('is-on',k===cur));dots.forEach((d,k)=>d.classList.toggle('is-on',k===cur))};
const auto=()=>{clearInterval(timer);timer=setInterval(()=>go(cur+1),5200)};
dots.forEach((d,k)=>d.addEventListener('click',()=>{go(k);auto()}));auto();
/* categories */
const CI={deo:'xoai2.jpg',gion:'mit.jpg',mix:'mix.jpg',tra:'camlat.jpg'};
const cnt=k=>MQ.PRODUCTS.filter(p=>p.cat===k&&!p.soon).length;
$('[data-cats]').innerHTML=['deo','gion','mix','tra'].map(k=>{const c=MQ.CATS[k];return `<a class="cat reveal" href="cua-hang.html?cat=${k}"><img src="${MQ.img(CI[k])}" alt="" loading="lazy"><div><div><small>${cnt(k)} sản phẩm</small><h3>${c.name}</h3><p>${c.desc}</p></div><span class="arrowc"><svg><use href="#i-arrow"/></svg></span></div></a>`}).join('')+
 `<a class="cat reveal" href="cua-hang.html?cat=hat"><img src="${MQ.img('hat.jpg')}" alt="" loading="lazy"><div><div><small>Sắp ra mắt</small><h3>Hạt, trà &amp; cà phê</h3><p>Đăng ký nhận tin ra mắt.</p></div><span class="arrowc"><svg><use href="#i-arrow"/></svg></span></div></a>`;
/* product tabs */
const live=MQ.PRODUCTS.filter(p=>!p.soon);
const sets={best:()=>[...live].sort((a,b)=>b.sold-a.sold),new:()=>live.filter(p=>p.isNew).concat(live.filter(p=>!p.isNew)),nosugar:()=>live.filter(p=>p.noSugar||p.taste.ngot<=3),sale:()=>live.filter(p=>p.sizes.some(s=>s.old))};
const grid=$('[data-home-grid]');
const show=t=>{grid.innerHTML=sets[t]().slice(0,8).map(p=>MQ.card(p)).join('');};
$$('[data-ptabs] .chip').forEach(b=>b.addEventListener('click',()=>{$$('[data-ptabs] .chip').forEach(x=>x.classList.toggle('is-on',x===b));show(b.dataset.t)}));show('best');
/* region map */
const regs=Object.entries(MQ.REGIONS).filter(([k])=>k!=='nhieuvung');
const left=['dalat','mientay','hungyen'];
$('[data-pins]').innerHTML=regs.map(([k,r])=>`<button class="pin${left.includes(k)?' pin--l':''}" data-r="${k}" style="left:${r.x}%;top:${r.y}%"><i></i><span>${r.name}</span></button>`).join('');
$('[data-rtabs]').innerHTML=regs.map(([k,r])=>`<button class="chip" data-r="${k}">${r.name}</button>`).join('');
const pickR=k=>{const r=MQ.REGIONS[k],ps=live.filter(p=>p.region===k);
  $$('[data-r]').forEach(b=>b.classList.toggle('is-on',b.dataset.r===k));
  $('[data-rcard]').innerHTML=`<small>${r.area}</small><h3>${r.name}</h3><p>${r.note}</p><div class="region-card__prods">${ps.slice(0,3).map(p=>`<a class="rp" href="${MQ.url(p)}"><img src="${MQ.img(p.img)}" alt="" loading="lazy"><b>${p.name}</b><small>từ ${MQ.fmt(p.sizes[0].p)}</small></a>`).join('')}</div><a class="btn btn--ghost btn--sm" href="cua-hang.html?region=${k}">Xem ${ps.length} sản phẩm vùng ${r.name} <svg><use href="#i-arrow"/></svg></a>`};
document.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(b)pickR(b.dataset.r)});pickR('dalat');
/* gifts */
$('[data-gifts]').innerHTML=MQ.GIFTS.map(MQ.giftCard).join('');
$('[data-teaser-art]').innerHTML=MQ.giftSvg('#7a2e22','#d8b878');
/* calendar, reviews, soon, posts */
$('[data-calendar]').innerHTML=MQ.calendar();
$('[data-now-season]').textContent=MQ.inSeason().join(', ');
$('[data-reviews]').innerHTML=MQ.REVIEWS.slice(0,3).map(MQ.reviewCard).join('');
$('[data-soon]').innerHTML=MQ.PRODUCTS.filter(p=>p.soon).slice(0,4).map(p=>MQ.card(p)).join('');
$('[data-posts]').innerHTML=MQ.POSTS.map(a=>MQ.postCard(a)).join('');
MQ.renderRecent();
MQ.reveal();
})();
