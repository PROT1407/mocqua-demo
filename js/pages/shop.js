(function(){
const MQ=window.MQ,{$,$$}=MQ,q=MQ.qs;
const TAGS={nosugar:'Không thêm đường',sale:'Đang ưu đãi',new:'Mới về',gift:'Hợp làm quà'};
const st={cat:new Set(q('cat')?[q('cat')]:[]),region:new Set(q('region')?[q('region')]:[]),tag:new Set(q('tag')?[q('tag')]:[]),q:q('q')||'',max:700000,soon:false,sort:q('sort')||'best',view:'grid',page:1};
if(st.cat.size&&MQ.CATS[[...st.cat][0]]?.soon)st.soon=true;
const PER=9;
const opt=(name,k,label,n)=>`<label class="fopt"><input type="checkbox" data-${name}="${k}"${st[name].has(k)?' checked':''}><span>${label}</span><em>${n}</em></label>`;
const all=MQ.PRODUCTS;
$('[data-f-cat]').innerHTML=Object.entries(MQ.CATS).map(([k,c])=>opt('cat',k,c.name+(c.soon?' <em class="soon-tag">Sắp có</em>':''),all.filter(p=>p.cat===k).length)).join('');
$('[data-f-region]').innerHTML=Object.entries(MQ.REGIONS).map(([k,r])=>opt('region',k,r.name,all.filter(p=>p.region===k&&!p.soon).length)).join('');
const hasTag=(p,t)=>t==='nosugar'?!!p.noSugar||p.cat==='tra':t==='sale'?p.sizes.some(s=>s.old):t==='new'?!!p.isNew:t==='gift'?(p.cat==='mix'||['hong-treo-gio','long-nhan','set-tra-cam-que'].includes(p.id)):false;
$('[data-f-tag]').innerHTML=Object.entries(TAGS).map(([k,l])=>opt('tag',k,l,all.filter(p=>!p.soon&&hasTag(p,k)).length)).join('');
const qIn=$('[data-f-q]'),pr=$('[data-f-price]'),sort=$('[data-sort]'),soon=$('[data-f-soon]');
qIn.value=st.q;pr.value=st.max;sort.value=st.sort;soon.checked=st.soon;
function list(){
  const nq=MQ.norm(st.q.trim());
  let a=all.filter(p=>{
    if(p.soon&&!st.soon&&!(st.cat.size&&[...st.cat].every(c=>MQ.CATS[c].soon)))return false;
    if(st.cat.size&&!st.cat.has(p.cat))return false;
    if(st.region.size&&!st.region.has(p.region))return false;
    if(st.tag.size&&![...st.tag].every(t=>hasTag(p,t)))return false;
    if(!p.soon&&p.sizes[0].p>st.max)return false;
    if(nq&&!MQ.norm(p.name+' '+p.origin+' '+MQ.CATS[p.cat].name+' '+MQ.REGIONS[p.region].name+' '+p.short).includes(nq))return false;
    return true});
  const pz=p=>p.soon?1e9:p.sizes[0].p;
  const S={best:(x,y)=>(y.sold||0)-(x.sold||0),new:(x,y)=>(y.isNew?1:0)-(x.isNew?1:0)||(y.sold||0)-(x.sold||0),rating:(x,y)=>(y.rating||0)-(x.rating||0),asc:(x,y)=>pz(x)-pz(y),desc:(x,y)=>(y.soon?-1:pz(y))-(x.soon?-1:pz(x)),az:(x,y)=>x.name.localeCompare(y.name,'vi')};
  a.sort(S[st.sort]||S.best);
  return a.sort((x,y)=>(x.soon?1:0)-(y.soon?1:0));
}
function render(){
  const a=list(),shown=a.slice(0,st.page*PER);
  const g=$('[data-grid]');g.classList.toggle('is-list',st.view==='list');
  g.innerHTML=shown.map(p=>MQ.card(p)).join('');
  $('[data-empty]').hidden=a.length>0;
  $('[data-count]').innerHTML=`Hiển thị <b>${shown.length}</b> / ${a.length} sản phẩm`;
  const mw=$('[data-more-wrap]');mw.hidden=a.length<=PER&&true;mw.style.display=a.length?'':'none';
  $('[data-more-text]').textContent=`Bạn đã xem ${shown.length} trên ${a.length} sản phẩm`;
  $('[data-more-bar]').style.width=(a.length?shown.length/a.length*100:0)+'%';
  $('[data-more]').hidden=shown.length>=a.length;
  $('[data-f-price-out]').textContent='≤ '+MQ.fmt(st.max);
  const chips=[...[...st.cat].map(k=>['cat',k,MQ.CATS[k].name]),...[...st.region].map(k=>['region',k,MQ.REGIONS[k].name]),...[...st.tag].map(k=>['tag',k,TAGS[k]])];
  if(st.q)chips.push(['q','', '“'+st.q+'”']);
  if(st.max<700000)chips.push(['max','','≤ '+MQ.fmt(st.max)]);
  $('[data-active]').innerHTML=chips.map(([t,k,l])=>`<button class="chip" data-unset="${t}" data-k="${k}">${MQ.esc(l)} <svg><use href="#i-close"/></svg></button>`).join('')+(chips.length?`<button class="chip" data-f-reset style="border:0;text-decoration:underline">Xoá tất cả</button>`:'');
  const u=new URLSearchParams();if(st.cat.size===1)u.set('cat',[...st.cat][0]);if(st.region.size===1)u.set('region',[...st.region][0]);if(st.tag.size===1)u.set('tag',[...st.tag][0]);if(st.q)u.set('q',st.q);if(st.sort!=='best')u.set('sort',st.sort);
  history.replaceState(null,'','cua-hang.html'+(u.toString()?'?'+u:''));
  MQ.reveal(g);
}
document.addEventListener('change',e=>{const t=e.target;
  for(const n of ['cat','region','tag'])if(t.dataset[n]!==undefined){t.checked?st[n].add(t.dataset[n]):st[n].delete(t.dataset[n]);st.page=1;render();return}
  if(t===sort){st.sort=t.value;render()} if(t===soon){st.soon=t.checked;st.page=1;render()}});
pr.addEventListener('input',()=>{st.max=+pr.value;st.page=1;render()});
let qt;qIn.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(()=>{st.q=qIn.value;st.page=1;render()},180)});
document.addEventListener('click',e=>{let el;
  if(el=e.target.closest('[data-view]')){st.view=el.dataset.view;$$('[data-view]').forEach(b=>b.classList.toggle('is-on',b===el));render()}
  if(e.target.closest('[data-more]')){st.page++;render()}
  if(e.target.closest('[data-f-reset]')){['cat','region','tag'].forEach(n=>st[n].clear());st.q='';qIn.value='';st.max=700000;pr.value=700000;st.soon=false;soon.checked=false;$$('.filters input[type=checkbox]').forEach(c=>c.checked=false);st.page=1;render()}
  if(el=e.target.closest('[data-unset]')){const t=el.dataset.unset,k=el.dataset.k;if(t==='q'){st.q='';qIn.value=''}else if(t==='max'){st.max=700000;pr.value=700000}else{st[t].delete(k);const c=$(`[data-${t}="${k}"]`);if(c)c.checked=false}render()}
  if(e.target.closest('[data-filters-open]'))document.body.classList.add('filters-open');
  if(e.target.closest('[data-filters-close]')||e.target.closest('.overlay'))document.body.classList.remove('filters-open');
});
render();MQ.renderRecent();
})();
