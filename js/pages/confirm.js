(function(){
const MQ=window.MQ,{$}=MQ;
const code=MQ.qs('code'),o=code&&(MQ.orders.list().find(x=>x.code===code)||(code==='MQ-DEMO-2026'?MQ.DEMO_ORDER:null));
const el=$('[data-confirm]');
if(!o){el.innerHTML=`<div class="confirm__seal"><svg><use href="#mark"/></svg></div><h1>Không tìm thấy đơn hàng</h1><p>Liên kết có thể đã hết hạn. Bạn có thể tra cứu đơn bằng mã và số điện thoại.</p><div class="confirm__actions"><a class="btn btn--dark" href="tra-cuu-don.html">Tra cứu đơn</a><a class="btn btn--line" href="cua-hang.html">Về cửa hàng</a></div>`;return}
const c=o.customer;
el.innerHTML=`<div class="confirm__seal"><svg><use href="#i-check"/></svg></div>
<p class="eyebrow" style="justify-content:center"><span class="line"></span>Cảm ơn ${MQ.esc(c.name)}<span class="line"></span></p>
<h1>Đặt hàng <em>thành công</em></h1>
<p>Mộc Quả đã nhận đơn của bạn${c.email?' và gửi xác nhận tới '+MQ.esc(c.email):''}. Đây là đơn hàng demo — không có giao dịch thật.</p>
<div class="code"><span>Mã đơn hàng</span><b data-code>${o.code}</b><button class="btn btn--line btn--sm" data-copy>Sao chép</button></div>
${o.pay==='bank'?`<p class="notice" style="max-width:620px;margin:0 auto">Vui lòng chuyển khoản <b>${MQ.fmt(o.sum.total)}</b> với nội dung <b>${o.code}</b> (thông tin tài khoản đang cập nhật — demo).</p>`:''}
<div class="confirm__box">
 <div><h4>Giao đến</h4><p>${o.gift?`<b>${MQ.esc(o.gift.name||'Người nhận')}</b> · ${MQ.esc(o.gift.phone||'')}<br>`:`<b>${MQ.esc(c.name)}</b> · ${MQ.esc(c.phone)}<br>`}${MQ.esc(c.addr)}, ${MQ.esc(c.ward)}, ${MQ.esc(c.prov)}</p>
  <h4 style="margin-top:20px">Giao hàng &amp; thanh toán</h4><p>${o.ship.name} — dự kiến ${o.ship.date||o.ship.eta}<br>${MQ.payName[o.pay]}</p>${o.gift?`<p style="margin-top:10px">🎁 Gửi tặng${o.gift.hide?' · ẩn giá':''}${o.gift.card?` · Thiệp: “${MQ.esc(o.gift.card)}”`:''}</p>`:''}</div>
 <div><h4>Sản phẩm</h4><ul>${o.items.map(i=>`<li class="mini"><div class="mini__q">${MQ.thumb(i)}<i>${i.qty}</i></div><div><h5>${MQ.esc(i.name)}</h5><small>${MQ.esc(i.w)}</small></div><b>${MQ.fmt(i.price*i.qty)}</b></li>`).join('')}${(o.gifts||[]).map(g=>`<li class="mini mini--gift"><div class="mini__q">${MQ.thumb(g)}<i>${g.qty}</i></div><div><h5>${MQ.esc(g.name)} <span class="ci__tag">Quà tặng</span></h5><small>${MQ.esc(g.w)}</small></div><b>0đ</b></li>`).join('')}</ul>
  <div class="srow"><span>Tạm tính</span><b>${MQ.fmt(o.sum.sub)}</b></div><div class="srow"><span>Phí giao hàng</span><b>${o.sum.ship?MQ.fmt(o.sum.ship):'Miễn phí'}</b></div>${o.sum.rows?o.sum.rows.map(x=>`<div class="srow srow--disc"><span>${MQ.esc(x.label)}</span><b>−${MQ.fmt(x.v)}</b></div>`).join(''):(o.sum.disc?`<div class="srow srow--disc"><span>Giảm giá ${o.sum.coupon}</span><b>−${MQ.fmt(o.sum.disc)}</b></div>`:'')}<div class="srow srow--total"><span>Tổng cộng</span><b>${MQ.fmt(o.sum.total)}</b></div>
  <div class="points"><svg><use href="#i-gift"/></svg><span>+${o.points} Hạt Mộc đã được cộng vào <a href="tai-khoan.html" style="text-decoration:underline">tài khoản</a> (demo).</span></div></div>
</div>
<div class="confirm__actions"><a class="btn btn--dark" href="tra-cuu-don.html?code=${encodeURIComponent(o.code)}&phone=${encodeURIComponent(c.phone)}">Theo dõi đơn hàng</a><a class="btn btn--line" href="cua-hang.html">Tiếp tục mua sắm</a></div>`;
$('[data-copy]').addEventListener('click',()=>{navigator.clipboard?.writeText(o.code).then(()=>MQ.toast('Đã sao chép mã đơn'),()=>{})});
})();
