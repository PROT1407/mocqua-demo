/* Mộc Quả — các khối giao diện dùng chung (demo) */
(function(){
const MQ=window.MQ,{$,$$}=MQ;
MQ.giftCard=(g,i)=>{const tag=g.tag||(['Thăm hỏi','Đoàn viên','Biếu Tết','Đối tác VIP'][i]||'Quà tặng');
  return `<article class="gift${g.tag?' gift--feature':''} reveal" id="${g.id}">${g.tag?`<span class="gift__ribbon">${g.tag}</span>`:''}
  <div class="gift__art">${MQ.giftSvg(g.box,g.ribbon)}</div><span class="gift__tag">${g.slots} món${g.tag?'':' · '+tag}</span><h3>${g.name}</h3><p>${g.desc}</p>
  <div class="gift__items">${g.items.map(id=>{const p=MQ.byId(id);return p?`<img src="${MQ.img(p.img,true)}" alt="${MQ.esc(p.name)}" title="${MQ.esc(p.name)}" loading="lazy">`:''}).join('')}</div>
  <div class="gift__foot"><span class="price"><small>Giá bán</small>${MQ.fmt(g.price)}</span><button class="btn btn--gold" data-add="${g.id}">Thêm vào giỏ</button></div></article>`};
MQ.reviewCard=r=>`<figure class="review reveal">${MQ.stars(r.rating)}<blockquote>${r.text}</blockquote><figcaption><b>${r.name}</b><span>${r.city} · ${r.product} · nhận xét mẫu</span></figcaption></figure>`;
MQ.postCard=(a,feature)=>`<a class="post${feature?' post--feature':''} reveal" href="bai-viet.html?slug=${a.slug}"><div class="post__img"><img src="${MQ.img(a.img,true)}" alt="" loading="lazy"></div><div><small>${a.cat} · ${a.date} · ${a.read} đọc</small><h3>${a.title}</h3><p>${a.excerpt}</p></div></a>`;
MQ.calendar=()=>{const now=new Date().getMonth()+1;
  const rows=MQ.SEASONS.map(s=>`<tr><td><a href="cua-hang.html?q=${encodeURIComponent(s.name.split(' (')[0])}">${s.name}</a></td>${Array.from({length:12},(_,i)=>{const m=i+1,on=s.m.includes(m);return `<td${m===now?' class="now"':''}><i class="${on?(m===now?'peak':'on'):''}"></i></td>`}).join('')}</tr>`).join('');
  return `<table><thead><tr><th>Loại quả</th>${Array.from({length:12},(_,i)=>`<th${i+1===now?' class="now"':''}>T${i+1}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`};
MQ.inSeason=()=>{const now=new Date().getMonth()+1;return MQ.SEASONS.filter(s=>s.m.includes(now)).map(s=>s.name)};
MQ.renderRecent=(exclude)=>{const w=$('[data-recent-wrap]'),el=$('[data-recent]');if(!w||!el)return;
  const ps=MQ.recent.list().filter(id=>id!==exclude).map(MQ.byId).filter(p=>p&&!p.soon);
  if(!ps.length){w.hidden=true;return}w.hidden=false;el.innerHTML=ps.map(p=>MQ.card(p)).join('')};
/* delivery estimate by province */
MQ.eta=(prov,method='std')=>{const near=['TP. Hồ Chí Minh','Đồng Nai','Tây Ninh','Vĩnh Long','Đồng Tháp','An Giang','Cần Thơ','Cà Mau','Lâm Đồng','Khánh Hòa'];
  const hn=['Hà Nội','Hải Phòng','Bắc Ninh','Hưng Yên','Ninh Bình','Quảng Ninh','Phú Thọ','Thái Nguyên'];
  let d=prov==='TP. Hồ Chí Minh'?1:near.includes(prov)?2:hn.includes(prov)||['Đà Nẵng','Huế'].includes(prov)?3:4;
  if(method==='fast'&&(prov==='TP. Hồ Chí Minh'||prov==='Hà Nội'))d=0;
  const t=new Date();t.setDate(t.getDate()+d);if(t.getDay()===0)t.setDate(t.getDate()+1);
  const s=t.toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'});return d===0?'Trong 2 giờ hôm nay':s};
MQ.provOptions=(sel)=>MQ.PROVINCES.map(p=>`<option${p===sel?' selected':''}>${p}</option>`).join('');
})();
/* order status (mô phỏng) */
(function(){const MQ=window.MQ;
MQ.STATUS=['Đã đặt hàng','Đã xác nhận','Đang đóng gói','Đang giao hàng','Giao thành công'];
MQ.DEMO_ORDER={code:'MQ-DEMO-2026',demo:true,created:new Date(Date.now()-26*3600e3).toISOString(),items:[{key:'hop-phu-quy|6 món',id:'hop-phu-quy',name:'Hộp Phú Quý',w:'6 món',price:1090000,qty:1,img:null,box:'#7a2e22',ribbon:'#d8b878'},{key:'sau-rieng-say-kita|MQ-GSR-100-KT',id:'sau-rieng-say-kita',sku:'MQ-GSR-100-KT',name:'Sầu riêng sấy KITA',w:'100g',price:90000,qty:2,img:'products/tsr100k'}],customer:{name:'Khách hàng mẫu',phone:'0909000000',prov:'Hà Nội',ward:'Phường Hoàn Kiếm',addr:'[Địa chỉ mẫu]'},ship:{name:'Giao tiêu chuẩn',eta:'trong 1–2 ngày tới'},pay:'bank',sum:{sub:1270000,ship:0,disc:0,total:1270000,points:127},points:151,fixed:3};
MQ.orderStep=o=>{if(o.fixed!=null)return o.fixed;const min=(Date.now()-new Date(o.created))/60000;return Math.min(4,Math.max(o.status||0,min<2?0:min<10?1:min<60?2:min<1440?3:4))};
MQ.findOrder=(code,phone)=>{const c=(code||'').trim().toUpperCase().replace(/\s/g,'');const ph=(phone||'').replace(/\D/g,'');
  const o=c==='MQ-DEMO-2026'?MQ.DEMO_ORDER:MQ.orders.list().find(x=>x.code===c);if(!o)return null;if(ph&&o.customer.phone.replace(/\D/g,'')!==ph)return 'phone';return o};
MQ.payName={cod:'Thanh toán khi nhận hàng (COD)',bank:'Chuyển khoản · VietQR',wallet:'Ví điện tử'};
MQ.timeline=o=>{const s=MQ.orderStep(o),t=new Date(o.created);
  return `<div class="timeline"><div class="timeline__bar" style="width:${s/4*80}%"></div>${MQ.STATUS.map((x,i)=>`<div class="tl${i<s?' done':i===s?' now':''}"><i>${i<s?'✓':i+1}</i><div><b>${x}</b>${i<=s?new Date(t.getTime()+[0,2,10,60,1440][i]*60000).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}):'—'}</div></div>`).join('')}</div>`};
})();
