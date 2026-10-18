(function(){
const MQ=window.MQ,{$}=MQ;const f=$('[data-track]');
function show(code,phone){const o=MQ.findOrder(code,phone),el=$('[data-tracked]');
  if(!o){el.innerHTML=`<div class="tracked"><h3 style="font-size:28px;color:var(--ink)">Không tìm thấy đơn “${MQ.esc(code)}”</h3><p class="muted">Kiểm tra lại mã đơn. Trong bản demo, chỉ tra cứu được đơn đặt trên trình duyệt này hoặc mã mẫu MQ-DEMO-2026.</p></div>`;return}
  if(o==='phone'){el.innerHTML=`<div class="tracked"><h3 style="font-size:28px;color:var(--ink)">Số điện thoại không khớp</h3><p class="muted">Vui lòng nhập đúng số điện thoại đã dùng khi đặt hàng.</p></div>`;return}
  const s=MQ.orderStep(o);
  el.innerHTML=`<div class="tracked"><div class="tracked__head"><div><span class="pcard__origin">${o.demo?'Đơn mẫu':'Đơn hàng'} · ${new Date(o.created).toLocaleString('vi-VN')}</span><h3>${o.code}</h3></div><span class="status">${MQ.STATUS[s]}</span></div>
  ${MQ.timeline(o)}
  <div class="confirm__box" style="margin-top:0;border:0;padding:0;background:none"><div><h4>Giao đến</h4><p>${MQ.esc(o.customer.name)} · ${MQ.esc(o.customer.prov)}<br>${o.ship.name} — dự kiến ${o.ship.date||o.ship.eta}<br>${MQ.payName[o.pay]}</p></div>
  <div><h4>${o.items.reduce((a,i)=>a+i.qty,0)} sản phẩm · ${MQ.fmt(o.sum.total)}</h4><p>${o.items.map(i=>MQ.esc(i.name)+' ×'+i.qty).join('<br>')}${(o.gifts||[]).map(g=>'<br>🎁 '+MQ.esc(g.name)+' ×'+g.qty+' (quà tặng)').join('')}</p></div></div>
  <p class="small muted" style="margin-top:16px">Trạng thái được mô phỏng cho bản demo. Cần hỗ trợ? Gọi <a href="tel:${MQ.TEL}" style="text-decoration:underline">${MQ.HOTLINE}</a>.</p></div>`;
  el.scrollIntoView({behavior:'smooth',block:'start'})}
f.addEventListener('submit',e=>{e.preventDefault();show(f.code.value,f.phone.value)});
const c=MQ.qs('code');if(c){f.code.value=c;f.phone.value=MQ.qs('phone')||'';show(c,f.phone.value)}
const os=MQ.orders.list();
$('[data-olist]').innerHTML=os.length?`<h3>Đơn hàng trên thiết bị này</h3>${os.map(o=>`<div class="orow"><div><b>${o.code}</b><br><small class="muted">${new Date(o.created).toLocaleDateString('vi-VN')} · ${o.items.length} sản phẩm</small></div><span>${MQ.fmt(o.sum.total)}</span><span class="status">${MQ.STATUS[MQ.orderStep(o)]}</span><button class="btn btn--line btn--sm" data-see="${o.code}" data-ph="${o.customer.phone}">Xem</button></div>`).join('')}`:'';
document.addEventListener('click',e=>{const b=e.target.closest('[data-see]');if(b){f.code.value=b.dataset.see;f.phone.value=b.dataset.ph;show(b.dataset.see,b.dataset.ph)}});
})();
