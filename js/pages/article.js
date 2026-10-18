(function(){const MQ=window.MQ,{$}=MQ;
const a=MQ.POSTS.find(p=>p.slug===MQ.qs('slug'))||MQ.POSTS[0];document.title=a.title+' | Mộc Quả (demo)';
const B={p:t=>`<p>${t}</p>`,h:t=>`<h2>${t}</h2>`,quote:t=>`<blockquote>${t}</blockquote>`};
$('[data-article]').innerHTML=`<nav class="breadcrumb"><a href="index.html">Trang chủ</a><span><a href="goc-am-thuc.html">Góc ẩm thực</a></span><span>${a.cat}</span></nav>
<span class="pcard__origin">${a.cat}</span><h1>${a.title}</h1><div class="article__meta"><span>${a.date}</span><span>${a.read} đọc</span><span>Đội ngũ Mộc Quả</span></div>
<p class="article__lead">${a.excerpt}</p><img class="article__cover" src="${MQ.img(a.img)}" alt=""><div class="prose">${a.body.map(([k,t])=>(B[k]||B.p)(t)).join('')}</div>
<div class="share"><span>Chia sẻ:</span><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}" target="_blank" rel="noopener" aria-label="Facebook">f</a><a href="https://zalo.me/" target="_blank" rel="noopener" aria-label="Zalo"><svg><use href="#i-zalo"/></svg></a><button data-copy aria-label="Sao chép liên kết"><svg><use href="#i-share"/></svg></button></div>`;
const items=a.products.map(id=>MQ.byId(id)||MQ.giftById(id)).filter(Boolean);
$('[data-shop]').innerHTML=`<h4>Sản phẩm trong bài</h4><p class="small muted">Mua ngay những món được nhắc tới.</p>${items.map(p=>{const gift=!p.sizes;return `<div class="sp">${gift?`<div class="ci__img ci__img--gift" style="width:64px;height:64px;background:var(--ink)">${MQ.giftSvg(p.box,p.ribbon)}</div>`:`<img src="${MQ.img(p.img)}" alt="">`}<div><a href="${gift?'hop-qua.html#'+p.id:MQ.url(p)}"><b>${p.name}</b></a><small>${MQ.fmt(gift?p.price:p.sizes[0].p)} · giá demo</small><br><button data-add="${p.id}">+ Thêm vào giỏ</button></div></div>`}).join('')}`;
$('[data-more]').innerHTML=MQ.POSTS.filter(p=>p!==a).map(p=>MQ.postCard(p)).join('');
$('[data-copy]').addEventListener('click',()=>navigator.clipboard?.writeText(location.href).then(()=>MQ.toast('Đã sao chép liên kết'),()=>{}));MQ.reveal();
})();
