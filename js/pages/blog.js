(function(){const MQ=window.MQ,{$,$$}=MQ;const cats=['Tất cả',...new Set(MQ.POSTS.map(p=>p.cat))];let c='Tất cả';
$('[data-bcats]').innerHTML=cats.map((x,i)=>`<button class="chip${i?'':' is-on'}" data-c="${x}">${x}</button>`).join('');
const draw=()=>{const ps=MQ.POSTS.filter(p=>c==='Tất cả'||p.cat===c);$('[data-blog]').innerHTML=ps.map((p,i)=>MQ.postCard(p,i===0&&c==='Tất cả')).join('');MQ.reveal()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b){c=b.dataset.c;$$('[data-c]').forEach(x=>x.classList.toggle('is-on',x===b));draw()}});draw()})();
