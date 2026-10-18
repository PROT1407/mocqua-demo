(function(){
const MQ=window.MQ,{$,$$}=MQ,q=MQ.qs;
const TAGS={small:'Gói nhỏ (≤ 100g)',mid:'Túi vừa (120 – 300g)',big:'Túi lớn (≥ 350g)'};
const MAXP=800000;
const set=k=>new Set(q(k)?q(k).split(','):[]);
const st={cat:set('cat'),fruit:set('fruit'),flavour:set('flavour'),line:set('line'),tag:set('tag'),q:q('q')||'',max:MAXP,priced:false,soon:false,sort:q('sort')||'best',view:'grid',page:Math.max(1,+q('page')||1)};
if(st.cat.has('soon')){st.cat.delete('soon');st.soon=true;st.onlySoon=true}
const PER=24;
const all=MQ.PRODUCTS, live=all.filter(p=>!p.soon);
const opt=(name,k,label,n)=>`<label class="fopt"><input type="checkbox" data-${name}="${k}"${st[name].has(k)?' checked':''}><span>${label}</span><em>${n}</em></label>`;
const gs=v=>v.g||0;
const hasTag=(p,t)=>MQ.vars(p).some(v=>t==='small'?gs(v)>0&&gs(v)<=100:t==='mid'?gs(v)>100&&gs(v)<=300:t==='big'?gs(v)>=350:false);
$('[data-f-cat]').innerHTML=Object.entries(MQ.CATS).filter(([k,c])=>!c.soon).map(([k,c])=>opt('cat',k,c.name,live.filter(p=>p.cat===k).length)).join('');
const FR=Object.entries(MQ.FRUITS).map(([k,f])=>[k,f,live.filter(p=>p.fruit===k).length]).filter(x=>x[2]);
$('[data-f-fruit]').innerHTML=FR.filter(x=>x[1].top||st.fruit.has(x[0])).map(([k,f,n])=>opt('fruit',k,f.name,n)).join('')+`<div class="fmore" hidden data-fmore>${FR.filter(x=>!x[1].top&&!st.fruit.has(x[0])).map(([k,f,n])=>opt('fruit',k,f.name,n)).join('')}</div><button type="button" class="fmore__btn" data-fmore-btn>+ Xem thêm ${FR.filter(x=>!x[1].top&&!st.fruit.has(x[0])).length} loại quả</button>`;
$('[data-f-flavour]').innerHTML=Object.entries(MQ.FLAVOURS).map(([k,f])=>[k,f,live.filter(p=>p.flavour===k).length]).filter(x=>x[2]).map(([k,f,n])=>opt('flavour',k,f.name,n)).join('');
$('[data-f-line]').innerHTML=opt('line','mq','<b class="fown">Mộc Quả</b> <small class="muted">mocqua.com</small>',live.filter(p=>p.lines.includes('mq')).length)+`<span class="fsub">Viza Food</span>`+Object.entries(MQ.LINES).filter(([k,l])=>l.maker==='viza').map(([k,l])=>opt('line',k,l.name,live.filter(p=>p.lines.includes(k)).length)).join('');
$('[data-f-tag]').innerHTML=Object.entries(TAGS).map(([k,l])=>opt('tag',k,l,live.filter(p=>hasTag(p,k)).length)).join('');
/* ô danh mục có ảnh (kiểu "tile" dễ bấm) */
const TILES=[
 {k:'all',name:'Tất cả',sub:`${live.length} sản phẩm`,img:'products/dx200',on:()=>!st.cat.size&&!st.flavour.size&&!st.tag.size&&!st.line.size&&!st.onlySoon},
 {k:'line:mq',name:'Mộc Quả',sub:`${live.filter(p=>p.own).length} sản phẩm · túi zip`,img:'products/mqz/mqz-thsr-100c',own:true,on:()=>st.line.size===1&&st.line.has('mq')&&!st.cat.size},
 ...['deo','thanghoa','gion','omai','set'].map(k=>({k:'cat:'+k,name:MQ.CATS[k].short,sub:`${live.filter(p=>p.cat===k).length} sản phẩm`,img:MQ.CATS[k].img.replace('-45.jpg',''),on:()=>st.cat.size===1&&st.cat.has(k)})),
 {k:'flavour:muoiot',name:'Vị muối ớt',sub:'Mặn – cay – ngọt',img:'products/dxmogn',on:()=>st.flavour.size===1&&st.flavour.has('muoiot')}
];
const drawTiles=()=>{$('[data-cattiles]').innerHTML=TILES.map(t=>`<button class="ctile${t.on()?' is-on':''}${t.own?' ctile--own':''}" data-tile="${t.k}"><span class="ctile__img"><img src="${MQ.img(t.img,true)}" alt="" loading="lazy"></span><b>${t.name}</b><small>${t.sub}</small></button>`).join('');
  $('[data-fruitbar]').innerHTML=`<span class="fruitbar__l" id="loai-qua">Loại quả</span>`+Object.entries(MQ.FRUITS).filter(([k])=>live.some(p=>p.fruit===k)).map(([k,f])=>`<button class="fchip${st.fruit.has(k)?' is-on':''}" data-fchip="${k}">${f.name}<em>${live.filter(p=>p.fruit===k).length}</em></button>`).join('');};
const qIn=$('[data-f-q]'),pr=$('[data-f-price]'),sort=$('[data-sort]'),soon=$('[data-f-soon]'),pc=$('[data-f-priced]');
qIn.value=st.q;pr.value=st.max;sort.value=st.sort;soon.checked=st.soon;
const pz=p=>{const m=MQ.minPrice(p);return p.soon?2e9:m==null?1e9:m};
function list(){
  const nq=MQ.norm(st.q.trim());
  let a=all.filter(p=>{
    if(st.onlySoon)return p.soon;
    if(p.soon&&!st.soon)return false;
    if(st.cat.size&&!st.cat.has(p.cat))return false;
    if(st.fruit.size&&!st.fruit.has(p.fruit))return false;
    if(st.flavour.size&&!st.flavour.has(p.flavour))return false;
    if(st.line.size&&!(p.lines||[]).some(l=>st.line.has(l)))return false;
    if(st.tag.size&&![...st.tag].some(t=>hasTag(p,t)))return false;
    if(!p.soon&&st.max<MAXP){const m=MQ.minPrice(p);if(m==null||m>st.max)return false}
    if(st.priced&&!p.soon&&MQ.minPrice(p)==null)return false;
    if(nq&&!MQ.searchText(p).includes(nq))return false;
    return true});
  const S={best:(x,y)=>(x.rank||99)-(y.rank||99),asc:(x,y)=>pz(x)-pz(y),desc:(x,y)=>(y.soon?-1:MQ.minPrice(y)||0)-(x.soon?-1:MQ.minPrice(x)||0),az:(x,y)=>x.name.localeCompare(y.name,'vi')};
  a.sort(S[st.sort]||S.best);
  return a.sort((x,y)=>(x.soon?1:0)-(y.soon?1:0));
}
const NAMES={cat:k=>MQ.CATS[k].name,fruit:k=>MQ.FRUITS[k].name,flavour:k=>MQ.FLAVOURS[k].name,line:k=>MQ.LINES[k].name,tag:k=>TAGS[k]};
const KEYS=['cat','fruit','flavour','line','tag'];
function render(){
  const a=list(),pages=Math.max(1,Math.ceil(a.length/PER));if(st.page>pages)st.page=pages;const shown=a.slice((st.page-1)*PER,st.page*PER);
  const g=$('[data-grid]');g.classList.toggle('is-list',st.view==='list');
  g.innerHTML=shown.map(p=>MQ.card(p)).join('');
  $('[data-empty]').hidden=a.length>0;
  $('[data-count]').innerHTML=`<b>${a.length}</b> sản phẩm · ${a.reduce((s,p)=>s+MQ.vars(p).filter(v=>!st.line.size||st.line.has(v.line)).length,0)} mã SP`;
  const mw=$('[data-more-wrap]');mw.style.display=pages>1?'':'none';
  $('[data-more-text]').textContent=`Hiển thị ${a.length?(st.page-1)*PER+1:0}–${(st.page-1)*PER+shown.length} trên ${a.length} sản phẩm`;
  $('[data-more-bar]').style.width=(a.length?((st.page-1)*PER+shown.length)/a.length*100:0)+'%';
  const nums=[];for(let i=1;i<=pages;i++){if(i===1||i===pages||Math.abs(i-st.page)<=1)nums.push(i);else if(nums[nums.length-1]!=='…')nums.push('…')}
  $('[data-pager]').innerHTML=`<button class="pg pg--nav" data-pg="${st.page-1}"${st.page<=1?' disabled':''} aria-label="Trang trước"><svg><use href="#i-chev"/></svg></button>`+nums.map(n=>n==='…'?'<span class="pg pg--gap">…</span>':`<button class="pg${n===st.page?' is-on':''}" data-pg="${n}"${n===st.page?' aria-current="page"':''}>${n}</button>`).join('')+`<button class="pg pg--nav pg--next" data-pg="${st.page+1}"${st.page>=pages?' disabled':''} aria-label="Trang sau"><svg><use href="#i-chev"/></svg></button>`;
  $('[data-f-price-out]').textContent=st.max>=MAXP?'Tất cả mức giá':'≤ '+MQ.fmt(st.max);
  const chips=KEYS.flatMap(n=>[...st[n]].map(k=>[n,k,NAMES[n](k)]));
  if(st.q)chips.push(['q','', '“'+st.q+'”']);
  if(st.max<MAXP)chips.push(['max','','≤ '+MQ.fmt(st.max)]);
  if(st.onlySoon)chips.push(['soon','','Sắp ra mắt']);
  $('[data-active]').innerHTML=chips.map(([t,k,l])=>`<button class="chip" data-unset="${t}" data-k="${k}">${MQ.esc(l)} <svg><use href="#i-close"/></svg></button>`).join('')+(chips.length?`<button class="chip" data-f-reset style="border:0;text-decoration:underline">Xoá tất cả</button>`:'');
  /* tiêu đề theo bộ lọc */
  const c1=st.cat.size===1?MQ.CATS[[...st.cat][0]]:null;
  $('[data-shop-title]').innerHTML=c1?`${c1.name.replace('Trái cây ','Trái cây <em>')}</em>`:st.onlySoon?'Sắp <em>ra mắt</em>':st.line.size===1&&st.line.has('mq')?'Thương hiệu <em>Mộc Quả</em>':'Trái cây sấy &amp; <em>quà quả Việt</em>';
  if(c1)$('[data-shop-sub]').textContent=c1.desc;else if(st.line.size===1&&st.line.has('mq'))$('[data-shop-sub]').textContent=MQ.MAKERS.mocqua.note;
  const u=new URLSearchParams();KEYS.forEach(n=>{if(st[n].size)u.set(n,[...st[n]].join(','))});if(st.q)u.set('q',st.q);if(st.sort!=='best')u.set('sort',st.sort);if(st.page>1)u.set('page',st.page);if(st.onlySoon)u.set('cat','soon');
  history.replaceState(null,'','cua-hang.html'+(u.toString()?'?'+u:''));
  drawTiles();
  const ownOn=st.line.size===1&&st.line.has('mq');
  $('[data-owncta]').innerHTML=ownOn?'':`<div><small>Thương hiệu riêng · mocqua.com</small><h3>Mộc Quả <em>túi zip đứng</em></h3><p>${live.filter(p=>p.own).length} sản phẩm tuyển chọn: sấy dẻo, thăng hoa, ô mai, set quà — túi zip có cửa sổ nhìn rõ quả, nhãn Mộc Quả xanh rừng ánh vàng.</p><a class="btn btn--gold btn--sm" href="cua-hang.html?line=mq">Xem dòng Mộc Quả <svg><use href="#i-arrow"/></svg></a></div><div class="owncta__imgs">${['mqz-thsr-100c','mqz-dxo-500','mqz-omxd-250'].map(f=>`<img src="${MQ.img('products/mqz/'+f,true)}" alt="" loading="lazy">`).join('')}</div>`;
  MQ.reveal(g);
}
const clearAll=()=>{KEYS.forEach(n=>st[n].clear());st.q='';qIn.value='';st.max=MAXP;pr.value=MAXP;st.soon=false;soon.checked=false;st.onlySoon=false;st.priced=false;pc.checked=false;$$('.filters input[type=checkbox]').forEach(c=>c.checked=false)};
const sync=()=>KEYS.forEach(n=>$$(`[data-${n}]`).forEach(c=>c.checked=st[n].has(c.dataset[n])));
document.addEventListener('change',e=>{const t=e.target;
  for(const n of KEYS)if(t.dataset[n]!==undefined){t.checked?st[n].add(t.dataset[n]):st[n].delete(t.dataset[n]);st.onlySoon=false;st.page=1;render();return}
  if(t===sort){st.sort=t.value;render()} if(t===soon){st.soon=t.checked;st.onlySoon=false;st.page=1;render()} if(t===pc){st.priced=t.checked;st.page=1;render()}});
pr.addEventListener('input',()=>{st.max=+pr.value;st.page=1;render()});
let qt;qIn.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(()=>{st.q=qIn.value;st.page=1;render()},180)});
document.addEventListener('click',e=>{let el;
  if(el=e.target.closest('[data-tile]')){const k=el.dataset.tile;const keepFruit=new Set(st.fruit);clearAll();st.fruit=keepFruit;
    if(k!=='all'){const [n,v]=k.split(':');st[n].add(v)}
    sync();st.page=1;render();return}
  if(el=e.target.closest('[data-fchip]')){const k=el.dataset.fchip;st.fruit.has(k)?st.fruit.delete(k):st.fruit.add(k);sync();st.page=1;render();return}
  if(el=e.target.closest('[data-view]')){st.view=el.dataset.view;$$('[data-view]').forEach(b=>b.classList.toggle('is-on',b===el));render()}
  if(el=e.target.closest('[data-pg]')){if(el.disabled)return;st.page=+el.dataset.pg;render();const top=$('.toolbar')||$('[data-grid]');window.scrollTo({top:top.getBoundingClientRect().top+scrollY-110,behavior:'smooth'});return}
  if(el=e.target.closest('[data-fmore-btn]')){const m=$('[data-fmore]');m.hidden=!m.hidden;el.textContent=m.hidden?el.dataset.l||el.textContent:'− Thu gọn';if(!el.dataset.l)el.dataset.l='+ Xem thêm loại quả';return}
  if(e.target.closest('[data-f-reset]')){clearAll();st.page=1;render()}
  if(el=e.target.closest('[data-unset]')){const t=el.dataset.unset,k=el.dataset.k;if(t==='q'){st.q='';qIn.value=''}else if(t==='max'){st.max=MAXP;pr.value=MAXP}else if(t==='soon'){st.onlySoon=false}else{st[t].delete(k);sync()}render()}
  if(e.target.closest('[data-filters-open]'))document.body.classList.add('filters-open');
  if(e.target.closest('[data-filters-close]')||e.target.closest('.overlay'))document.body.classList.remove('filters-open');
});
$('.filters').insertAdjacentHTML('beforeend','<div class="side__extra">'+MQ.sideHelp()+MQ.sideGift()+MQ.sideNews()+'</div>');
render();MQ.renderRecent();
})();
