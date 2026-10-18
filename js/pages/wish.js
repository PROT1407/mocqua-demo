(function(){const MQ=window.MQ,{$}=MQ;
function draw(){const ps=MQ.wish.list().map(MQ.byId).filter(Boolean);$('[data-wgrid]').innerHTML=ps.map(p=>MQ.card(p)).join('');$('[data-wempty]').hidden=!!ps.length;$('.toolbar').hidden=!ps.length;$('[data-wcount]').innerHTML=`<b>${ps.length}</b> sản phẩm đã lưu`;}
document.addEventListener('mq:wish',()=>setTimeout(draw,50));
document.addEventListener('click',e=>{if(e.target.closest('[data-wall]')){MQ.wish.list().map(MQ.byId).filter(p=>p&&!p.soon).forEach(p=>MQ.cart.addProduct(p.id,null,1,true));MQ.toast('Đã thêm danh sách yêu thích vào giỏ');MQ.bump();MQ.openCart()}
 if(e.target.closest('[data-wshare]')){const u=location.href.split('?')[0]+'?ids='+MQ.wish.list().join(',');navigator.clipboard?.writeText(u).then(()=>MQ.toast('Đã sao chép liên kết danh sách'),()=>MQ.toast(u))}});
const ids=MQ.qs('ids');if(ids){ids.split(',').filter(MQ.byId).forEach(id=>{if(!MQ.wish.has(id))MQ.store.set('wish',[...MQ.wish.list(),id])});MQ.renderCounts()}
draw();})();
