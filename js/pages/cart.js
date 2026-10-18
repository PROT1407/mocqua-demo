(function(){
const MQ=window.MQ,{$,$$}=MQ;
const cIn=$('[data-coupon]');cIn.value=MQ.store.get('coupon','')||'';$('[data-note]').value=MQ.store.get('note','');
$('[data-note]').addEventListener('input',e=>MQ.store.set('note',e.target.value));
function draw(){const items=MQ.cart.items(),r=MQ.calc(items,cIn.value.trim());
  const empty=!items.length;$('[data-cartpage]').hidden=empty;$('[data-empty]').hidden=!empty;$('[data-cnum]').textContent=empty?'':`(${MQ.cart.count()})`;
  $('[data-rows]').innerHTML=items.map(i=>`<tr><td><div class="cprod">${MQ.thumb(i)}<div><h4>${i.id&&MQ.byId(i.id)?`<a href="san-pham.html?id=${i.id}">${MQ.esc(i.name)}</a>`:MQ.esc(i.name)}</h4><small>${MQ.esc(i.w)}${i.meta?' · '+MQ.esc(i.meta):''}</small><br><button class="rm" data-rm="${i.key}">Xoá</button></div></div></td><td class="r unit" style="text-align:left;font-size:18px">${MQ.fmt(i.price)}</td><td><div class="qty qty--sm"><button data-dec="${i.key}" aria-label="Giảm">−</button><span>${i.qty}</span><button data-inc="${i.key}" aria-label="Tăng">+</button></div></td><td class="r">${MQ.fmt(i.price*i.qty)}</td></tr>`).join('')+r.gifts.map(g=>`<tr class="giftrow"><td><div class="cprod">${MQ.thumb(g)}<div><h4>${MQ.esc(g.name)} <span class="ci__tag">Quà tặng</span></h4><small>${MQ.esc(g.w)}</small>${g.pick?`<label class="giftpick__l">Đổi quà: ${MQ.giftPickSel()}</label>`:''}</div></div></td><td class="r unit" style="text-align:left;font-size:18px">0đ</td><td style="text-align:center">× ${g.qty}</td><td class="r">0đ</td></tr>`).join('');
  $('[data-sub]').textContent=MQ.fmt(r.sub);
  const pg=MQ.progress(r.promo);$('[data-ship-t]').innerHTML=pg.text;$('[data-ship-b]').style.width=Math.min(100,pg.pct)+'%';
  const m=$('[data-cmsg]');
  if(cIn.value.trim()){if(r.coupon&&!r.msg){m.className='coupon-msg ok';m.textContent=`Đã áp dụng ${r.coupon.code}: ${r.coupon.desc}`;MQ.store.set('coupon',r.coupon.code)}else{m.className='coupon-msg err';m.textContent=r.msg||'Mã không hợp lệ'}}else{m.textContent='';MQ.store.set('coupon','')}
  $('[data-drows]').innerHTML=MQ.discRowsHtml(r);const pn=$('[data-pnote]');pn.hidden=!r.note;pn.textContent=r.note;
  $('[data-total]').textContent=MQ.fmt(r.sub-r.disc);$('[data-pts]').textContent=Math.floor((r.sub-r.disc)/10000);
}
$('[data-apply]').addEventListener('click',draw);cIn.addEventListener('keydown',e=>{if(e.key==='Enter')draw()});
document.addEventListener('click',e=>{const t=e.target.closest('[data-try]');if(t){cIn.value=t.dataset.try;draw()}if(e.target.closest('[data-clear]')&&confirm('Xoá toàn bộ giỏ hàng?'))MQ.cart.clear()});
document.addEventListener('mq:cart',draw);
document.addEventListener('change',e=>{if(e.target.matches('[data-giftpick]')){MQ.store.set('giftpick',e.target.value);draw();MQ.renderDrawer()}});
const inCart=new Set(MQ.cart.items().map(i=>i.id));
$('[data-upsell]').innerHTML=MQ.PRODUCTS.filter(p=>!p.soon&&!inCart.has(p.id)).sort((a,b)=>b.sold-a.sold).slice(0,8).map(p=>MQ.card(p)).join('');
draw();
})();
