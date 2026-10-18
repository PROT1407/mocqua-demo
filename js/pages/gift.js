(function(){
const MQ=window.MQ,{$,$$}=MQ;
$('[data-gifts]').innerHTML=MQ.GIFTS.map(MQ.giftCard).join('');
/* builder */
const O=MQ.BOX_OPTIONS,picks=MQ.PRODUCTS.filter(p=>!p.soon&&['deo','gion','tra'].includes(p.cat));
const unit=p=>Math.round(p.sizes[0].p*0.62/1000)*1000;
const st=Object.assign({size:1,color:'son',ribbon:true,items:[],msg:'',to:'',from:''},MQ.store.get('builder',{}));
const save=()=>MQ.store.set('builder',st);
$('[data-b-sizes]').innerHTML=O.sizes.map((s,i)=>`<button class="opt" data-sz="${i}"><b>${s.name}</b><small>Vỏ hộp ${MQ.fmt(s.fee)}</small></button>`).join('');
$('[data-b-colors]').innerHTML=O.colors.map(c=>`<button class="swatch" data-col="${c.id}" style="--sw:${c.box};--rib:${c.ribbon}"><i></i>${c.name}</button>`).join('');
$('[data-b-picks]').innerHTML=picks.map(p=>`<button class="bpick" data-pk="${p.id}"><img src="${MQ.img(p.img)}" alt="" loading="lazy"><span><b>${p.name}</b><small>${MQ.fmt(unit(p))} / ngăn</small></span><em></em></button>`).join('');
const msg=$('[data-b-msg]'),to=$('[data-b-to]'),fr=$('[data-b-from]');msg.value=st.msg;to.value=st.to;fr.value=st.from;$('[data-b-ribbon]').checked=st.ribbon;
function draw(){
  const sz=O.sizes[st.size],col=O.colors.find(c=>c.id===st.color)||O.colors[0];
  st.items=st.items.slice(0,sz.slots);
  $$('[data-sz]').forEach(b=>b.classList.toggle('is-on',+b.dataset.sz===st.size));
  $$('[data-col]').forEach(b=>b.classList.toggle('is-on',b.dataset.col===col.id));
  $('[data-b-size-l]').textContent=sz.name;$('[data-b-color-l]').textContent=col.name;$('[data-b-fill-l]').textContent=`${st.items.length}/${sz.slots} ngăn`;
  const box=$('[data-b-box]');box.style.setProperty('--box',col.box);box.style.setProperty('--rib',col.ribbon);box.classList.toggle('no-ribbon',!st.ribbon);
  const sl=$('[data-b-slots]');sl.className='slots s'+sz.slots;
  sl.innerHTML=Array.from({length:sz.slots},(_,i)=>{const p=MQ.byId(st.items[i]);return `<div class="slot">${p?`<img src="${MQ.img(p.img)}" alt="${MQ.esc(p.name)}" title="${MQ.esc(p.name)}"><button data-unslot="${i}" aria-label="Bỏ ${MQ.esc(p.name)}"><svg><use href="#i-close"/></svg></button>`:`Ngăn ${i+1}`}</div>`}).join('');
  const cnt={};st.items.forEach(id=>cnt[id]=(cnt[id]||0)+1);
  $$('[data-pk]').forEach(b=>{const n=cnt[b.dataset.pk]||0;b.classList.toggle('has',n>0);b.querySelector('em').textContent=n?'×'+n:''});
  $('[data-b-card]').innerHTML=`<small>${st.to?'Gửi '+MQ.esc(st.to):'Thiệp Mộc Quả'}</small>${st.msg?MQ.esc(st.msg):'<span style="opacity:.45">Lời chúc của bạn sẽ hiện ở đây…</span>'}${st.from?`<span class="sign">— ${MQ.esc(st.from)}</span>`:''}`;
  const itemsTotal=st.items.reduce((s,id)=>s+unit(MQ.byId(id)),0);
  $('[data-b-sz]').textContent=sz.name.toLowerCase();$('[data-b-fee]').textContent=MQ.fmt(sz.fee);$('[data-b-n]').textContent=st.items.length+' ngăn';$('[data-b-items]').textContent=MQ.fmt(itemsTotal);
  $('[data-b-total]').textContent=MQ.fmt(sz.fee+itemsTotal);
  const full=st.items.length===sz.slots;$('[data-b-add]').disabled=!full;
  $('[data-b-hint]').textContent=full?'Hộp đã đầy — sẵn sàng thêm vào giỏ.':`Còn ${sz.slots-st.items.length} ngăn trống. Hãy chọn thêm vị để hoàn thiện hộp.`;
  save();
}
document.addEventListener('click',e=>{let el;
  if(el=e.target.closest('[data-sz]')){st.size=+el.dataset.sz;draw()}
  else if(el=e.target.closest('[data-col]')){st.color=el.dataset.col;draw()}
  else if(el=e.target.closest('[data-pk]')){const sz=O.sizes[st.size];if(st.items.length>=sz.slots){MQ.toast('Hộp đã đầy — bỏ bớt một ngăn hoặc chọn hộp lớn hơn');return}st.items.push(el.dataset.pk);draw()}
  else if(el=e.target.closest('[data-unslot]')){st.items.splice(+el.dataset.unslot,1);draw()}
  else if(e.target.closest('[data-b-clear]')){st.items=[];draw()}
  else if(e.target.closest('[data-b-auto]')){const n=O.sizes[st.size].slots,pool=[...picks].sort((a,b)=>b.sold-a.sold);st.items=Array.from({length:n},(_,i)=>pool[i%pool.length].id);draw()}
  else if(el=e.target.closest('[data-b-wishes] .chip')){st.msg=el.textContent;msg.value=st.msg;draw()}
  else if(e.target.closest('[data-b-add]')){const sz=O.sizes[st.size],col=O.colors.find(c=>c.id===st.color);
    const names=st.items.map(id=>MQ.byId(id).name.split(' ').slice(0,2).join(' '));
    MQ.cart.add({key:'custom|'+Date.now(),id:'custom-box',name:'Hộp quà tự thiết kế',w:sz.name,meta:col.name+' · '+[...new Set(names)].join(', ')+(st.msg?' · có thiệp':''),price:sz.fee+st.items.reduce((s,id)=>s+unit(MQ.byId(id)),0),img:null,box:col.box,ribbon:col.ribbon,card:st.msg,cardTo:st.to,cardFrom:st.from},1);
    MQ.toast('Đã thêm <b>Hộp quà tự thiết kế</b> vào giỏ');MQ.bump();setTimeout(MQ.openCart,300)}
});
$('[data-b-ribbon]').addEventListener('change',e=>{st.ribbon=e.target.checked;draw()});
[[msg,'msg'],[to,'to'],[fr,'from']].forEach(([el,k])=>el.addEventListener('input',()=>{st[k]=el.value;draw()}));
draw();
/* quiz */
$('[data-quiz]').addEventListener('submit',e=>{e.preventDefault();const f=e.target,who=f.who.value,b=+f.budget.value,t=f.taste.value;
  let g=MQ.GIFTS.filter(x=>x.price<=b);if(!g.length)g=[MQ.GIFTS[0]];
  g.sort((x,y)=>(y.for.includes(who)?2:0)-(x.for.includes(who)?2:0)||y.price-x.price);
  const best=g[0];const tasteP=MQ.PRODUCTS.filter(p=>!p.soon&&p.taste&&(t==='gion'?p.taste.gion>=4:t==='chua'?p.taste.chua>=3:p.taste.ngot>=4)).slice(0,3);
  $('[data-quiz-result]').innerHTML=`<div class="bundle"><div><p class="eyebrow" style="margin-bottom:8px"><span class="line"></span>Gợi ý dành cho bạn</p><h3 style="font-size:38px;color:var(--ink)">${best.name} · ${MQ.fmt(best.price)}</h3><p class="muted" style="margin:8px 0 16px">${best.desc}</p><p class="small">Hợp khẩu vị của người nhận: ${tasteP.map(p=>`<a href="${MQ.url(p)}" style="text-decoration:underline">${p.name}</a>`).join(', ')} — bạn có thể <a href="#tu-thiet-ke" style="color:var(--gold);text-decoration:underline">tự thiết kế hộp</a> với các vị này.</p></div><div style="display:flex;flex-direction:column;gap:10px;align-items:center;min-width:220px">${MQ.giftSvg(best.box,best.ribbon)}<button class="btn btn--gold" data-add="${best.id}">Thêm vào giỏ</button></div></div>`;
  $('[data-quiz-result] .giftsvg').style.width='180px';
});
MQ.reveal();
})();
