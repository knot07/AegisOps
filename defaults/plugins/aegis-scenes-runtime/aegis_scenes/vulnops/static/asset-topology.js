/* Asset ownership topology. Edges represent recorded ownership, never inferred network links. */
window.mountAssetTopology = function(root, records) {
 if(!root)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups=new Map();for(const a of records){const key=a.department||'未设置部门';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);}
 const palette=['#4275ec','#8ccf43','#a477db','#e4a33d','#35acac','#e07884'];
 const rings=Math.max(0,...[...groups.values()].map(list=>Math.floor((list.length-1)/8)));
 const fit=Math.min(.82,295/(365+rings*125));
 let collapsed=new Set(),selected=null,scale=fit,dx=0,dy=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,drag=null;
 const abort=new AbortController(),signal=abort.signal;
 // Cancel handlers when the route/filter replaces the canvas.
 const observer=new MutationObserver(()=>{if(!root.isConnected){abort.abort();observer.disconnect();}});observer.observe(root.parentNode,{childList:true});
 root.innerHTML=`<div class="topology-heading"><div><h2>资产归属拓扑</h2><p>资产目录 → 所属部门 → 业务资产 · 连线表示登记归属，不代表网络通信</p></div><span class="badge">${records.length} 项资产 · ${groups.size} 个部门</span></div><div class="topology-stage"><div class="topology-tools"><button type="button" data-topology="in" aria-label="放大拓扑">＋</button><button type="button" data-topology="out" aria-label="缩小拓扑">−</button><button type="button" data-topology="reset">重置</button><button type="button" data-topology="motion">${paused?'播放':'暂停'}</button></div><div class="topology-canvas" tabindex="0" aria-label="资产归属拓扑，可拖拽平移，使用按钮缩放"><svg viewBox="0 0 1200 740" role="group" aria-label="资产部门关系"><defs><radialGradient id="topology-core"><stop stop-color="#fff"/><stop offset=".7" stop-color="#f6f9f4"/><stop offset="1" stop-color="#cfe2b9"/></radialGradient><pattern id="topology-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#c2ccd0" opacity=".48"/></pattern></defs><rect width="1200" height="740" fill="url(#topology-dots)"/><g class="topology-transform"></g></svg></div><aside class="topology-inspector"><span class="eyebrow">ASSET CONTEXT</span><h3>选择资产节点</h3><p>点击部门展开或收起分支，点击资产查看风险与管理操作。</p><div class="topology-legend"><i style="background:#8ccf43"></i>无未关闭漏洞 <i style="background:#ed9d44"></i>存在待处理风险</div></aside><span class="topology-hint">拖拽空白平移 · 点击节点展开 · 可用 Tab 选择节点</span></div>`;
 const stage=root.querySelector('.topology-stage'),canvas=root.querySelector('.topology-canvas'),svg=canvas.querySelector('svg'),layer=root.querySelector('.topology-transform'),info=root.querySelector('.topology-inspector');
 const point=(angle,r,cx=600,cy=360)=>({x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r});
 const label=(v,n=13)=>String(v).length>n?String(v).slice(0,n)+'…':String(v);
 const ticks=(x,y,r,color)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-opacity=".23" stroke-width="5" stroke-dasharray="1 4"/>`;
 const flow=(path,color,delay=0)=>`<path class="topology-edge" d="${path}" fill="none" stroke="${color}" stroke-opacity=".38" stroke-width="1.5"/>`+[0,1.8].map(offset=>`<circle class="topology-flow" r="3" fill="${color}" opacity=".85"><animateMotion dur="3.6s" begin="${-delay-offset}s" repeatCount="indefinite" path="${path}" calcMode="paced"/></circle>`).join('');
 function syncMotion(){stage.classList.toggle('is-paused',paused);if(paused)svg.pauseAnimations();else svg.unpauseAnimations();const control=root.querySelector('[data-topology="motion"]');control.textContent=paused?'播放':'暂停';control.setAttribute('aria-pressed',String(!paused));control.setAttribute('aria-label',paused?'播放拓扑动画':'暂停拓扑动画');}
 function node(x,y,r,content,title,subtitle,color,attrs='') {return `<g class="topology-node" transform="translate(${x} ${y})" style="--node-color:${color}" ${attrs}><title>${esc(title)}</title><g class="topology-node-visual"><circle r="${r+8}" fill="#fff" fill-opacity=".3"/><circle r="${r}" fill="#fff" stroke="${color}" stroke-opacity=".22"/>${content}<text y="${r+24}" text-anchor="middle" class="node-title">${esc(label(title))}</text><text y="${r+40}" text-anchor="middle" class="node-sub">${esc(subtitle)}</text></g></g>`;}
 function draw(){
  let lines='',nodes='';const entries=[...groups];
  entries.forEach(([name,list],i)=>{
   const angle=-Math.PI/2+i*2*Math.PI/Math.max(entries.length,1),g=point(angle,220),color=palette[i%palette.length],fold=collapsed.has(name);
   lines+=flow(`M600 360 Q${(600+g.x)/2+25} ${(360+g.y)/2-20} ${g.x} ${g.y}`,color,i*.37);
   nodes+=ticks(g.x,g.y,40,color)+node(g.x,g.y,32,`<text text-anchor="middle" y="6" class="group-count" fill="${color}">${list.length}</text>`,name,fold?'已收起 · 点击展开':`${list.reduce((n,a)=>n+Number(a.open_count||0),0)} 项未关闭漏洞`,color,`role="button" tabindex="0" data-group="${esc(name)}" aria-label="${esc(name)}，${list.length} 项资产" aria-expanded="${!fold}"`);
   if(fold)return;
   list.forEach((a,j)=>{
    // Keep labels legible for larger departments by distributing nodes on successive rings.
    const ring=Math.floor(j/8),slot=j%8,count=Math.min(8,list.length-ring*8),spread=Math.min(1.25,2*Math.PI/Math.max(entries.length,2)*.8),theta=angle+(slot-(count-1)/2)*spread/Math.max(count-1,1),p=point(theta,365+ring*125),risk=Number(a.open_count||0)>0?'#e9a044':'#8ccf43';
    lines+=flow(`M${g.x} ${g.y} Q${(g.x+p.x)/2} ${g.y} ${p.x} ${p.y}`,color,i*.37+j*.23);
    const identity=assetIdentity(a).replace('<svg ', '<svg x="-13" y="-13" width="26" height="26" ');
    nodes+=node(p.x,p.y,23,`<g style="color:${assetIconColors[assetPalette(a).id]||color}">${identity}</g><circle cx="17" cy="-17" r="5" fill="${risk}" stroke="#fff" stroke-width="2"/>`,a.name,`${a.open_count||0} 未关闭 / ${a.total||0} 漏洞`,color,`role="button" tabindex="0" data-topology-asset="${a.id}" aria-label="${esc(a.name)}，${a.open_count||0} 项未关闭漏洞" aria-pressed="${selected===a.id}"`);
   });
  });
  layer.innerHTML=`<circle cx="600" cy="360" r="222" fill="none" stroke="#9cacb3" stroke-opacity=".12" stroke-dasharray="2 9"/><circle cx="600" cy="360" r="365" fill="none" stroke="#9cacb3" stroke-opacity=".1" stroke-dasharray="2 10"/>${lines}<circle class="topology-core-halo" cx="600" cy="360" r="55" fill="none" stroke="#91b76c" stroke-width="2"/>${ticks(600,360,59,'#7c9a60')}<circle cx="600" cy="360" r="48" fill="url(#topology-core)" stroke="#dbe4d4"/><text x="600" y="356" text-anchor="middle" class="core-count">${records.length}</text><text x="600" y="376" text-anchor="middle" class="node-sub">资产</text><text x="600" y="444" text-anchor="middle" class="node-title">资产目录</text>${nodes}`;
  apply();syncMotion();
 }
 function apply(){layer.setAttribute('transform',`translate(${dx} ${dy}) translate(600 360) scale(${scale}) translate(-600 -360)`);}
 function selectAsset(id){selected=id;const a=records.find(a=>a.id===id);if(!a)return;info.innerHTML=`<span class="eyebrow">ASSET CONTEXT</span><div class="topology-selected-icon" ${assetThemeAttrs(a)}>${assetIdentity(a)}</div><h3>${esc(a.name)}</h3><p>${esc(a.address)}</p><dl><dt>所属部门</dt><dd>${esc(a.department||'未设置')}</dd><dt>业务重要性</dt><dd>${esc(a.importance)}</dd><dt>关联漏洞</dt><dd>${a.total||0} 项</dd><dt>未关闭</dt><dd>${a.open_count||0} 项</dd></dl><button class="btn primary" data-asset="${a.id}">查看关联漏洞</button>${canManage()?`<button class="btn" data-edit-asset="${a.id}">编辑资产</button>`:''}`;draw();}
 root.addEventListener('click',e=>{const item=e.target.closest('[data-group],[data-topology-asset],[data-topology]');if(!item)return;if(item.dataset.group!==undefined){const name=item.dataset.group;collapsed.has(name)?collapsed.delete(name):collapsed.add(name);draw();for(const n of layer.querySelectorAll('[data-group]'))if(n.dataset.group===name)n.focus({preventScroll:true});}else if(item.dataset.topologyAsset)selectAsset(Number(item.dataset.topologyAsset));else{switch(item.dataset.topology){case'in':scale=Math.min(2.5,scale+.15);break;case'out':scale=Math.max(.35,scale-.15);break;case'reset':scale=fit;dx=dy=0;collapsed.clear();draw();break;case'motion':paused=!paused;syncMotion();break;}apply();}}, {signal});
 root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-group],[data-topology-asset]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}}, {signal});
 canvas.addEventListener('pointerdown',e=>{if(e.target.closest('[data-group],[data-topology-asset]'))return;drag={x:e.clientX,y:e.clientY,dx,dy};canvas.setPointerCapture(e.pointerId);},{signal});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const ratio=1200/svg.getBoundingClientRect().width;dx=drag.dx+(e.clientX-drag.x)*ratio;dy=drag.dy+(e.clientY-drag.y)*ratio;apply();},{signal});
 for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>drag=null,{signal});
 if(!records.length){root.innerHTML='<div class="empty"><h3>暂无可展示的资产</h3><p>添加资产或调整搜索条件后，拓扑将自动生成。</p></div>';observer.disconnect();return;}
 draw();
};
