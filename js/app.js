/* Mộc Quả — khung giao diện chung, giỏ hàng, yêu thích (DEMO, không có máy chủ) */
(function(){
const MQ=window.MQ;
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
MQ.$=$; MQ.$$=$$;
MQ.fmt=n=>Math.round(n).toLocaleString('vi-VN')+'đ';
MQ.HOTLINE='0909 000 000'; MQ.TEL='0909000000';
MQ.FREE_SHIP=300000;
MQ.norm=s=>(s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
MQ.esc=s=>(s||'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
MQ.byId=id=>MQ.PRODUCTS.find(p=>p.id===id);
MQ.giftById=id=>MQ.GIFTS.find(g=>g.id===id);
MQ.qs=k=>new URLSearchParams(location.search).get(k);
const store={get(k,d){try{return JSON.parse(localStorage.getItem('mq_'+k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem('mq_'+k,JSON.stringify(v))}catch(e){}}};
MQ.store=store;
MQ.stars=(r,size)=>{let h='';for(let i=1;i<=5;i++)h+=`<svg class="${i<=Math.round(r)?'on':''}"><use href="#i-star"/></svg>`;return `<span class="stars"${size?` style="font-size:${size}px"`:''}>${h}</span>`};

/* ---------- icons sprite ---------- */
const SPRITE=`<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-cart" viewBox="0 0 24 24"><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 9V6a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M6.6 3.5h2.6l1.4 4-2 1.3a11 11 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-heart-f" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 10.5L12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-shop" viewBox="0 0 24 24"><path d="M4 9h16l-1 11H5zM4 9l1.5-5h13L20 9M9 13a3 3 0 0 0 6 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-list" viewBox="0 0 24 24"><path d="M4 5h5v5H4zM4 14h5v5H4zM12 7h8M12 16h8" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-up" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-share" viewBox="0 0 24 24"><circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="6" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-leaf" viewBox="0 0 32 32"><path d="M6 26C6 13 14 6 27 5c0 13-7 21-20 21z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6 26C11 19 16 14 22 10" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></symbol>
<symbol id="i-shield" viewBox="0 0 32 32"><path d="M16 4l10 4v7c0 6.5-4.3 11-10 13-5.7-2-10-6.5-10-13V8l10-4z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M11.5 16l3.2 3.2 6-6.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-truck" viewBox="0 0 32 32"><path d="M3 9h16v13H3zM19 13h5.5l4.5 5v4H19" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8.5" cy="23.5" r="2.5" fill="var(--bg,#f6f0e4)" stroke="currentColor" stroke-width="1.3"/><circle cx="23.5" cy="23.5" r="2.5" fill="var(--bg,#f6f0e4)" stroke="currentColor" stroke-width="1.3"/></symbol>
<symbol id="i-gift" viewBox="0 0 32 32"><path d="M5 12h22v5H5zM7 17h18v11H7zM16 12v16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M16 12c-2-5-8-6-8-2.5S13 12 16 12zm0 0c2-5 8-6 8-2.5S19 12 16 12z" fill="none" stroke="currentColor" stroke-width="1.3"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill="currentColor"/></symbol>
<symbol id="i-zalo" viewBox="0 0 48 48"><path d="M24 6C13 6 4 13.4 4 22.6c0 5.3 3 10 7.6 13L10 42l7.2-3.7c2.1.6 4.4.9 6.8.9 11 0 20-7.4 20-16.6S35 6 24 6z" fill="currentColor"/><text x="24" y="27.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="11" fill="var(--zt,#0068ff)">Zalo</text></symbol>
<symbol id="i-msg" viewBox="0 0 48 48"><path d="M24 5C13.2 5 5 12.9 5 23.1c0 5.4 2.3 10 6 13.2V43l6.3-3.5c2.1.6 4.3.9 6.7.9 10.8 0 19-7.9 19-18.1S34.8 5 24 5z" fill="currentColor"/><path d="M12.5 28.5l7-7.4 4 3.7 7-3.7-7 7.4-4-3.7z" fill="#fff"/></symbol>
<symbol id="mark" viewBox="0 0 64 64"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="30"/><circle cx="32" cy="32" r="26.5" stroke-width=".7" stroke-dasharray="1 2.2"/><path d="M32 20.5c-9.6 0-15.5 7.4-15.5 15.6 0 8.6 6.9 14.4 15.5 14.4s15.5-5.8 15.5-14.4c0-8.2-5.9-15.6-15.5-15.6z"/><path d="M32 26.5c-5.6 0-9.2 4.4-9.2 9.4 0 5.1 4.1 8.6 9.2 8.6s9.2-3.5 9.2-8.6c0-5-3.6-9.4-9.2-9.4z" stroke-width="1"/><path d="M32 32c-2.4 0-3.9 1.8-3.9 3.9s1.7 3.6 3.9 3.6 3.9-1.5 3.9-3.6-1.5-3.9-3.9-3.9z" stroke-width=".9"/><path d="M32 20.5c0-4 .8-7 2.6-9.3"/><path d="M33.6 15.2c3.6-4.6 9.6-5.1 13-2.6-2.8 4.2-8.6 5.4-13 2.6z" fill="currentColor" fill-opacity=".18"/></g></symbol>
<symbol id="giftbox" viewBox="0 0 240 200"><ellipse cx="120" cy="186" rx="96" ry="9" fill="#000" opacity=".18"/><path d="M30 78h180v100a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6z" fill="var(--box)"/><path d="M30 78h180v14H30z" fill="#000" opacity=".18"/><path d="M22 56h196a4 4 0 0 1 4 4v20H18V60a4 4 0 0 1 4-4z" fill="var(--box)"/><path d="M18 76h204v4H18z" fill="#000" opacity=".12"/><rect x="108" y="56" width="24" height="128" fill="var(--ribbon)"/><path d="M120 56c-14-22-44-30-46-14-2 13 26 16 46 14zM120 56c14-22 44-30 46-14 2 13-26 16-46 14z" fill="none" stroke="var(--ribbon)" stroke-width="7" stroke-linejoin="round"/><circle cx="120" cy="56" r="8" fill="var(--ribbon)"/><g transform="translate(150 112)"><circle r="20" fill="none" stroke="var(--ribbon)" stroke-width="1.2"/><circle r="16" fill="none" stroke="var(--ribbon)" stroke-width=".6" stroke-dasharray="1 2"/><text y="4" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="11" font-weight="600" fill="var(--ribbon)" letter-spacing="1">MQ</text></g><path d="M44 150h44M44 158h30" stroke="var(--ribbon)" stroke-width="1" opacity=".6"/></symbol>
</svg>`;
MQ.giftSvg=(box,ribbon,cls='')=>`<svg class="giftsvg ${cls}" viewBox="0 0 240 200" style="--box:${box};--ribbon:${ribbon}"><use href="#giftbox"/></svg>`;
MQ.mark=(cls='')=>`<svg class="${cls}"><use href="#mark"/></svg>`;

/* ---------- product helpers ---------- */
MQ.img=(f,sq)=>!f?'assets/img/hero.jpg':f.startsWith('products/')?('assets/'+f+(/\.\w+$/.test(f)?'':(sq?'.jpg':'-45.jpg'))):'assets/img/'+f;
MQ.url=p=>'san-pham.html?id='+p.id;
MQ.lineName=k=>k&&MQ.LINES[k]?MQ.LINES[k].name:'';
MQ.makerName=p=>(MQ.MAKERS[p.maker]||{}).name||'';
MQ.vars=p=>p.variants||p.sizes||[];
MQ.priced=p=>MQ.vars(p).filter(v=>v.p);
MQ.defVar=p=>MQ.priced(p)[0]||MQ.vars(p)[0];
MQ.minPrice=p=>{const a=MQ.priced(p).map(v=>v.p);return a.length?Math.min(...a):null};
MQ.priceLabel=p=>{const m=MQ.minPrice(p);if(m==null)return 'Liên hệ báo giá';return (MQ.priced(p).length>1?'từ ':'')+MQ.fmt(m)};
MQ.varLabel=(p,v)=>{const dup=MQ.vars(p).filter(x=>x.w===v.w).length>1||new Set(MQ.vars(p).map(x=>x.line)).size>1;return v.w+(dup&&v.line?' · '+MQ.lineName(v.line):'')};
MQ.findVar=(p,k)=>MQ.vars(p).find(v=>v.sku===k)||MQ.vars(p).find(v=>v.w===k)||MQ.defVar(p);
MQ.chipLabel=(p,v)=>{const l=MQ.varLabel(p,v),L=MQ.LINES[v.line];return L&&L.short&&l.includes(L.name)?MQ.esc(l.replace(L.name,'%%')).replace('%%',`<span class="l-full">${MQ.esc(L.name)}</span><span class="l-short">${MQ.esc(L.short)}</span>`):MQ.esc(l)};
MQ.zaloQuote=(p,v)=>`https://zalo.me/${MQ.TEL}`;
MQ.chips=(p,sel,cls='wchips')=>`<div class="${cls}" role="group" aria-label="Chọn quy cách">${MQ.vars(p).map(v=>`<button type="button" class="wchip${v===sel?' is-on':''}${v.p?'':' is-quote'}" data-sku="${v.sku}" title="${MQ.esc((v.line?MQ.lineName(v.line)+' · ':'')+(v.p?MQ.fmt(v.p):'Liên hệ báo giá'))}">${MQ.chipLabel(p,v)}</button>`).join('')}</div>`;
MQ.card=(p,opts={})=>{
  const w=MQ.wish.has(p.id);
  if(p.soon){const v=MQ.vars(p)[0];return `<article class="pcard pcard--soon${p.own?' pcard--own':''}" data-id="${p.id}">
    <div class="pcard__media"><span class="badge badge--line">${p.own?'Mộc Quả tuyển chọn':'Sắp ra mắt'}</span><img src="${MQ.img(p.img)}" alt="${MQ.esc(p.name)}" loading="lazy"></div>
    <div class="pcard__body"><span class="pcard__origin">${p.own?'Túi zip · '+v.w:MQ.CATS[p.cat].short}</span><h3 class="pcard__name">${p.name}</h3><p class="pcard__desc">${p.short}</p>
    <div class="pcard__foot"><span class="muted small">Sắp ra mắt</span><button class="btn btn--line btn--sm" data-notify="${p.id}">Báo tôi</button></div></div></article>`}
  const v=MQ.defVar(p), lines=p.lines.map(MQ.lineName).join(' · ');
  return `<article class="pcard${opts.cls?' '+opts.cls:''}" data-id="${p.id}" data-sku="${v.sku}">
    <div class="pcard__media">
      <span class="badge badge--type badge--${p.cat}">${MQ.CATS[p.cat].short}</span>${p.badge?`<span class="badge badge--hot">${p.badge}</span>`:''}
      <a href="${MQ.url(p)}" class="pcard__img" aria-label="${MQ.esc(p.name)}"><img src="${MQ.img(v.img)}" alt="${MQ.esc(p.name)}" loading="lazy" data-card-img></a>
      <div class="pcard__tools"><button class="tool${w?' is-on':''}" data-wish="${p.id}" aria-label="Yêu thích"><svg><use href="#i-heart${w?'-f':''}"/></svg></button><button class="tool" data-quick="${p.id}" aria-label="Xem nhanh"><svg><use href="#i-eye"/></svg></button></div>
    </div>
    <div class="pcard__body">
      <span class="pcard__origin">${lines||MQ.makerName(p)}${p.flavour==='muoiot'?' · <em class="flv">Muối ớt</em>':''}</span>
      <h3 class="pcard__name"><a href="${MQ.url(p)}">${p.name}</a></h3>
      ${MQ.chips(p,v)}
      <div class="pcard__foot">
        <div class="pwrap"><small data-card-w>${MQ.esc(MQ.varLabel(p,v))}</small><span class="price${v.p?'':' price--quote'}" data-card-price>${v.p?MQ.fmt(v.p):'Liên hệ báo giá'}</span></div>
        <button class="addbtn${v.p?'':' is-quote'}" data-add="${p.id}" data-w="${v.sku}" aria-label="Thêm ${MQ.esc(p.name)} vào giỏ"><svg><use href="#i-cart"/></svg><span>${v.p?'Thêm':'Báo giá'}</span></button>
      </div>
    </div></article>`;
};
/* đổi quy cách trên thẻ sản phẩm */
MQ.cardSelect=(card,sku)=>{const p=MQ.byId(card.dataset.id);if(!p)return;const v=MQ.findVar(p,sku);card.dataset.sku=v.sku;
  card.querySelectorAll('.wchip').forEach(b=>b.classList.toggle('is-on',b.dataset.sku===v.sku));
  const im=card.querySelector('[data-card-img]');if(im&&v.img)im.src=MQ.img(v.img);
  card.querySelector('[data-card-w]').textContent=MQ.varLabel(p,v);
  const pr=card.querySelector('[data-card-price]');pr.textContent=v.p?MQ.fmt(v.p):'Liên hệ báo giá';pr.classList.toggle('price--quote',!v.p);
  const ab=card.querySelector('.addbtn');ab.dataset.w=v.sku;ab.classList.toggle('is-quote',!v.p);ab.querySelector('span').textContent=v.p?'Thêm':'Báo giá';};

MQ.searchText=p=>MQ.norm([p.name,MQ.CATS[p.cat].name,MQ.CATS[p.cat].short,p.fruit&&MQ.FRUITS[p.fruit].name,p.flavour&&MQ.FLAVOURS[p.flavour].name,MQ.makerName(p),...(p.lines||[]).map(MQ.lineName),...MQ.vars(p).map(v=>v.sku+' '+v.w),p.short].join(' '));
/* ---------- cart ---------- */
MQ.cart={
  items(){return store.get('cart',[])},
  save(a){store.set('cart',a);MQ.renderCounts();MQ.renderDrawer();document.dispatchEvent(new CustomEvent('mq:cart'))},
  add(item,qty=1){const a=this.items();const ex=a.find(i=>i.key===item.key);if(ex)ex.qty+=qty;else a.push({...item,qty});this.save(a)},
  addProduct(id,w,qty=1,silent){const p=MQ.byId(id)||MQ.giftById(id);if(!p)return;
    let price,img=null,sku='';
    if(p.variants){const v=MQ.findVar(p,w);if(!v.p){MQ.quickView(id,v.sku);return}price=v.p;sku=v.sku;w=MQ.varLabel(p,v);img=v.img||p.img}else{price=p.price;w=p.w}
    this.add({key:id+'|'+(sku||w),id,sku,name:p.name,w,price,img,box:p.box,ribbon:p.ribbon},qty);
    if(!silent){MQ.toast(`Đã thêm <b>${p.name}</b> (${w}) vào giỏ`);MQ.bump();setTimeout(MQ.openCart,300)}},
  setQty(key,q){let a=this.items();const it=a.find(i=>i.key===key);if(!it)return;it.qty=Math.max(0,Math.min(99,q));a=a.filter(i=>i.qty>0);this.save(a)},
  remove(key){this.save(this.items().filter(i=>i.key!==key))},
  clear(){this.save([])},
  count(){return this.items().reduce((s,i)=>s+i.qty,0)},
  subtotal(){return this.items().reduce((s,i)=>s+i.qty*i.price,0)}
};
MQ.SHIP_METHODS=[
  {id:'std',name:'Giao tiêu chuẩn',eta:'2 – 4 ngày',fee:30000,freeOver:true},
  {id:'fast',name:'Hoả tốc nội thành',eta:'trong 2 giờ (TP.HCM, Hà Nội)',fee:55000},
  {id:'gift',name:'Giao quà hẹn giờ',eta:'đúng ngày & khung giờ bạn chọn',fee:40000}
];
MQ.calc=(items,couponCode,shipId='std')=>{
  const sub=items.reduce((s,i)=>s+i.qty*i.price,0);
  const m=MQ.SHIP_METHODS.find(x=>x.id===shipId)||MQ.SHIP_METHODS[0];
  let ship=sub===0?0:m.fee; if(m.freeOver&&sub>=MQ.FREE_SHIP) ship=0;
  let disc=0,cp=null,msg='';
  if(couponCode){const c=MQ.COUPONS[couponCode.toUpperCase()];
    if(!c) msg='Mã không hợp lệ';
    else if(c.min&&sub<c.min) msg=`Đơn tối thiểu ${MQ.fmt(c.min)}`;
    else{cp={code:couponCode.toUpperCase(),...c};
      if(c.type==='pct') disc=Math.min(c.max||1e12,Math.round(sub*c.value/100/1000)*1000);
      if(c.type==='fixed') disc=c.value;
      if(c.type==='ship'){ if(m.id==='std') ship=0; else msg='FREESHIP chỉ áp dụng cho giao tiêu chuẩn'; }
    }}
  const total=Math.max(0,sub-disc+ship);
  return {sub,ship,disc,total,coupon:cp,msg,points:Math.floor(total/10000)};
};

/* ---------- wishlist ---------- */
MQ.wish={
  list(){return store.get('wish',[])},
  has(id){return this.list().includes(id)},
  toggle(id){let a=this.list();const on=!a.includes(id);a=on?[...a,id]:a.filter(x=>x!==id);store.set('wish',a);MQ.renderCounts();
    $$(`[data-wish="${id}"]`).forEach(b=>{b.classList.toggle('is-on',on);const u=b.querySelector('use');if(u)u.setAttribute('href','#i-heart'+(on?'-f':''))});
    const p=MQ.byId(id);MQ.toast(on?`Đã lưu <b>${p?p.name:''}</b> vào danh sách yêu thích`:'Đã bỏ khỏi danh sách yêu thích');
    document.dispatchEvent(new CustomEvent('mq:wish'));return on}
};
/* recently viewed */
MQ.recent={add(id){let a=store.get('recent',[]).filter(x=>x!==id);a.unshift(id);store.set('recent',a.slice(0,8))},list(){return store.get('recent',[])}};
/* orders */
MQ.orders={list(){return store.get('orders',[])},save(o){const a=this.list();a.unshift(o);store.set('orders',a.slice(0,20))},get(code){return this.list().find(o=>o.code===MQ.norm(code).toUpperCase().replace(/\s/g,''))}};

/* ---------- layout ---------- */
const page=document.body.dataset.page||'';
const act=k=>page===k?' class="is-active"':'';
const live=MQ.PRODUCTS.filter(p=>!p.soon);
const cnt=f=>live.filter(f).length;
const CATLINKS=Object.entries(MQ.CATS).filter(([k,c])=>!c.soon).map(([k,c])=>`<a href="cua-hang.html?cat=${k}">${c.name}<small>${cnt(p=>p.cat===k)} sản phẩm</small></a>`).join('')+`<a href="cua-hang.html?cat=soon">Hạt · Trà · Mứt <em class="soon-tag">Sắp có</em></a>`;
const FRUITLINKS=Object.entries(MQ.FRUITS).filter(([k])=>cnt(p=>p.fruit===k)).map(([k,f])=>`<a href="cua-hang.html?fruit=${k}">${f.name}</a>`).join('');
const LINELINKS=Object.entries(MQ.LINES).filter(([k,l])=>!l.soon).map(([k,l])=>`<a href="cua-hang.html?line=${k}">${l.name}</a>`).join('')+`<a href="cua-hang.html?line=mq">Mộc Quả tuyển chọn <em class="soon-tag soon-tag--gold">Sắp ra mắt</em></a>`;
function header(){
  const feat=MQ.byId('sau-rieng-say-thang-hoa');
  return `
<div class="announce"><div class="announce__track">
  <span>Giao hàng toàn quốc</span><i>✦</i><span>Miễn phí giao hàng cho đơn từ ${MQ.fmt(MQ.FREE_SHIP)}</span><i>✦</i><span>Hàng chính hãng Viza Food</span><i>✦</i><span>Nhập <b>MOCQUA10</b> giảm 10% (demo)</span><i>✦</i><span class="announce__demo">Website demo — đặt hàng thử, chưa thanh toán thật</span>
</div></div>
<header class="header">
  <div class="header__inner">
    <button class="burger" aria-label="Mở menu" aria-expanded="false"><span></span><span></span></button>
    <a href="index.html" class="brand" aria-label="Mộc Quả — trang chủ">${MQ.mark('brand__mark')}<span class="brand__text"><b>Mộc Quả</b><small>Quả ngon · Quà trọn</small></span></a>
    <nav class="nav" aria-label="Menu chính">
      <div class="nav__item has-mega"><a href="cua-hang.html"${act('shop')}>Cửa hàng <svg class="chev"><use href="#i-chev"/></svg></a>
        <div class="mega"><div class="mega__inner">
          <div class="mega__col"><h6>Theo cách sấy</h6>${CATLINKS}</div>
          <div class="mega__col"><h6>Theo loại quả</h6><div class="mega__2col">${FRUITLINKS}</div><h6 class="mt">Hương vị</h6><a href="cua-hang.html?flavour=nguyen">Nguyên vị</a><a href="cua-hang.html?flavour=muoiot">Muối ớt</a></div>
          <div class="mega__col"><h6>Dòng sản phẩm</h6>${LINELINKS}<h6 class="mt">Nhanh</h6><a href="cua-hang.html?tag=small">Gói nhỏ 80g</a><a href="cua-hang.html?tag=big">Túi lớn 500g</a><a href="cua-hang.html">Tất cả sản phẩm</a></div>
          <a class="mega__feat" href="${MQ.url(feat)}"><img src="${MQ.img(feat.img)}" alt=""><span><small>Được yêu thích nhất</small>${feat.name}<em>${MQ.priceLabel(feat)}</em></span></a>
        </div></div></div>
      <div class="nav__item has-mega"><a href="hop-qua.html"${act('gift')}>Hộp quà <svg class="chev"><use href="#i-chev"/></svg></a>
        <div class="mega mega--sm"><div class="mega__inner">
          <div class="mega__col"><h6>Quà tặng</h6><a href="hop-qua.html#hop-san">Hộp quà sẵn</a><a href="hop-qua.html#tu-thiet-ke">Tự thiết kế hộp quà <em class="soon-tag soon-tag--gold">Mới</em></a><a href="hop-qua.html#doanh-nghiep">Quà tặng doanh nghiệp</a><a href="hop-qua.html#chon-qua">Gợi ý chọn quà</a></div>
          <a class="mega__feat mega__feat--dark" href="hop-qua.html#tu-thiet-ke">${MQ.giftSvg('#7a2e22','#d8b878')}<span><small>Ý tưởng quà riêng</small>Tự tay chọn từng vị<em>Xem trước hộp &amp; thiệp</em></span></a>
        </div></div></div>
      <div class="nav__item"><a href="cau-chuyen.html"${act('story')}>Câu chuyện</a></div>
      <div class="nav__item"><a href="goc-am-thuc.html"${act('blog')}>Góc ẩm thực</a></div>
      <div class="nav__item"><a href="lien-he.html"${act('contact')}>Liên hệ</a></div>
      <div class="nav__mobile-extra"><a href="tra-cuu-don.html">Tra cứu đơn hàng</a><a href="yeu-thich.html">Danh sách yêu thích</a><a href="tai-khoan.html">Tài khoản</a><a href="chinh-sach.html">Chính sách</a><a href="tel:${MQ.TEL}" class="nav__hotline"><svg><use href="#i-phone"/></svg> Hotline ${MQ.HOTLINE}</a></div>
    </nav>
    <div class="header__actions">
      <a class="hotline" href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg><span><small>Hotline đặt hàng</small>${MQ.HOTLINE}</span></a>
      <button class="hbtn" data-search-open aria-label="Tìm kiếm"><svg><use href="#i-search"/></svg></button>
      <a class="hbtn hbtn--hide-m" href="tai-khoan.html" aria-label="Tài khoản"><svg><use href="#i-user"/></svg></a>
      <a class="hbtn hbtn--hide-m" href="yeu-thich.html" aria-label="Yêu thích"><svg><use href="#i-heart"/></svg><span class="hcount" data-wish-count>0</span></a>
      <button class="cart-btn" data-cart-open aria-label="Giỏ hàng"><svg><use href="#i-cart"/></svg><span class="cart-count" data-cart-count>0</span></button>
    </div>
  </div>
</header>
<div class="search" aria-hidden="true"><div class="search__panel">
  <form class="search__form" action="cua-hang.html"><svg><use href="#i-search"/></svg><input name="q" type="search" placeholder="Tìm xoài sấy dẻo, sầu riêng, mã SP…" autocomplete="off" aria-label="Tìm kiếm"><button type="button" class="icon-btn" data-search-close aria-label="Đóng"><svg><use href="#i-close"/></svg></button></form>
  <div class="search__body"><div class="search__hint"><small>Tìm nhiều</small><div class="chips"><a class="chip" href="cua-hang.html?fruit=xoai">Xoài sấy</a><a class="chip" href="cua-hang.html?fruit=saurieng">Sầu riêng thăng hoa</a><a class="chip" href="cua-hang.html?flavour=muoiot">Vị muối ớt</a><a class="chip" href="cua-hang.html?cat=gion">Mít sấy giòn</a><a class="chip" href="hop-qua.html">Hộp quà Tết</a></div></div><div class="search__results" data-search-results></div></div>
</div></div>`;
}
function footer(){
  return `
<section class="newsletter"><div class="container newsletter__inner">
  <div><p class="eyebrow"><span class="line"></span>Thư mùa quả</p><h3>Nhận tin mùa vụ mới &amp; <em>ưu đãi riêng cho hội viên</em></h3></div>
  <form class="newsletter__form" data-demo-form="Cảm ơn bạn đã đăng ký nhận Thư mùa quả! (demo)"><input type="email" required placeholder="Email của bạn" aria-label="Email"><button class="btn btn--gold" type="submit">Đăng ký</button><small>Tặng mã <b>MOCQUA10</b> cho đơn đầu tiên (demo).</small></form>
</div></section>
<footer class="footer">
  <div class="container footer__grid">
    <div class="footer__brand"><a href="index.html" class="brand brand--light">${MQ.mark('brand__mark')}<span class="brand__text"><b>Mộc Quả</b><small>Quả ngon · Quà trọn</small></span></a>
      <p>Quả của đất, quà của tình. Mộc Quả tuyển chọn trái cây sấy chính hãng từ nhà sản xuất uy tín Viza Food — cho bữa ăn vặt mỗi ngày và những món quà trọn vẹn.</p>
      <div class="footer__pay"><span>COD</span><span>VietQR</span><span>Ví điện tử</span><span>Thẻ ATM/Visa</span></div></div>
    <div><h5>Cửa hàng</h5><a href="cua-hang.html?cat=deo">Trái cây sấy dẻo</a><a href="cua-hang.html?cat=thanghoa">Trái cây sấy thăng hoa</a><a href="cua-hang.html?cat=gion">Trái cây sấy giòn</a><a href="hop-qua.html">Hộp quà Tết</a><a href="hop-qua.html#tu-thiet-ke">Tự thiết kế hộp quà</a></div>
    <div><h5>Hỗ trợ</h5><a href="chinh-sach.html#huong-dan">Hướng dẫn mua hàng</a><a href="chinh-sach.html#thanh-toan">Hình thức thanh toán</a><a href="chinh-sach.html#giao-hang">Giao hàng &amp; vận chuyển</a><a href="chinh-sach.html#doi-tra">Đổi trả &amp; hoàn tiền</a><a href="chinh-sach.html#bao-mat">Bảo mật thông tin</a><a href="tra-cuu-don.html">Tra cứu đơn hàng</a></div>
    <div><h5>Liên hệ</h5><a href="tel:${MQ.TEL}">Hotline: ${MQ.HOTLINE}</a><a href="mailto:hello@mocqua.com">hello@mocqua.com</a><a href="lien-he.html">[Địa chỉ showroom đang cập nhật]</a><span>8:00 – 21:00, tất cả các ngày</span><div class="footer__social"><a href="https://zalo.me/${MQ.TEL}" target="_blank" rel="noopener" aria-label="Zalo"><svg><use href="#i-zalo"/></svg></a><a href="https://m.me/" target="_blank" rel="noopener" aria-label="Messenger"><svg><use href="#i-msg"/></svg></a></div></div>
  </div>
  <div class="container footer__bottom"><span>© 2026 Mộc Quả · mocqua.com</span><span>Website demo giao diện — đánh giá, thông tin liên hệ là dữ liệu mẫu; giá bán lẻ tham khảo</span></div>
  <div class="footer__word" aria-hidden="true">Mộc Quả</div>
</footer>
<div class="float">
  <a href="https://zalo.me/${MQ.TEL}" target="_blank" rel="noopener" class="float__btn float__btn--zalo" aria-label="Chat Zalo"><svg><use href="#i-zalo"/></svg></a>
  <a href="https://m.me/" target="_blank" rel="noopener" class="float__btn float__btn--msg" aria-label="Messenger"><svg><use href="#i-msg"/></svg></a>
  <a href="tel:${MQ.TEL}" class="float__btn float__btn--phone" aria-label="Gọi hotline"><svg><use href="#i-phone"/></svg></a>
  <button class="float__btn float__btn--top" data-top aria-label="Lên đầu trang"><svg><use href="#i-up"/></svg></button>
</div>
<nav class="bottombar" aria-label="Thanh điều hướng nhanh">
  <a href="index.html"${act('home')}><svg><use href="#i-home"/></svg>Trang chủ</a>
  <a href="cua-hang.html"${act('shop')}><svg><use href="#i-shop"/></svg>Cửa hàng</a>
  <button data-cart-open class="bottombar__cart"><span><svg><use href="#i-cart"/></svg><i data-cart-count>0</i></span>Giỏ hàng</button>
  <a href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg>Gọi</a>
  <a href="https://zalo.me/${MQ.TEL}" target="_blank" rel="noopener" class="bottombar__zalo"><svg><use href="#i-zalo"/></svg>Zalo</a>
</nav>
<div class="overlay" data-close-all></div>
<aside class="drawer" aria-label="Giỏ hàng" aria-hidden="true">
  <header class="drawer__head"><h3>Giỏ hàng <span data-count-text></span></h3><button class="icon-btn" data-close-all aria-label="Đóng"><svg><use href="#i-close"/></svg></button></header>
  <div class="drawer__ship"><p data-ship-text></p><div class="bar"><i data-ship-bar></i></div></div>
  <ul class="drawer__items" data-items></ul>
  <div class="drawer__empty">${MQ.mark()}<p>Giỏ hàng đang trống.</p><a href="cua-hang.html" class="btn btn--line">Khám phá cửa hàng</a></div>
  <footer class="drawer__foot">
    <div class="drawer__row"><span>Tạm tính</span><b data-subtotal>0đ</b></div>
    <p class="drawer__note">Phí giao hàng &amp; mã giảm giá được tính ở bước thanh toán.</p>
    <div class="drawer__btns"><a href="gio-hang.html" class="btn btn--line">Xem giỏ hàng</a><a href="thanh-toan.html" class="btn btn--gold">Thanh toán</a></div>
    <p class="drawer__demo">Website demo · Chưa phát sinh thanh toán thật</p>
  </footer>
</aside>
<dialog class="qv" id="qv"><button class="icon-btn qv__close" data-qv-close aria-label="Đóng"><svg><use href="#i-close"/></svg></button><div class="qv__body"></div></dialog>
<div class="toast" role="status" aria-live="polite"></div>`;
}
document.body.insertAdjacentHTML('afterbegin',SPRITE+header());
document.body.insertAdjacentHTML('beforeend',footer());

/* ---------- renderers ---------- */
MQ.renderCounts=()=>{const c=MQ.cart.count();$$('[data-cart-count]').forEach(e=>e.textContent=c);const w=MQ.wish.list().length;$$('[data-wish-count]').forEach(e=>{e.textContent=w;e.style.display=w?'':'none'})};
MQ.thumb=i=>i.img?`<img class="ci__img" src="${MQ.img(i.img,true)}" alt="">`:`<div class="ci__img ci__img--gift">${MQ.giftSvg(i.box||'#2b4a3d',i.ribbon||'#c9a868')}</div>`;
MQ.renderDrawer=()=>{
  const items=MQ.cart.items(), sub=MQ.cart.subtotal(), count=MQ.cart.count(), d=$('.drawer');
  $('[data-count-text]').textContent=count?`(${count})`:'';
  $('[data-items]').innerHTML=items.map(i=>`<li class="ci">${MQ.thumb(i)}<div><h4>${MQ.esc(i.name)}</h4><small>${MQ.esc(i.w)}${i.meta?' · '+MQ.esc(i.meta):''}</small><div class="qty qty--sm"><button data-dec="${i.key}" aria-label="Giảm">−</button><span>${i.qty}</span><button data-inc="${i.key}" aria-label="Tăng">+</button></div></div><div class="ci__r"><b>${MQ.fmt(i.price*i.qty)}</b><button class="ci__rm" data-rm="${i.key}">Xoá</button></div></li>`).join('');
  $('[data-subtotal]').textContent=MQ.fmt(sub);
  $('[data-ship-text]').innerHTML=sub>=MQ.FREE_SHIP?'Tuyệt vời! Đơn hàng được <b>miễn phí giao hàng</b> tiêu chuẩn.':`Mua thêm <b>${MQ.fmt(MQ.FREE_SHIP-sub)}</b> để được miễn phí giao hàng.`;
  $('[data-ship-bar]').style.width=Math.min(100,sub/MQ.FREE_SHIP*100)+'%';
  d.classList.toggle('is-empty',count===0);
};
MQ.openCart=()=>{if(page==='cart'||page==='checkout')return;document.body.classList.add('cart-open');$('.drawer').setAttribute('aria-hidden','false')};
MQ.closeAll=()=>{document.body.classList.remove('cart-open','nav-open','search-open');$('.drawer').setAttribute('aria-hidden','true');$('.burger').setAttribute('aria-expanded','false')};
MQ.bump=()=>$$('[data-cart-count]').forEach(c=>{c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')});
let tt;MQ.toast=html=>{const t=$('.toast');t.innerHTML=html;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2800)};

/* quick view */
MQ.quoteBox=(p,v)=>`<div class="qbox"><p><b>Liên hệ báo giá</b> — quy cách này đang cập nhật giá. Nhắn Mộc Quả để nhận báo giá &amp; tồn kho trong 5 phút (8:00–21:00).</p><div class="qbox__btns"><a class="btn btn--gold btn--sm" href="${MQ.zaloQuote(p,v)}" target="_blank" rel="noopener"><svg><use href="#i-zalo"/></svg>Chat Zalo</a><a class="btn btn--line btn--sm" href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg>${MQ.HOTLINE}</a></div><small>Mã SP: ${v.sku}</small></div>`;
MQ.quickView=(id,sku)=>{const p=MQ.byId(id);if(!p||p.soon)return;const dlg=$('#qv');const v=MQ.findVar(p,sku);
  $('.qv__body',dlg).innerHTML=`<div class="qv__img"><img src="${MQ.img(v.img)}" alt="${MQ.esc(p.name)}" data-qv-img></div><div class="qv__info"><span class="pcard__origin">${MQ.CATS[p.cat].short} · ${MQ.FLAVOURS[p.flavour].name}</span><h3>${p.name}</h3><p>${p.short}</p>
  ${MQ.chips(p,v,'wchips wchips--lg')}
  <dl class="qv__spec"><dt>Mã SP</dt><dd data-qv-sku>${v.sku}</dd><dt>Dòng sản phẩm</dt><dd data-qv-line>${MQ.lineName(v.line)||'Đang cập nhật'}</dd><dt>Nhà sản xuất</dt><dd>${MQ.makerName(p)}</dd></dl>
  <div data-qv-buy></div></div>`;
  dlg.dataset.id=p.id;MQ.qvRender(p,v);
  if(!dlg.open)dlg.showModal();
};
MQ.qvRender=(p,v)=>{const dlg=$('#qv');dlg.dataset.sku=v.sku;
  $$('.wchip',dlg).forEach(b=>b.classList.toggle('is-on',b.dataset.sku===v.sku));
  if(v.img)$('[data-qv-img]',dlg).src=MQ.img(v.img);$('[data-qv-sku]',dlg).textContent=v.sku;$('[data-qv-line]',dlg).textContent=MQ.lineName(v.line)||'Đang cập nhật';
  $('[data-qv-buy]',dlg).innerHTML=v.p?`<div class="qv__price"><small>Giá bán lẻ · ${MQ.esc(v.w)}</small><b>${MQ.fmt(v.p)}</b></div><div class="qv__actions"><button class="btn btn--gold" data-qv-add="${p.id}">Thêm vào giỏ</button><a class="btn btn--line" href="${MQ.url(p)}">Xem chi tiết</a></div>`:MQ.quoteBox(p,v)+`<a class="link" href="${MQ.url(p)}">Xem chi tiết sản phẩm →</a>`;
};

/* ---------- global events ---------- */
document.addEventListener('click',e=>{
  const t=e.target;
  let el;
  if(el=t.closest('[data-add]')){e.preventDefault();const pp=MQ.byId(el.dataset.add);if(pp&&pp.variants&&!MQ.findVar(pp,el.dataset.w).p){MQ.quickView(pp.id,el.dataset.w);return}MQ.cart.addProduct(el.dataset.add,el.dataset.w);const b=el.closest('.addbtn')||el;b.classList.add('added');setTimeout(()=>b.classList.remove('added'),900);return}
  if(el=t.closest('[data-wish]')){e.preventDefault();MQ.wish.toggle(el.dataset.wish);return}
  if(el=t.closest('[data-quick]')){e.preventDefault();MQ.quickView(el.dataset.quick);return}
  if(el=t.closest('[data-notify]')){e.preventDefault();const n=store.get('notify',[]);if(!n.includes(el.dataset.notify))n.push(el.dataset.notify);store.set('notify',n);el.textContent='Đã đăng ký';el.disabled=true;MQ.toast('Mộc Quả sẽ báo bạn khi sản phẩm ra mắt (demo)');return}
  if(el=t.closest('[data-inc],[data-dec],[data-rm]')){const k=el.dataset.inc||el.dataset.dec||el.dataset.rm;const it=MQ.cart.items().find(i=>i.key===k);if(!it)return;
    if(el.dataset.rm!==undefined&&el.hasAttribute('data-rm'))MQ.cart.remove(k);else MQ.cart.setQty(k,it.qty+(el.hasAttribute('data-inc')?1:-1));return}
  if(t.closest('[data-cart-open]')){e.preventDefault();if(page==='cart'){location.href='gio-hang.html';return}MQ.openCart();return}
  if(t.closest('[data-close-all]')){MQ.closeAll();return}
  if(t.closest('[data-search-open]')){document.body.classList.add('search-open');setTimeout(()=>$('.search input').focus(),60);return}
  if(t.closest('[data-search-close]')||t.classList.contains('search')){document.body.classList.remove('search-open');return}
  if(t.closest('[data-top]')){scrollTo({top:0,behavior:'smooth'});return}
  if(t.closest('[data-qv-close]')||t.id==='qv'){$('#qv').close();return}
  if(el=t.closest('#qv .wchip')){const p=MQ.byId($('#qv').dataset.id);MQ.qvRender(p,MQ.findVar(p,el.dataset.sku));return}
  if(el=t.closest('.pcard .wchip')){e.preventDefault();MQ.cardSelect(el.closest('.pcard'),el.dataset.sku);return}
  if(el=t.closest('[data-qv-add]')){const w=$('#qv').dataset.sku;$('#qv').close();MQ.cart.addProduct(el.dataset.qvAdd,w);return}
  if(el=t.closest('.nav__item.has-mega>a')){ if(matchMedia('(max-width:980px)').matches){e.preventDefault();el.parentElement.classList.toggle('is-open')} }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')MQ.closeAll()});
$('.burger').addEventListener('click',()=>{const o=document.body.classList.toggle('nav-open');$('.burger').setAttribute('aria-expanded',o)});
/* search live */
const sIn=$('.search input'), sRes=$('[data-search-results]');
sIn.addEventListener('input',()=>{const q=MQ.norm(sIn.value.trim());if(!q){sRes.innerHTML='';return}
  const ps=MQ.PRODUCTS.filter(p=>MQ.searchText(p).includes(q)).slice(0,6);
  const gs=MQ.GIFTS.filter(g=>MQ.norm(g.name+' hop qua tet').includes(q)).slice(0,3);
  const as=MQ.POSTS.filter(a=>MQ.norm(a.title).includes(q)).slice(0,2);
  sRes.innerHTML=(ps.length||gs.length||as.length)?`
   ${ps.length?`<small>Sản phẩm</small>${ps.map(p=>`<a class="sr" href="${MQ.url(p)}"><img src="${MQ.img(p.img,true)}" alt=""><span><b>${p.name}</b><em>${MQ.CATS[p.cat].short}${p.soon?' · Sắp ra mắt':' · '+MQ.priceLabel(p)}</em></span></a>`).join('')}`:''}
   ${gs.length?`<small>Hộp quà</small>${gs.map(g=>`<a class="sr" href="hop-qua.html#${g.id}"><span class="sr__gift">${MQ.giftSvg(g.box,g.ribbon)}</span><span><b>${g.name}</b><em>${MQ.fmt(g.price)}</em></span></a>`).join('')}`:''}
   ${as.length?`<small>Bài viết</small>${as.map(a=>`<a class="sr" href="bai-viet.html?slug=${a.slug}"><img src="${MQ.img(a.img,true)}" alt=""><span><b>${a.title}</b><em>${a.cat}</em></span></a>`).join('')}`:''}
   <a class="sr__all" href="cua-hang.html?q=${encodeURIComponent(sIn.value.trim())}">Xem tất cả kết quả cho “${MQ.esc(sIn.value.trim())}” →</a>`
   :`<p class="muted">Không tìm thấy kết quả cho “${MQ.esc(sIn.value)}”. Thử “xoài”, “sầu riêng”, “muối ớt”…</p>`;
});
/* demo forms */
$$('[data-demo-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();if(!f.checkValidity()){f.reportValidity();return}MQ.toast(f.dataset.demoForm||'Đã gửi (demo)');f.reset()}));
/* header scroll state */
const hdr=$('.header');
const onS=()=>{hdr.classList.toggle('is-scrolled',scrollY>40);document.body.classList.toggle('scrolled',scrollY>500)};
addEventListener('scroll',onS,{passive:true});onS();
/* marquee duplicate for mobile */
const tr=$('.announce__track');tr.insertAdjacentHTML('beforeend','<span class="dup"><i>✦</i>'+tr.innerHTML+'</span>');
/* reveal */
MQ.reveal=(root=document)=>{const els=$$('.reveal:not(.in)',root);
  if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.08,rootMargin:'0px 0px -30px 0px'});
  els.forEach((el,i)=>{el.style.transitionDelay=(i%4)*60+'ms';io.observe(el)});};
MQ.renderCounts();MQ.renderDrawer();
document.documentElement.classList.remove('no-js');
addEventListener('DOMContentLoaded',()=>MQ.reveal());
if(document.readyState!=='loading')setTimeout(()=>MQ.reveal(),0);
})();
