(function(){
const MQ=window.MQ,{$,$$}=MQ;
const f=$('[data-co]');
if(!MQ.cart.items().length){f.hidden=true;$('[data-empty]').hidden=false;return}
$('[data-prov]').innerHTML='<option value="">— Chọn tỉnh/thành —</option>'+MQ.provOptions();
$('[data-ships]').innerHTML=MQ.SHIP_METHODS.map((m,i)=>`<label class="radio-card${i?'':' is-on'}"><input type="radio" name="ship" value="${m.id}"${i?'':' checked'}><div><b>${m.name}</b><small>${m.eta}${m.freeOver?' · miễn phí cho đơn từ '+MQ.fmt(MQ.FREE_SHIP):''} · <span data-eta-${m.id}></span></small></div><span class="fee" data-fee-${m.id}>${MQ.fmt(m.fee)}</span></label>`).join('');
const cIn=$('[data-coupon]');cIn.value=MQ.store.get('coupon','')||'';f.note.value=MQ.store.get('note','');
/* QR placeholder */
(function(){let s='';const n=25,c=8;let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
 const fin=(x,y)=>`<rect x="${x}" y="${y}" width="7" height="7" fill="#0f2a22"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3" fill="#0f2a22"/>`;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){if((x<8&&y<8)||(x>16&&y<8)||(x<8&&y>16))continue;if(rnd()>.52)s+=`<rect x="${x}" y="${y}" width="1" height="1" fill="#0f2a22"/>`}
 $('[data-qr]').innerHTML=`<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">${s}${fin(0,0)}${fin(18,0)}${fin(0,18)}<rect x="10" y="10" width="5" height="5" fill="#b08d57"/></svg>`})();
const val=()=>{const fd=new FormData(f);return Object.fromEntries(fd.entries())};
function draw(){const v=val(),items=MQ.cart.items(),r=MQ.calc(items,cIn.value.trim(),v.ship);
  $('[data-cnt]').textContent=`(${MQ.cart.count()} sản phẩm)`;
  $('[data-mini]').innerHTML=items.map(i=>`<div class="mini"><div class="mini__q">${MQ.thumb(i)}<i>${i.qty}</i></div><div><h5>${MQ.esc(i.name)}</h5><small>${MQ.esc(i.w)}${i.meta?' · '+MQ.esc(i.meta):''}</small></div><b>${MQ.fmt(i.price*i.qty)}</b></div>`).join('');
  $('[data-sub]').textContent=MQ.fmt(r.sub);$('[data-ship]').textContent=r.ship?MQ.fmt(r.ship):'Miễn phí';
  MQ.SHIP_METHODS.forEach(m=>{const fee=MQ.calc(items,'',m.id).ship;$(`[data-fee-${m.id}]`).textContent=fee?MQ.fmt(fee):'Miễn phí';$(`[data-eta-${m.id}]`).textContent=v.prov?'dự kiến '+MQ.eta(v.prov,m.id):'chọn tỉnh để xem ngày giao'});
  const m=$('[data-cmsg]');if(cIn.value.trim()){if(r.coupon&&!r.msg){m.className='coupon-msg ok';m.textContent='Đã áp dụng: '+r.coupon.desc}else{m.className='coupon-msg err';m.textContent=r.msg||'Mã không hợp lệ'}}else m.textContent='';
  $('[data-disc-row]').hidden=!r.disc;$('[data-disc]').textContent='−'+MQ.fmt(r.disc);$('[data-ccode]').textContent=r.coupon?r.coupon.code:'';
  $('[data-total]').textContent=MQ.fmt(r.total);$('[data-pts]').textContent=r.points;
  $('[data-memo]').textContent='MQ '+(v.phone||'SĐT')+' '+MQ.fmt(r.total).replace(/\./g,'');
  $$('.radio-card').forEach(c=>c.classList.toggle('is-on',c.querySelector('input').checked));
  $('[data-giftopts]').classList.toggle('is-on',!!v.isgift);$('[data-sched]').hidden=v.ship!=='gift';$('[data-vatbox]').hidden=!v.vat;
  MQ.store.set('coupon',r.coupon&&!r.msg?r.coupon.code:'');return r;
}
f.addEventListener('change',draw);f.addEventListener('input',e=>{if(e.target.name==='phone')draw()});
$('[data-apply]').addEventListener('click',draw);cIn.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();draw()}});
document.addEventListener('click',e=>{const t=e.target.closest('[data-try]');if(t){cIn.value=t.dataset.try;draw()}});
const dt=f.date;const d=new Date();d.setDate(d.getDate()+2);dt.min=d.toISOString().slice(0,10);dt.value=dt.min;
f.addEventListener('submit',e=>{e.preventDefault();
  $$('.is-invalid',f).forEach(x=>x.classList.remove('is-invalid'));
  const bad=[...f.querySelectorAll('input,select,textarea')].filter(x=>!x.checkValidity());
  if(bad.length){bad.forEach(x=>x.classList.add('is-invalid'));bad[0].focus();bad[0].scrollIntoView({block:'center',behavior:'smooth'});MQ.toast('Vui lòng kiểm tra lại thông tin bắt buộc');return}
  const v=val(),r=draw(),now=new Date();
  const code='MQ'+String(now.getFullYear()).slice(2)+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  const m=MQ.SHIP_METHODS.find(x=>x.id===v.ship);
  const o={code,created:now.toISOString(),items:MQ.cart.items(),customer:{name:v.name,phone:v.phone,email:v.email,prov:v.prov,ward:v.ward,addr:v.addr},gift:v.isgift?{name:v.rname,phone:v.rphone,card:v.card,hide:!!v.hideprice}:null,
    ship:{id:m.id,name:m.name,eta:MQ.eta(v.prov,m.id),date:v.ship==='gift'?v.date+' · '+v.slot:''},pay:v.pay,note:v.note,vat:v.vat?{company:v.company,tax:v.tax}:null,sum:{sub:r.sub,ship:r.ship,disc:r.disc,total:r.total,coupon:r.coupon?r.coupon.code:''},points:r.points,status:v.pay==='cod'?1:0};
  MQ.orders.save(o);MQ.store.set('points',(MQ.store.get('points',0)||0)+r.points);
  MQ.store.set('coupon','');MQ.store.set('note','');MQ.cart.clear();
  location.href='dat-hang-thanh-cong.html?code='+encodeURIComponent(code);
});
draw();
})();
