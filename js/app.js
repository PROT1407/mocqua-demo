/* Mộc Quả — khung giao diện chung, giỏ hàng, yêu thích (DEMO, không có máy chủ) */
(function(){
const MQ=window.MQ;
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
MQ.$=$; MQ.$$=$$;
MQ.fmt=n=>Math.round(n).toLocaleString('vi-VN')+'đ';
MQ.PHONES=[{tel:'0931330248',show:'0931 330 248'},{tel:'0919997283',show:'0919 997 283'}];
MQ.TEL=MQ.PHONES[0].tel; MQ.HOTLINE=MQ.PHONES[0].show;
MQ.TEL2=MQ.PHONES[1].tel; MQ.HOTLINE2=MQ.PHONES[1].show;
MQ.EMAIL='huydaigia1407@gmail.com';
MQ.ADDRESS='376/15 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh';
MQ.MAPS='https://www.google.com/maps/search/?api=1&query=376%2F15+Nguyen+Dinh+Chieu+Quan+3+Ho+Chi+Minh';
MQ.FACEBOOK='https://www.facebook.com/share/19WBGeTezN/?mibextid=wwXIfr';
MQ.TIKTOK='https://www.tiktok.com/@mocqua79';
MQ.BANK={name:'Techcombank',bin:'970407',accountNo:'19029781376018',accountName:'Nguyen Ngoc Huy',accountNameQr:'NGUYEN NGOC HUY'};
MQ.vietqrUrl=(amount,info)=>{const p=new URLSearchParams();p.set('amount',String(Math.max(0,Math.round(Number(amount)||0))));p.set('addInfo',String(info||'Moc Qua'));p.set('accountName',MQ.BANK.accountNameQr);return `https://img.vietqr.io/image/${MQ.BANK.bin}-${MQ.BANK.accountNo}-compact2.png?${p}`};
MQ.FREE_SHIP=300000;
MQ.norm=s=>(s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
MQ.esc=s=>(s||'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
MQ.byId=id=>MQ.PRODUCTS.find(p=>p.id===id)||(MQ.ID_ALIAS&&MQ.ID_ALIAS[id]?MQ.PRODUCTS.find(p=>p.id===MQ.ID_ALIAS[id]):undefined);
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
MQ.IMGV='20261018t';
MQ.img=(f,sq)=>!f?'assets/img/hero.jpg':f.startsWith('products/')?('assets/'+f+(/\.\w+$/.test(f)?'':(sq?'.jpg':'-45.jpg'))+'?v='+MQ.IMGV):'assets/img/'+f;
MQ.url=p=>'san-pham.html?id='+p.id;
/* phân nhóm danh mục: cách sấy -> loại quả -> thương hiệu -> khối lượng */
MQ.PROC=['deo','thanghoa','gion','kho'];
MQ.BRAND_ORDER=['mq','fh','goodgood','cheers','yummy','kita','vizabox'];
MQ.brandOf=p=>p.own?'mq':((p.lines||[])[0]||'zz');
MQ.minG=p=>Math.min(...MQ.vars(p).map(v=>v.g||9999));
MQ.procTag=p=>MQ.PROC.includes(p.cat)?`<span class="ptag ptag--${p.cat}">${MQ.CATS[p.cat].short}</span>`:'';
MQ.GROUP_NAMES={'gion:saurieng':'Sầu riêng sấy'};
MQ.fruitProc=(f,c)=>MQ.GROUP_NAMES[c+':'+f]||MQ.FRUITS[f].name+' '+MQ.CATS[c].short.toLowerCase();
MQ.lineName=k=>k&&MQ.LINES[k]?MQ.LINES[k].name:'';
MQ.makerName=p=>(MQ.MAKERS[p.maker]||{}).name||'';
MQ.vars=p=>p.variants||p.sizes||[];
MQ.priced=p=>MQ.vars(p).filter(v=>v.p);
MQ.defVar=p=>(p.def&&MQ.vars(p).find(v=>v.sku===p.def))||MQ.priced(p)[0]||MQ.vars(p)[0];
/* sản phẩm có mẫu bao bì: mỗi khối lượng 1 nút (biến thể đại diện) */
MQ.sizeVars=(p,sel)=>{const vs=MQ.vars(p);if(!p.packs)return vs;const ws=[...new Set(vs.map(v=>v.w))];return ws.map(w=>sel&&sel.w===w?sel:vs.find(v=>v.w===w&&sel&&v.pk===sel.pk)||vs.find(v=>v.w===w&&v.sku===p.def)||vs.find(v=>v.w===w))};
MQ.per100=v=>v.p&&v.g?MQ.fmt(Math.round(v.p/v.g*100/100)*100)+'/100g':'';
MQ.minPrice=p=>{const a=MQ.priced(p).map(v=>v.p);return a.length?Math.min(...a):null};
MQ.priceLabel=p=>{const m=MQ.minPrice(p);if(m==null)return 'Liên hệ báo giá';return (MQ.priced(p).length>1?'từ ':'')+MQ.fmt(m)};
MQ.varLabel=(p,v)=>{if(p.packs&&v.pk)return v.w+' · bao bì '+p.packs[v.pk].name.toLowerCase();const dup=MQ.vars(p).filter(x=>x.w===v.w).length>1||new Set(MQ.vars(p).map(x=>x.line)).size>1;return v.w+(dup&&v.line?' · '+MQ.lineName(v.line):'')};
MQ.findVar=(p,k)=>{k=(MQ.SKU_ALIAS||{})[k]||k;return MQ._fv(p,k)};
MQ._fv=(p,k)=>MQ.vars(p).find(v=>v.sku===k)||MQ.vars(p).find(v=>v.w===k)||MQ.defVar(p);
MQ.chipLabel=(p,v)=>{if(p.packs)return MQ.esc(v.w);const l=MQ.varLabel(p,v),L=MQ.LINES[v.line];return L&&L.short&&l.includes(L.name)?MQ.esc(l.replace(L.name,'%%')).replace('%%',`<span class="l-full">${MQ.esc(L.name)}</span><span class="l-short">${MQ.esc(L.short)}</span>`):MQ.esc(l)};
MQ.zaloQuote=(p,v)=>`https://zalo.me/${MQ.TEL}`;
MQ.chips=(p,sel,cls='wchips')=>`<div class="${cls}" role="group" aria-label="Chọn quy cách">${MQ.sizeVars(p,sel).map(v=>`<button type="button" class="wchip${v.w===sel.w?' is-on':''}${v.p?'':' is-quote'}" data-sku="${v.sku}" title="${MQ.esc((v.line?MQ.lineName(v.line)+' · ':'')+(v.p?MQ.fmt(v.p):'Liên hệ báo giá'))}">${MQ.chipLabel(p,v)}</button>`).join('')}</div>`;
MQ.dealTag=(p,cls='')=>p&&p.bundle?`<span class="deal${cls}"><svg><use href="#i-gift"/></svg>${MQ.esc(p.bundle.label)}</span>`:'';
MQ.COMBO100={n:5,price:165000,skus:['MQ-DXO-100-GG','MQ-DXO-100-FHG','MQ-DXO-100-FHX']};
MQ.cardPerk=(p,v)=>MQ.cardPerk0(p,v)+(MQ.gnEligible(p)?`<p class="perk perk--gn">${MQ.gnNote()}</p>`:'');
MQ.cardPerk0=(p,v)=>p.combo?`<p class="perk perk--deal"><a class="deal" href="san-pham.html?id=${p.combo.id}"><svg><use href="#i-gift"/></svg>Combo 100g mua 5 tặng 1</a></p>`:p.bundle?`<p class="perk perk--deal">${MQ.dealTag(p)}</p>`:!p.own?'':(p.cat==='set'||p.giftbox)?`<p class="perk"><svg><use href="#i-gift"/></svg>Tặng túi 100g sấy dẻo</p>`:(!/^(Hũ|Hộp)/.test(v.w)?`<p class="perk perk--qty">Mua 3 túi −5% · 6 túi −8%</p>`:'');
MQ.card=(p,opts={})=>{
  const w=MQ.wish.has(p.id);
  if(p.soon){const v=MQ.vars(p)[0];return `<article class="pcard pcard--soon" data-id="${p.id}">
    <div class="pcard__media"><span class="badge badge--line">Sắp ra mắt</span><img src="${MQ.img(p.img,true)}" alt="${MQ.esc(p.name)}" loading="lazy"></div>
    <div class="pcard__body"><span class="pcard__origin">${MQ.CATS[p.cat].short}</span><h3 class="pcard__name">${p.name}</h3>
    <div class="pcard__btns"><button class="cbtn cbtn--line" data-notify="${p.id}">Báo tôi khi có hàng</button></div></div></article>`}
  const v=MQ.defVar(p), lines=p.lines.map(MQ.lineName).join(' · '), multi=MQ.vars(p).length>1;
  return `<article class="pcard${p.oos?' pcard--oos':''}${p.own?' pcard--mq':''}${opts.cls?' '+opts.cls:''}" data-id="${p.id}" data-sku="${v.sku}">
    <div class="pcard__media">
      ${p.oos?'<span class="badge badge--oos">Hết hàng</span>':p.badge?`<span class="badge badge--hot">${p.badge}</span>`:''}
      <a href="${MQ.url(p)}" class="pcard__img" aria-label="${MQ.esc(p.name)}"><img src="${MQ.img(v.img,true)}" alt="${MQ.esc(p.name)}" loading="lazy" data-card-img>${MQ.procTag(p)}</a>
      <button class="tool${w?' is-on':''}" data-wish="${p.id}" aria-label="Yêu thích"><svg><use href="#i-heart${w?'-f':''}"/></svg></button>
    </div>
    <div class="pcard__body">
      <span class="pcard__origin">${p.own?`<i class="mqseal" aria-hidden="true">MQ</i>Mộc Quả`:MQ.esc(lines||MQ.makerName(p))}${MQ.PROC.includes(p.cat)?'':' · '+MQ.CATS[p.cat].short}</span>
      <h3 class="pcard__name"><a href="${MQ.url(p)}">${p.name}</a> <span class="pcard__w" data-card-w>${MQ.esc(v.w)}</span></h3>
      ${multi?MQ.chips(p,v):''}
      <div class="perkw" data-perk>${MQ.cardPerk(p,v)}</div>
      <div class="pcard__price"><span class="price${v.p?'':' price--quote'}" data-card-price>${v.p?MQ.fmt(v.p):'Liên hệ báo giá'}</span>${multi?`<small>${MQ.sizeVars(p).length} quy cách${p.packs?' · '+Object.keys(p.packs).length+' mẫu':''}</small>`:''}</div>
      <div class="pcard__btns"><a class="cbtn cbtn--line" href="${MQ.url(p)}">Chi tiết</a>${p.oos?`<button class="cbtn cbtn--buy cbtn--oos" data-notify="${p.id}">Báo khi có hàng</button>`:`<button class="cbtn cbtn--buy addbtn${v.p?'':' is-quote'}" data-add="${p.id}" data-w="${v.sku}" aria-label="Đặt mua ${MQ.esc(p.name)}"><svg><use href="#i-cart"/></svg><span>${v.p?'Đặt mua':'Báo giá'}</span></button>`}</div>
    </div></article>`;
};
/* đổi quy cách trên thẻ sản phẩm */
MQ.cardSelect=(card,sku)=>{const p=MQ.byId(card.dataset.id);if(!p)return;const v=MQ.findVar(p,sku);card.dataset.sku=v.sku;
  card.querySelectorAll('.wchip').forEach(b=>b.classList.toggle('is-on',b.dataset.sku===v.sku||(p.packs&&MQ.findVar(p,b.dataset.sku).w===v.w)));
  const im=card.querySelector('[data-card-img]');if(im&&v.img)im.src=MQ.img(v.img,true);
  card.querySelector('[data-card-w]').textContent=v.w;
  const pk=card.querySelector('[data-perk]');if(pk)pk.innerHTML=MQ.cardPerk(p,v);
  const pr=card.querySelector('[data-card-price]');pr.textContent=v.p?MQ.fmt(v.p):'Liên hệ báo giá';pr.classList.toggle('price--quote',!v.p);
  const ab=card.querySelector('.addbtn');ab.dataset.w=v.sku;ab.classList.toggle('is-quote',!v.p);ab.querySelector('span').textContent=v.p?'Đặt mua':'Báo giá';};

MQ.searchText=p=>MQ.norm([p.name,MQ.CATS[p.cat].name,MQ.CATS[p.cat].short,p.fruit&&MQ.FRUITS[p.fruit].name,p.flavour&&MQ.FLAVOURS[p.flavour].name,MQ.makerName(p),...(p.lines||[]).map(MQ.lineName),...MQ.vars(p).map(v=>v.sku+' '+v.w),p.short].join(' '));
/* ---------- cart ---------- */
MQ.cart={
  items(){const a=store.get('cart',[]);let ch=false;   // giỏ cũ: đổi id/SKU đã gộp hoặc đổi tên sang trang mới
    a.forEach(i=>{if(!((MQ.ID_ALIAS||{})[i.id]||(MQ.SKU_ALIAS||{})[i.sku]))return;const p=MQ.byId(i.id);if(!p||!p.variants)return;const v=MQ.findVar(p,i.sku);
      Object.assign(i,{id:p.id,sku:v.sku,name:p.name,price:v.p||i.price,w:MQ.varLabel(p,v),img:v.img||i.img,key:p.id+'|'+v.sku});ch=true});
    if(ch)store.set('cart',a);return a},
  save(a){store.set('cart',a);MQ.renderCounts();MQ.renderDrawer();document.dispatchEvent(new CustomEvent('mq:cart'))},
  add(item,qty=1){const a=this.items();const ex=a.find(i=>i.key===item.key);if(ex)ex.qty+=qty;else a.push({...item,qty});this.save(a)},
  addProduct(id,w,qty=1,silent){const p=MQ.byId(id)||MQ.giftById(id);if(!p)return;if(p.oos){MQ.toast&&MQ.toast(p.name+' đang tạm hết hàng');return}
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
/* ---------- khuyến mãi minh bạch (tự động) ---------- */
MQ.TIERS=[{min:2000000,pct:10},{min:1000000,pct:8},{min:500000,pct:5}];   // giảm theo giá trị đơn
MQ.ZIPQ=[{n:6,pct:8},{n:3,pct:5}];                                       // mua nhiều túi zip Mộc Quả
MQ.GIFT_OPTS=[{id:'xoai',name:'Xoài cát sấy dẻo',img:'products/mqz/mqz-dxo-500'},{id:'dautay',name:'Dâu tây Đà Lạt sấy dẻo',img:'products/mqz/mqz-ddy-500'},{id:'ximuoi',name:'Xí muội đỏ đặc biệt',img:'products/mqz/mqz-omxd-250'}];
MQ.GIFT_BAG_MIN=1000000;
MQ.r1k=v=>Math.round(v/1000)*1000;
MQ.isZipItem=i=>{const p=MQ.byId(i.id);return !!(p&&p.own&&p.cat!=='set'&&!p.giftbox&&!/^(Hũ|Hộp)/.test(i.w||''))};
MQ.isSetItem=i=>{const p=MQ.byId(i.id);return !!(p&&p.own&&(p.cat==='set'||p.giftbox))};
MQ.giftPick=()=>MQ.GIFT_OPTS.find(o=>o.id===MQ.store.get('giftpick','xoai'))||MQ.GIFT_OPTS[0];
/* Quà gói nhỏ xoài muối ớt GoodGood 50–100g (giá vốn ~12k): đơn từ 199k tặng 1 · mua 2 túi xoài 200g+ tặng 1 (mỗi 2 túi) — lấy mức cao hơn, không cộng dồn, tối đa 3 gói/đơn */
MQ.GN={pid:'xoai-say-deo-muoi-ot-goodgood',sku:'MQ-DXM-S-GG',min:199000,pair:2,minG:200,max:3,label:'Gói nhỏ 50–100g'};
MQ.gnBig=i=>{const p=MQ.byId(i.id);if(!p||p.fruit!=='xoai'||!(i.price>0))return false;const v=MQ.findVar(p,i.sku);return !!(v&&v.g>=MQ.GN.minG)};
MQ.gnEligible=p=>p&&p.fruit==='xoai'&&!p.soon&&MQ.vars(p).some(v=>v.g>=MQ.GN.minG&&v.p);
MQ.gnNote=(cls='')=>`<span class="gnnote${cls}" title="Mua 2 túi xoài từ 200g hoặc đơn từ ${MQ.fmt(MQ.GN.min)}: tặng 1 gói nhỏ xoài muối ớt GoodGood"><svg><use href="#i-gift"/></svg>Quà tặng: gói nhỏ 50–100g</span>`;
MQ.promo=items=>{
  const sub=items.reduce((s,i)=>s+i.qty*i.price,0);
  const zip=items.filter(MQ.isZipItem),zipN=zip.reduce((s,i)=>s+i.qty,0),zipSub=zip.reduce((s,i)=>s+i.qty*i.price,0);
  const zq=MQ.ZIPQ.find(t=>zipN>=t.n),qtyDisc=zq?MQ.r1k(zipSub*zq.pct/100):0;
  const C=MQ.COMBO100,cu=[];items.forEach(i=>{if(C.skus.includes(i.sku)&&i.price>0)for(let k=0;k<i.qty;k++)cu.push(i)});
  const comboN=Math.floor(cu.length/C.n);let comboDisc=0;
  if(comboN){const sorted=[...cu].sort((a,b)=>a.price-b.price).slice(0,comboN*C.n);comboDisc=Math.max(0,sorted.reduce((s,i)=>s+i.price,0)-comboN*C.price)}
  const base=sub-qtyDisc-comboDisc,tier=MQ.TIERS.find(t=>base>=t.min),tierDisc=tier?MQ.r1k(base*tier.pct/100):0;
  const up=[...MQ.TIERS].reverse().find(t=>base<t.min);
  const setN=items.filter(MQ.isSetItem).reduce((s,i)=>s+i.qty,0),g=MQ.giftPick(),gifts=[];
  if(setN)gifts.push({key:'gift-set',name:'Túi 100g '+g.name,w:'Quà tặng kèm Set quà · 1 túi/set',qty:setN,img:g.img,pick:true});
  /* KM tặng kèm theo sản phẩm (p.bundle): đủ buy món cùng sản phẩm -> tặng 1 món quà 0đ */
  const bq={};items.forEach(i=>{const p=MQ.byId(i.id);if(p&&p.bundle&&i.price>0){
    if(p.bundle.gmap){const g=p.bundle.gmap[i.sku]||Object.values(p.bundle.gmap)[0],gp=MQ.byId(g[0]),gv=gp&&MQ.findVar(gp,g[1]);
      gifts.push({key:'gift-b-'+i.sku,name:(gp?gp.name:'Quà tặng')+(gv?' · '+gv.w:''),w:'Quà tặng 0đ · KM “'+p.bundle.label+'”',qty:i.qty,img:gv?gv.img:null,bundle:p.id});return}
    bq[p.id]=(bq[p.id]||0)+i.qty}});
  Object.entries(bq).forEach(([id,q])=>{const p=MQ.byId(id),b=p.bundle,k=Math.floor(q/b.buy);if(!k)return;
    const gp=MQ.byId(b.gid),gv=gp&&MQ.findVar(gp,b.gsku);
    gifts.push({key:'gift-b-'+id,name:(gp?gp.name:'Quà tặng')+(gv?' · '+gv.w:''),w:'Quà tặng 0đ · KM “'+b.label+'”',qty:k,img:gv?gv.img:null,bundle:id})});
  if(comboN){const cnt={};cu.forEach(i=>cnt[i.sku]=(cnt[i.sku]||0)+1);const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0],gi=cu.find(i=>i.sku===top),gp=MQ.byId(gi.id),gv=gp&&MQ.findVar(gp,top);
    gifts.push({key:'gift-c100',name:(gp?gp.name:'Xoài sấy dẻo')+' · 100g',w:'Quà tặng 0đ · Combo xoài 100g mua 5 tặng 1',qty:comboN,img:gv?gv.img:null})}
  {const G=MQ.GN,bigN=items.filter(MQ.gnBig).reduce((s,i)=>s+i.qty,0),byPair=Math.floor(bigN/G.pair),byOrder=base>=G.min?1:0,q=Math.min(G.max,Math.max(byPair,byOrder));
   if(q){const gp=MQ.byId(G.pid),gv=gp&&MQ.findVar(gp,G.sku);gifts.push({key:'gift-gn',name:'Xoài sấy dẻo muối ớt GoodGood · '+G.label,w:'Quà tặng 0đ · '+(byPair>=byOrder?`Mua ${G.pair} túi xoài từ ${G.minG}g tặng 1 gói nhỏ`:`Đơn từ ${MQ.fmt(G.min)} tặng 1 gói nhỏ`),qty:q,img:gv?gv.img:null})}}
  if(base>=MQ.GIFT_BAG_MIN)gifts.push({key:'gift-bag',name:'Túi giấy quà & thiệp viết tay Mộc Quả',w:'Quà tặng đơn từ '+MQ.fmt(MQ.GIFT_BAG_MIN),qty:1,img:null,box:'#1e3a2f',ribbon:'#c4a265'});
  return {sub,zipN,zq,qtyDisc,comboN,comboDisc,base,tier,tierDisc,up,gifts,zipNeed:zq?null:MQ.ZIPQ[MQ.ZIPQ.length-1].n-zipN};
};
/* gợi ý tiến độ: giao miễn phí → bậc giảm kế tiếp */
MQ.progress=P=>{const b=P.base;
  if(!P.sub)return {text:`Miễn phí giao từ <b>${MQ.fmt(MQ.FREE_SHIP)}</b> · đơn từ <b>${MQ.fmt(MQ.TIERS[2].min)}</b> giảm 5%.`,pct:0};
  const hasGN=P.gifts&&P.gifts.some(g=>g.key==='gift-gn');
  if(b<MQ.GN.min&&!hasGN)return {text:`Mua thêm <b>${MQ.fmt(MQ.GN.min-b)}</b> để được <b>tặng 1 gói xoài muối ớt</b> (0đ).`,pct:b/MQ.FREE_SHIP*100};
  if(b<MQ.FREE_SHIP)return {text:`Đã có quà gói xoài · Mua thêm <b>${MQ.fmt(MQ.FREE_SHIP-b)}</b> để được <b>miễn phí giao hàng</b>.`,pct:b/MQ.FREE_SHIP*100};
  if(P.up)return {text:`${P.tier?`Đang giảm <b>${P.tier.pct}%</b> · `:'Đã miễn phí giao · '}Mua thêm <b>${MQ.fmt(P.up.min-b)}</b> để được giảm <b>${P.up.pct}%</b>.`,pct:b/P.up.min*100};
  return {text:`Bạn đang nhận ưu đãi cao nhất: <b>giảm ${P.tier.pct}%</b> + miễn phí giao hàng.`,pct:100};
};
MQ.calc=(items,couponCode,shipId='std')=>{
  const P=MQ.promo(items),sub=P.sub;
  const m=MQ.SHIP_METHODS.find(x=>x.id===shipId)||MQ.SHIP_METHODS[0];
  let ship=sub===0?0:m.fee; if(m.freeOver&&P.base>=MQ.FREE_SHIP) ship=0;
  let cdisc=0,cp=null,msg='',note='';
  if(couponCode){const c=MQ.COUPONS[couponCode.toUpperCase()];
    if(!c) msg='Mã không hợp lệ';
    else if(c.min&&P.base<c.min) msg=`Đơn tối thiểu ${MQ.fmt(c.min)}`;
    else{cp={code:couponCode.toUpperCase(),...c};
      if(c.type==='pct') cdisc=Math.min(c.max||1e12,MQ.r1k(P.base*c.value/100));
      if(c.type==='fixed') cdisc=c.value;
      if(c.type==='ship'){ if(m.id==='std') ship=0; else msg='FREESHIP chỉ áp dụng cho giao tiêu chuẩn'; }
    }}
  // mã giảm giá và ưu đãi theo đơn không cộng dồn: tự chọn mức có lợi hơn cho khách
  let tierDisc=P.tierDisc;
  if(cdisc&&tierDisc){ if(cdisc>tierDisc){note=`Mã ${cp.code} có lợi hơn nên thay cho ưu đãi giảm ${P.tier.pct}% theo đơn`;tierDisc=0}else{note=`Ưu đãi giảm ${P.tier.pct}% theo đơn có lợi hơn mã ${cp.code} (không cộng dồn)`;cdisc=0} }
  const disc=P.qtyDisc+P.comboDisc+tierDisc+cdisc;
  const rows=[];
  if(P.comboDisc)rows.push({k:'combo100',label:`Combo xoài 100g mua 5 tặng 1 (×${P.comboN})`,v:P.comboDisc});
  if(P.qtyDisc)rows.push({k:'qty',label:`Mua ${P.zipN} túi zip Mộc Quả (−${P.zq.pct}%)`,v:P.qtyDisc});
  if(tierDisc)rows.push({k:'tier',label:`Ưu đãi đơn từ ${MQ.fmt(P.tier.min)} (−${P.tier.pct}%)`,v:tierDisc});
  if(cdisc)rows.push({k:'coupon',label:`Mã ${cp.code}`,v:cdisc});
  const total=Math.max(0,sub-disc+ship);
  return {sub,ship,disc,qtyDisc:P.qtyDisc,tierDisc,cdisc,rows,gifts:P.gifts,promo:P,total,coupon:cp,msg,note,points:Math.floor(total/10000)};
};
MQ.discRowsHtml=r=>r.rows.map(x=>`<div class="srow srow--disc" data-drow="${x.k}"><span>${MQ.esc(x.label)}</span><b>−${MQ.fmt(x.v)}</b></div>`).join('');
MQ.giftPickSel=()=>`<select class="giftpick" data-giftpick aria-label="Chọn quà tặng kèm">${MQ.GIFT_OPTS.map(o=>`<option value="${o.id}"${o.id===MQ.giftPick().id?' selected':''}>${o.name}</option>`).join('')}</select>`;

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
const procFruits=k=>{const fr=[...new Set(live.filter(p=>p.cat===k&&p.fruit).map(p=>p.fruit))].map(f=>[f,cnt(p=>p.cat===k&&p.fruit===f)]).filter(x=>x[1]>1).sort((a,b)=>b[1]-a[1]);
  return fr.length?`<p class="dd__sub">${fr.map(([f,n])=>`<a href="cua-hang.html?cat=${k}&fruit=${f}">${MQ.FRUITS[f].name}</a>`).join('')}</p>`:''};
const CATLINKS=Object.entries(MQ.CATS).filter(([k,c])=>!c.soon).map(([k,c])=>`<a href="cua-hang.html?cat=${k}">${c.name}<small>${cnt(p=>p.cat===k)} sản phẩm</small></a>`).join('')+`<a href="cua-hang.html?cat=soon">Hạt · Trà · Kẹo <em class="soon-tag">Sắp có</em></a>`;
const FRUITLINKS=Object.entries(MQ.FRUITS).filter(([k,f])=>f.top&&cnt(p=>p.fruit===k)).map(([k,f])=>`<a href="cua-hang.html?fruit=${k}">${f.name}</a>`).join('')+`<a href="cua-hang.html#loai-qua" class="mega__all">+ ${Object.keys(MQ.FRUITS).filter(k=>!MQ.FRUITS[k].top&&cnt(p=>p.fruit===k)).length} loại khác</a>`;
const FLAVLINKS=Object.entries(MQ.FLAVOURS).filter(([k])=>cnt(p=>p.flavour===k)).map(([k,f])=>`<a href="cua-hang.html?flavour=${k}">${f.name}</a>`).join('');
const LINELINKS=`<a href="cua-hang.html?line=mq" class="mega__own">${MQ.mark('mega__seal')}<span>Mộc Quả<small>mocqua.com · ${cnt(p=>p.lines.includes('mq'))} sản phẩm</small></span></a><span class="mega__sub">Viza Food</span>`+Object.entries(MQ.LINES).filter(([k,l])=>l.maker==='viza').map(([k,l])=>`<a href="cua-hang.html?line=${k}">${l.name}</a>`).join('');
function header(){
  const own=live.filter(p=>p.own), ownCats=[...new Set(own.map(p=>p.cat))];
  const cc=k=>cnt(p=>p.cat===k);
  const dl=(href,label,n)=>`<a href="${href}">${label}${n!=null?`<small>${n}</small>`:''}</a>`;
  const omai=live.filter(p=>p.cat==='omai').sort((a,b)=>(a.rank||99)-(b.rank||99));
  return `
<div class="tbar"><div class="wrap tbar__in">
  <a class="tbar__msg tbar__promo" href="chinh-sach.html#khuyen-mai"><svg><use href="#i-truck"/></svg><span class="tp-l">Miễn phí giao từ <b>300k</b><i>·</i>Đơn từ 500k <b>−5%</b>, từ 1 triệu <b>−8%</b>, từ 2 triệu <b>−10%</b><i>·</i>Set quà tặng túi 100g<i>·</i>Đơn 199k tặng gói xoài muối ớt</span><span class="tp-s">Freeship 300k<i>·</i>Đơn 500k <b>−5%</b> · 1tr <b>−8%</b> · 2tr <b>−10%</b><i>·</i>Set tặng quà</span></a>
  <span class="tbar__msg tbar__demo">Hotline &amp; Zalo ${MQ.HOTLINE} · ${MQ.HOTLINE2}</span>
  <nav class="tbar__links" aria-label="Liên kết nhanh"><a href="cau-chuyen.html"${act('story')}>Câu chuyện</a><a href="tra-cuu-don.html">Tra cứu đơn</a><a href="yeu-thich.html">Yêu thích <span class="hcount" data-wish-count>0</span></a><a href="tai-khoan.html">Tài khoản</a></nav>
</div></div>
<header class="hd"><div class="wrap hd__in">
  <button class="burger" aria-label="Mở danh mục" aria-expanded="false"><span></span><span></span></button>
  <a href="index.html" class="brand" aria-label="Mộc Quả — trang chủ">${MQ.mark('brand__mark')}<span class="brand__text"><b>Mộc Quả</b><small>Quả ngon · Quà trọn</small></span></a>
  <div class="hd__promise"><b>Quả ngon tuyển chọn <span>·</span> <em>Đóng gói chuẩn quà</em></b><small>Trái cây sấy · ô mai · set quà Tết — Mộc Quả &amp; Viza Food chính hãng</small></div>
  <form class="hd__search" action="cua-hang.html" role="search"><input name="q" type="search" placeholder="Tìm xoài, sầu riêng, xí muội…" aria-label="Tìm sản phẩm" autocomplete="off" data-search-open><button type="submit" aria-label="Tìm"><svg><use href="#i-search"/></svg></button></form>
  <a class="hd__hot" href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg><span><small>Zalo ${MQ.HOTLINE2}</small>${MQ.HOTLINE}</span></a>
  <button class="hd__cart" data-cart-open aria-label="Giỏ hàng"><span class="hd__cicon"><svg><use href="#i-cart"/></svg><span class="cart-count" data-cart-count>0</span></span><span class="hd__cl"><small>Giỏ hàng</small><b data-cart-sum>0đ</b></span></button>
</div></header>
<nav class="mbar" aria-label="Menu chính"><div class="wrap mbar__in">
  <div class="mbar__head"><b>Danh mục</b><button class="icon-btn" data-close-all aria-label="Đóng"><svg><use href="#i-close"/></svg></button></div>
  <div class="mbar__item"><a href="index.html"${act('home')}>Trang chủ</a></div>
  <div class="mbar__item has-dd"><a href="cua-hang.html"${page==='shop'?' class="is-active"':''}>Trái cây sấy <svg class="chev"><use href="#i-chev"/></svg></a>
    <div class="dd dd--wide"><div class="dd__col"><h6>Theo cách sấy</h6>${MQ.PROC.map(k=>dl('cua-hang.html?cat='+k,MQ.CATS[k].name,cc(k))+procFruits(k)).join('')}<a href="cua-hang.html?flavour=muoiot">Vị muối ớt · cay<small>${cnt(p=>p.flavour==='muoiot')}</small></a><a href="cua-hang.html" class="dd__all">Tất cả sản phẩm →</a></div>
      <div class="dd__col"><h6>Theo loại quả</h6><div class="dd__2">${FRUITLINKS}</div></div>
      <div class="dd__col"><h6>Quy cách</h6><a href="cua-hang.html?tag=small">Gói nhỏ ≤ 100g</a><a href="cua-hang.html?tag=mid">Túi vừa 120 – 300g</a><a href="cua-hang.html?tag=big">Túi lớn ≥ 350g</a><h6 class="mt">Hương vị</h6>${FLAVLINKS}</div></div></div>
  <div class="mbar__item has-dd"><a href="cua-hang.html?cat=omai">Ô mai &amp; xí muội <svg class="chev"><use href="#i-chev"/></svg></a>
    <div class="dd"><div class="dd__col"><h6>Ô mai · xí muội · ngào đường</h6><div class="dd__2">${omai.map(p=>dl(MQ.url(p),p.name)).join('')}</div><a href="cua-hang.html?cat=omai" class="dd__all">Xem tất cả ${omai.length} sản phẩm →</a></div></div></div>
  <div class="mbar__item has-dd"><a href="cua-hang.html?cat=hat">Hạt dinh dưỡng <svg class="chev"><use href="#i-chev"/></svg></a>
    <div class="dd"><div class="dd__col"><h6>Hộp giấy 100g · Viza Food</h6>${live.filter(p=>p.vizabox).sort((a,b)=>(a.rank||99)-(b.rank||99)).map(p=>dl(MQ.url(p),p.name.replace(' Viza Food',''))).join('')}<a href="cua-hang.html?line=vizabox" class="dd__all">Xem tất cả hộp giấy Viza →</a></div></div></div>
  <div class="mbar__item has-dd"><a href="cua-hang.html?cat=set">Set quà <svg class="chev"><use href="#i-chev"/></svg></a>
    <div class="dd"><div class="dd__col"><h6>Quà tặng</h6>${dl('cua-hang.html?cat=set','Set quà &amp; khay mứt Mộc Quả',cc('set'))}<a href="hop-qua.html#hop-san">Hộp quà Tết 2027</a><a href="hop-qua.html#tu-thiet-ke">Tự thiết kế hộp quà <em class="soon-tag soon-tag--gold">Mới</em></a><a href="hop-qua.html#doanh-nghiep">Quà tặng doanh nghiệp</a><a href="hop-qua.html#chon-qua">Gợi ý chọn quà</a></div></div></div>
  <div class="mbar__item has-dd"><a href="cua-hang.html?line=mq">Mộc Quả <svg class="chev"><use href="#i-chev"/></svg></a>
    <div class="dd"><div class="dd__col"><h6>Thương hiệu riêng · mocqua.com</h6>${dl('cua-hang.html?line=mq','Tất cả sản phẩm Mộc Quả',own.length)}${ownCats.map(k=>dl(`cua-hang.html?line=mq&cat=${k}`,MQ.CATS[k].name,own.filter(p=>p.cat===k).length)).join('')}</div></div></div>
  <div class="mbar__item has-dd"><a href="cua-hang.html?line=${Object.keys(MQ.LINES).filter(k=>MQ.LINES[k].maker==='viza').join(',')}">Viza Food <svg class="chev"><use href="#i-chev"/></svg></a>
    <div class="dd"><div class="dd__col"><h6>Hàng chính hãng Viza Food</h6>${Object.entries(MQ.LINES).filter(([k,l])=>l.maker==='viza').map(([k,l])=>dl('cua-hang.html?line='+k,l.name,cnt(p=>p.lines.includes(k)))).join('')}</div></div></div>
  <div class="mbar__item"><a href="goc-am-thuc.html"${act('blog')}>Góc ẩm thực</a></div>
  <div class="mbar__item"><a href="lien-he.html"${act('contact')}>Liên hệ</a></div>
  <div class="mbar__extra"><a href="cau-chuyen.html">Câu chuyện Mộc Quả</a><a href="tra-cuu-don.html">Tra cứu đơn hàng</a><a href="yeu-thich.html">Danh sách yêu thích</a><a href="tai-khoan.html">Tài khoản</a><a href="chinh-sach.html">Chính sách</a><a href="tel:${MQ.TEL}" class="mbar__hot"><svg><use href="#i-phone"/></svg> Hotline ${MQ.HOTLINE}</a><a href="tel:${MQ.TEL2}" class="mbar__hot"><svg><use href="#i-phone"/></svg> Hotline ${MQ.HOTLINE2}</a></div>
</div></nav>
<div class="search" aria-hidden="true"><div class="search__panel">
  <form class="search__form" action="cua-hang.html"><svg><use href="#i-search"/></svg><input name="q" type="search" placeholder="Tìm xoài sấy dẻo, xí muội, mã SP…" autocomplete="off" aria-label="Tìm kiếm"><button type="button" class="icon-btn" data-search-close aria-label="Đóng"><svg><use href="#i-close"/></svg></button></form>
  <div class="search__body"><div class="search__hint"><small>Tìm nhiều</small><div class="chips"><a class="chip" href="cua-hang.html?fruit=xoai">Xoài sấy</a><a class="chip" href="cua-hang.html?fruit=saurieng">Sầu riêng thăng hoa</a><a class="chip" href="cua-hang.html?flavour=muoiot">Vị muối ớt</a><a class="chip" href="cua-hang.html?line=mq">Mộc Quả</a><a class="chip" href="cua-hang.html?cat=omai">Ô mai · xí muội</a><a class="chip" href="cua-hang.html?cat=gion">Mít sấy giòn</a><a class="chip" href="hop-qua.html">Hộp quà Tết</a></div></div><div class="search__results" data-search-results></div></div>
</div></div>`;
}
/* sidebar dùng chung: danh mục dạng cây + hỗ trợ + tin tức */
MQ.sideHelp=()=>`<section class="sbox sbox--help"><h3 class="sbox__t">Hỗ trợ đặt hàng</h3><div class="sbox__b"><a class="shot" href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg><span><small>Hotline · Zalo · 8:00 – 21:00</small>${MQ.HOTLINE}</span></a><a class="shot" href="tel:${MQ.TEL2}"><svg><use href="#i-phone"/></svg><span><small>Hotline · Zalo</small>${MQ.HOTLINE2}</span></a><a class="szalo" href="https://zalo.me/${MQ.TEL}" target="_blank" rel="noopener"><svg><use href="#i-zalo"/></svg>Chat Zalo đặt hàng</a><p>Tư vấn chọn quà, báo giá sỉ &amp; quà doanh nghiệp. Email ${MQ.EMAIL}.</p></div></section>`;
MQ.sideNews=()=>`<section class="sbox"><h3 class="sbox__t">Tin tức · Góc ẩm thực</h3><div class="sbox__b snews">${MQ.POSTS.slice(0,4).map(a=>`<a href="bai-viet.html?slug=${a.slug}"><img src="${MQ.img(a.img,true)}" alt="" loading="lazy"><span>${a.title}</span></a>`).join('')}<a class="snews__all" href="goc-am-thuc.html">Tất cả bài viết →</a></div></section>`;
MQ.sideGift=()=>`<a class="sbanner" href="hop-qua.html#tu-thiet-ke">${MQ.giftSvg('#7a2e22','#d8b878')}<span><small>Quà Tết 2027</small><b>Tự thiết kế hộp quà</b><em>Chọn vị · chọn hộp · viết thiệp →</em></span></a>`;
MQ.side=()=>{const cc=k=>cnt(p=>p.cat===k);const L=(h,t,n)=>`<li><a href="${h}">${t}${n!=null?`<em>${n}</em>`:''}</a></li>`;
  const fr=Object.entries(MQ.FRUITS).map(([k,f])=>[k,f,cnt(p=>p.fruit===k)]).filter(x=>x[2]);
  return `<section class="sbox"><h3 class="sbox__t sbox__t--menu"><svg><use href="#i-list"/></svg>Danh mục sản phẩm</h3><ul class="tree">
  <li class="tree__g"><a href="cua-hang.html"><b>Trái cây sấy</b></a><ul>${MQ.PROC.map(k=>L('cua-hang.html?cat='+k,MQ.CATS[k].name,cc(k))+(()=>{const fr=[...new Set(live.filter(p=>p.cat===k&&p.fruit).map(p=>p.fruit))].map(f=>[f,cnt(p=>p.cat===k&&p.fruit===f)]).filter(x=>x[1]>1).sort((a,b)=>b[1]-a[1]);return fr.length?`<li class="tree__sub">${fr.map(([f,n])=>`<a href="cua-hang.html?cat=${k}&fruit=${f}">${MQ.fruitProc(f,k)}<em>${n}</em></a>`).join('')}</li>`:''})()).join('')}${L('cua-hang.html?flavour=muoiot','Vị muối ớt · cay',cnt(p=>p.flavour==='muoiot'))}</ul></li>
  <li class="tree__g"><a href="cua-hang.html?cat=omai"><b>Ô mai &amp; xí muội</b><em>${cc('omai')}</em></a></li>
  <li class="tree__g"><a href="cua-hang.html?cat=hat"><b>Hạt dinh dưỡng</b><em>${cc('hat')}</em></a></li>
  <li class="tree__g"><a href="cua-hang.html?cat=set"><b>Set quà &amp; hộp quà</b></a><ul>${L('cua-hang.html?cat=set','Set quà &amp; khay mứt',cc('set'))}${L('hop-qua.html#hop-san','Hộp quà Tết 2027')}${L('hop-qua.html#tu-thiet-ke','Tự thiết kế hộp quà')}</ul></li>
  <li class="tree__g"><span><b>Theo loại quả</b></span><ul class="tree__fr">${fr.filter(x=>x[1].top).map(([k,f,n])=>L('cua-hang.html?fruit='+k,f.name,n)).join('')}${L('cua-hang.html#loai-qua',`+ ${fr.filter(x=>!x[1].top).length} loại quả khác`)}</ul></li>
  <li class="tree__g"><span><b>Thương hiệu</b></span><ul>${L('cua-hang.html?line=mq','<i class="mqseal">MQ</i>Mộc Quả',cnt(p=>p.own))}<li class="tree__sub">Viza Food</li>${Object.entries(MQ.LINES).filter(([k,l])=>l.maker==='viza').map(([k,l])=>L('cua-hang.html?line='+k,l.name,cnt(p=>p.lines.includes(k)))).join('')}</ul></li>
  </ul></section>${MQ.sideHelp()}${MQ.sideGift()}${MQ.sideNews()}`};
function footer(){
  return `
<section class="newsletter"><div class="container newsletter__inner">
  <div><p class="eyebrow"><span class="line"></span>Thư mùa quả</p><h3>Nhận tin mùa vụ mới &amp; <em>ưu đãi riêng cho hội viên</em></h3></div>
  <form class="newsletter__form" data-demo-form="Cảm ơn bạn đã đăng ký nhận Thư mùa quả! (demo)"><input type="email" required placeholder="Email của bạn" aria-label="Email"><button class="btn btn--gold" type="submit">Đăng ký</button><small>Tặng mã <b>MOCQUA10</b> cho đơn đầu tiên (demo).</small></form>
</div></section>
<footer class="footer">
  <div class="container footer__grid">
    <div class="footer__brand"><a href="index.html" class="brand brand--light">${MQ.mark('brand__mark')}<span class="brand__text"><b>Mộc Quả</b><small>Quả ngon · Quà trọn</small></span></a>
      <p>Quả của đất, quà của tình. Mộc Quả tuyển chọn trái cây sấy dưới thương hiệu riêng <b>mocqua.com</b> và phân phối hàng chính hãng Viza Food — cho bữa ăn vặt mỗi ngày và những món quà trọn vẹn.</p>
      <div class="footer__pay"><span>COD</span><span>VietQR</span><span>Ví điện tử</span><span>Thẻ ATM/Visa</span></div></div>
    <div><h5>Cửa hàng</h5><a href="cua-hang.html?cat=deo">Trái cây sấy dẻo</a><a href="cua-hang.html?cat=thanghoa">Trái cây sấy thăng hoa</a><a href="cua-hang.html?cat=gion">Trái cây sấy giòn</a><a href="cua-hang.html?cat=omai">Ô mai &amp; xí muội</a><a href="cua-hang.html?cat=hat">Hạt dinh dưỡng</a><a href="cua-hang.html?line=mq">Thương hiệu Mộc Quả</a><a href="hop-qua.html">Hộp quà Tết</a><a href="hop-qua.html#tu-thiet-ke">Tự thiết kế hộp quà</a></div>
    <div><h5>Hỗ trợ</h5><a href="chinh-sach.html#huong-dan">Hướng dẫn mua hàng</a><a href="chinh-sach.html#thanh-toan">Hình thức thanh toán</a><a href="chinh-sach.html#giao-hang">Giao hàng &amp; vận chuyển</a><a href="chinh-sach.html#doi-tra">Đổi trả &amp; hoàn tiền</a><a href="chinh-sach.html#bao-mat">Bảo mật thông tin</a><a href="tra-cuu-don.html">Tra cứu đơn hàng</a></div>
    <div><h5>Liên hệ</h5><a href="tel:${MQ.TEL}">Hotline · Zalo: ${MQ.HOTLINE}</a><a href="tel:${MQ.TEL2}">Hotline · Zalo: ${MQ.HOTLINE2}</a><a href="mailto:${MQ.EMAIL}">${MQ.EMAIL}</a><a href="lien-he.html">${MQ.ADDRESS}</a><span>8:00 – 21:00, tất cả các ngày</span><span>Techcombank · STK ${MQ.BANK.accountNo} · ${MQ.BANK.accountName}</span><a href="${MQ.FACEBOOK}" target="_blank" rel="noopener">Facebook</a><a href="${MQ.TIKTOK}" target="_blank" rel="noopener">TikTok</a><div class="footer__social"><a href="https://zalo.me/${MQ.TEL}" target="_blank" rel="noopener" aria-label="Zalo ${MQ.HOTLINE}"><svg><use href="#i-zalo"/></svg></a><a href="https://zalo.me/${MQ.TEL2}" target="_blank" rel="noopener" aria-label="Zalo ${MQ.HOTLINE2}"><svg><use href="#i-zalo"/></svg></a><a href="${MQ.FACEBOOK}" target="_blank" rel="noopener" aria-label="Facebook">f</a><a href="${MQ.TIKTOK}" target="_blank" rel="noopener" aria-label="TikTok">♪</a></div></div>
  </div>
  <div class="container footer__bottom"><span>© 2026 Mộc Quả · mocqua.com</span><span>${MQ.ADDRESS}</span></div>
  <div class="footer__word" aria-hidden="true">Mộc Quả</div>
</footer>
<div class="float">
  <a href="https://zalo.me/${MQ.TEL}" target="_blank" rel="noopener" class="float__btn float__btn--zalo" aria-label="Chat Zalo"><svg><use href="#i-zalo"/></svg></a>
  <a href="${MQ.FACEBOOK}" target="_blank" rel="noopener" class="float__btn float__btn--fb" aria-label="Facebook">f</a>
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
    <div data-dr-disc></div>
    <div class="drawer__row drawer__row--total" data-dr-totrow hidden><span>Sau ưu đãi</span><b data-dr-total></b></div>
    <p class="drawer__note">Ưu đãi &amp; quà tặng tự áp dụng · phí giao hàng tính ở bước thanh toán.</p>
    <div class="drawer__btns"><a href="gio-hang.html" class="btn btn--line">Xem giỏ hàng</a><a href="thanh-toan.html" class="btn btn--gold">Thanh toán</a></div>
    <p class="drawer__demo">Tư vấn qua Zalo ${MQ.HOTLINE} · ${MQ.HOTLINE2}</p>
  </footer>
</aside>
<dialog class="qv" id="qv"><button class="icon-btn qv__close" data-qv-close aria-label="Đóng"><svg><use href="#i-close"/></svg></button><div class="qv__body"></div></dialog>
<div class="toast" role="status" aria-live="polite"></div>`;
}
document.body.insertAdjacentHTML('afterbegin',SPRITE+header());
document.body.insertAdjacentHTML('beforeend',footer());

/* ---------- renderers ---------- */
MQ.renderCounts=()=>{const c=MQ.cart.count();$$('[data-cart-count]').forEach(e=>e.textContent=c);$$('[data-cart-sum]').forEach(e=>e.textContent=MQ.fmt(MQ.cart.subtotal()));const w=MQ.wish.list().length;$$('[data-wish-count]').forEach(e=>{e.textContent=w;e.style.display=w?'':'none'})};
MQ.thumb=i=>i.img?`<img class="ci__img" src="${MQ.img(i.img,true)}" alt="">`:`<div class="ci__img ci__img--gift">${MQ.giftSvg(i.box||'#2b4a3d',i.ribbon||'#c9a868')}</div>`;
MQ.renderDrawer=()=>{
  const items=MQ.cart.items(), sub=MQ.cart.subtotal(), count=MQ.cart.count(), d=$('.drawer');
  $('[data-count-text]').textContent=count?`(${count})`:'';
  $('[data-items]').innerHTML=items.map(i=>`<li class="ci">${MQ.thumb(i)}<div><h4>${MQ.esc(i.name)}</h4><small>${MQ.esc(i.w)}${i.meta?' · '+MQ.esc(i.meta):''}</small><div class="qty qty--sm"><button data-dec="${i.key}" aria-label="Giảm">−</button><span>${i.qty}</span><button data-inc="${i.key}" aria-label="Tăng">+</button></div></div><div class="ci__r"><b>${MQ.fmt(i.price*i.qty)}</b><button class="ci__rm" data-rm="${i.key}">Xoá</button></div></li>`).join('');
  const r=MQ.calc(items,''),pg=MQ.progress(r.promo);
  $('[data-items]').insertAdjacentHTML('beforeend',r.gifts.map(g=>`<li class="ci ci--gift">${MQ.thumb(g)}<div><h4>${MQ.esc(g.name)}</h4><small>${MQ.esc(g.w)}</small><small class="ci__qty">× ${g.qty}</small></div><div class="ci__r"><b>0đ</b><span class="ci__tag">Quà tặng</span></div></li>`).join(''));
  $('[data-subtotal]').textContent=MQ.fmt(sub);
  $('[data-dr-disc]').innerHTML=r.rows.map(x=>`<div class="drawer__row drawer__row--disc"><span>${MQ.esc(x.label)}</span><b>−${MQ.fmt(x.v)}</b></div>`).join('');
  $('[data-dr-totrow]').hidden=!r.disc;$('[data-dr-total]').textContent=MQ.fmt(sub-r.disc);
  $('[data-ship-text]').innerHTML=pg.text;
  $('[data-ship-bar]').style.width=Math.min(100,pg.pct)+'%';
  d.classList.toggle('is-empty',count===0);
};
MQ.openCart=()=>{if(page==='cart'||page==='checkout')return;document.body.classList.add('cart-open');$('.drawer').setAttribute('aria-hidden','false')};
MQ.closeAll=()=>{document.body.classList.remove('cart-open','nav-open','search-open');$('.drawer').setAttribute('aria-hidden','true');$('.burger').setAttribute('aria-expanded','false')};
MQ.bump=()=>$$('[data-cart-count]').forEach(c=>{c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')});
let tt;MQ.toast=html=>{const t=$('.toast');t.innerHTML=html;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2800)};

/* quick view */
MQ.quoteBox=(p,v)=>`<div class="qbox"><p><b>Liên hệ báo giá</b> — quy cách này đang cập nhật giá. Nhắn Mộc Quả để nhận báo giá &amp; tồn kho trong 5 phút (8:00–21:00).</p><div class="qbox__btns"><a class="btn btn--gold btn--sm" href="${MQ.zaloQuote(p,v)}" target="_blank" rel="noopener"><svg><use href="#i-zalo"/></svg>Chat Zalo</a><a class="btn btn--line btn--sm" href="tel:${MQ.TEL}"><svg><use href="#i-phone"/></svg>${MQ.HOTLINE}</a></div><small>Mã SP: ${v.sku}</small></div>`;
MQ.quickView=(id,sku)=>{const p=MQ.byId(id);if(!p||p.soon)return;if(p.oos){location.href=MQ.url(p);return}const dlg=$('#qv');const v=MQ.findVar(p,sku);
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
  if(el=t.closest('[data-search-open]')){e.preventDefault();if(el.blur)el.blur();const si=$('.search input');if(el.value)si.value=el.value;document.body.classList.add('search-open');setTimeout(()=>{si.focus();si.dispatchEvent(new Event('input'))},60);return}
  if(t.closest('[data-search-close]')||t.classList.contains('search')){document.body.classList.remove('search-open');return}
  if(t.closest('[data-top]')){scrollTo({top:0,behavior:'smooth'});return}
  if(t.closest('[data-qv-close]')||t.id==='qv'){$('#qv').close();return}
  if(el=t.closest('#qv .wchip')){const p=MQ.byId($('#qv').dataset.id);MQ.qvRender(p,MQ.findVar(p,el.dataset.sku));return}
  if(el=t.closest('.pcard .wchip')){e.preventDefault();MQ.cardSelect(el.closest('.pcard'),el.dataset.sku);return}
  if(el=t.closest('[data-qv-add]')){const w=$('#qv').dataset.sku;$('#qv').close();MQ.cart.addProduct(el.dataset.qvAdd,w);return}
  if(el=t.closest('.mbar__item.has-dd>a')){ if(matchMedia('(max-width:980px)').matches){e.preventDefault();el.parentElement.classList.toggle('is-open')} }
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
const hdr=$('.mbar');
const onS=()=>{hdr.classList.toggle('is-stuck',scrollY>150);document.body.classList.toggle('scrolled',scrollY>500)};
addEventListener('scroll',onS,{passive:true});onS();
/* marquee duplicate for mobile */

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
/* ===== Viza Food trên kệ: ảnh kệ hàng thực tế + lightbox ===== */
MQ.VIZA_LINES=Object.keys(MQ.LINES).filter(k=>MQ.LINES[k].maker==='viza');
MQ.SHELF_URL='cua-hang.html?line='+MQ.VIZA_LINES.join(',')+'#tren-ke';
MQ.SHELF=[
 'Kệ trái cây sấy Viza Food: xoài, mít, sầu riêng',
 'Sầu riêng sấy thăng hoa Yummy và Cheers+ trong tủ kệ',
 'Sầu riêng Cheers+ và mít sấy Fresh & Healthy',
 'Xoài sấy dẻo Fresh & Healthy trên kệ',
 'Xoài sấy dẻo Cheers+, GoodGood, Fresh & Healthy tại siêu thị',
 'Quầy xoài, mít sấy Viza Food tại siêu thị',
 'Giá treo xoài sấy dẻo Fresh & Healthy',
 'Xoài sấy dẻo Fresh & Healthy tại cửa hàng',
 'Sầu riêng sấy và mít sấy trên kệ',
 'Sầu riêng sấy Viza Food tại siêu thị',
 'Kệ sầu riêng sấy Viza Food',
 'Thanh long sấy Viza Food tại siêu thị'
].map((cap,i)=>{const n=String(i+1).padStart(2,'0');return{src:`assets/shelf/viza-ke-${n}.webp?v=${MQ.IMGV}`,th:`assets/shelf/viza-ke-${n}-t.webp?v=${MQ.IMGV}`,cap}});
MQ.shelfSection=()=>`<div class="shelf__head"><div><small class="shelf__eyebrow">Viza Food trên kệ</small><h2>Hàng thật trên kệ <em>siêu thị &amp; sân bay</em></h2></div>
 <p>Các dòng trái cây sấy Viza Food được phân phối tại siêu thị, cửa hàng ở sân bay trong nước và có xuất khẩu. Dưới đây là một số ảnh kệ hàng thực tế. Những túi Mộc Quả gửi tới bạn là đúng loại hàng đó: chính hãng, nguyên bao bì gốc, không san chiết hay dán nhãn lại.</p></div>
 <div class="shelf__grid">${MQ.SHELF.map((s,i)=>`<button type="button" class="shelf__item" data-lb="${i}" aria-label="Phóng to ảnh: ${MQ.esc(s.cap)}"><img src="${s.th}" alt="${MQ.esc(s.cap)}" loading="lazy" decoding="async"><span>${MQ.esc(s.cap)}</span></button>`).join('')}</div>`;
MQ.shelfStrip=()=>`<a class="shstrip" href="${MQ.SHELF_URL}"><span class="shstrip__copy"><small>Viza Food trên kệ</small><b>Hàng thật trên kệ siêu thị &amp; sân bay</b><i>Xem ảnh kệ hàng thực tế →</i></span><span class="shstrip__pics">${MQ.SHELF.slice(0,6).map(s=>`<img src="${s.th}" alt="${MQ.esc(s.cap)}" loading="lazy" decoding="async">`).join('')}</span></a>`;
(function(){let idx=0,box=null;
 const draw=()=>{const s=MQ.SHELF[idx];box.querySelector('img').src=s.src;box.querySelector('img').alt=s.cap;box.querySelector('figcaption').textContent=`${s.cap} · ${idx+1}/${MQ.SHELF.length}`};
 const close=()=>{if(box){box.remove();box=null;document.body.style.overflow=''}};
 const open=i=>{idx=i;if(!box){document.body.insertAdjacentHTML('beforeend',`<div class="lbox" role="dialog" aria-modal="true" aria-label="Ảnh kệ hàng Viza Food"><button class="lbox__x" data-lbx aria-label="Đóng">×</button><button class="lbox__nav lbox__nav--p" data-lbn="-1" aria-label="Ảnh trước">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="lbox__nav lbox__nav--n" data-lbn="1" aria-label="Ảnh sau">›</button></div>`);box=document.querySelector('.lbox');document.body.style.overflow='hidden';
   let x0=null;box.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});box.addEventListener('touchend',e=>{if(x0==null)return;const d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>40)step(d<0?1:-1);x0=null});box.querySelector('[data-lbx]').focus()}
   draw()};
 const step=d=>{idx=(idx+d+MQ.SHELF.length)%MQ.SHELF.length;draw()};
 document.addEventListener('click',e=>{const t=e.target.closest('[data-lb]');if(t){open(+t.dataset.lb);return}
  if(!box)return;const n=e.target.closest('[data-lbn]');if(n){step(+n.dataset.lbn);return}
  if(e.target.closest('[data-lbx]')||e.target===box||e.target.tagName==='FIGURE')close()});
 document.addEventListener('keydown',e=>{if(!box)return;if(e.key==='Escape')close();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1)});
})();
