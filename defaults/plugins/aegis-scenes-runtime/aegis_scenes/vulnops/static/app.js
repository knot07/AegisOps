'use strict';
const $ = (s, root = document) => root.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles = {admin:'系统管理员',security:'安全运营',owner:'整改负责人',viewer:'只读观察员'};
const levels = {critical:'严重',high:'高危',medium:'中危',low:'低危'};
const states = {new:'待分派',assigned:'待整改',fixing:'整改中',retest:'待复测',closed:'已关闭'};
const colors = {critical:'#cb736b',high:'#e2ab6b',medium:'#d9cf89',low:'#a4c67f'};
const paths = {
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 shield:'M12 3l8 3v6c0 5-8 9-8 9S4 17 4 12V6z M8 12l3 3 5-6',
 list:'M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01',
 check:'M9 11l3 3L22 4M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10',
 box:'M3 7l9-4 9 4v11l-9 4-9-4z M3 7l9 4 9-4M12 11v11',
 users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.9M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 plus:'M12 5v14M5 12h14', search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 download:'M12 3v12m-5-5 5 5 5-5M3 15v6h18v-6',
 arrow:'M5 12h14m-5-5 5 5-5 5', alert:'M12 3l10 18H2zM12 9v5m0 3h.01',
 calendar:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4', logout:'M9 21H3V3h6m5 4 5 5-5 5M8 12h13',
 refresh:'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 1M5 17a8 8 0 0 0 13 1',
 file:'M14 2H4v20h16V8zM14 2v6h6M8 13h8M8 17h6', lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4'
};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;}
const brand = `<div class="brand"><div class="brand-mark">V</div><div class="brand-word">VulnOps<small>漏洞运营平台</small></div></div>`;
let assetSearch='', me=null, users=[], assets=[], view=new URLSearchParams(location.search).get('view')||'overview', filter={}, page=1, auditPage=1, detail=null, modalReturn=null, lastFocus=null, loadVersion=0;
const canManage=()=>['admin','security'].includes(me?.role);
const canWrite=()=>me?.role!=='viewer';
const localDate=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());
const stamp=v=>v?new Date(v).toLocaleString('zh-CN',{hour12:false,timeZone:'Asia/Shanghai'}):'—';
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
async function api(url, options={}){
 const config={...options,headers:{'X-Requested-With':'VulnOps',...options.headers}};
 if(options.body && !(options.body instanceof FormData)){config.headers['Content-Type']='application/json';config.body=JSON.stringify(options.body);}
 const res=await fetch('/api/scenes/vulnops/api'+url,config);
 if(!res.ok){let data;try{data=await res.json();}catch{data={detail:await Promise.resolve('请求失败，请稍后重试')};}
  const message=Array.isArray(data.detail)?data.detail.map(x=>`${x.loc.slice(1).join('.')}: ${x.msg}`).join('；'):data.detail || '操作失败';
  if(res.status===401&&me){me=null;closeOverlay();auth(false);}
  throw new Error(message);
 }
 return res.json();
}
function level(v){return `<span class="badge severity-${esc(v)}"><i></i>${levels[v]||esc(v)}</span>`;}
function state(v){return `<span class="badge status-${esc(v)}">${states[v]||esc(v)}</span>`;}
function due(v){return v.overdue_days?`<span class="overdue">逾期 ${v.overdue_days} 天</span><small>${esc(v.due_date)}</small>`:`<span class="due">${esc(v.due_date)}</span>${v.status==='closed'?'<small>已完成复测</small>':''}`;}
function options(values, selected, placeholder){return `${placeholder?`<option value="">${placeholder}</option>`:''}`+Object.entries(values).map(([v,t])=>`<option value="${esc(v)}" ${String(v)===String(selected)?'selected':''}>${esc(t)}</option>`).join('');}
function ownerOptions(selected, optional=true){return options(Object.fromEntries(users.filter(u=>u.active&&u.role!=='viewer').map(u=>[u.id,`${u.name} · ${u.department||roles[u.role]}`])),selected,optional?'暂不分派':null);}
function empty(title,text,button=''){return `<div class="empty"><div class="empty-icon">${icon('shield')}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${button}</div>`;}
function btn(label,action,primary=false,ic='',extra=''){return `<button class="btn ${primary?'primary':''}" data-action="${action}" ${extra}>${ic?icon(ic):''}${label}</button>`;}
function auth(setup){
 $('#app').innerHTML=`<div class="auth"><aside class="auth-aside">${brand}<div class="auth-message"><div class="eyebrow">VISIBILITY. OWNERSHIP. RESOLUTION.</div><h1>看见每一处风险，<br>推动每一次<em>修复。</em></h1><p>从发现到复测，用一份清晰的漏洞台账，连接资产、责任人与整改进展。</p><div class="auth-flow"><span>发现风险</span>→<span>跟进整改</span>→<span>复测闭环</span></div></div><footer>VULNOPS / SECURITY OPERATIONS</footer></aside><main class="auth-form-wrap"><form class="auth-form" id="auth-form" data-setup="${setup}"><div class="eyebrow">${setup?'GET STARTED':'WELCOME BACK'}</div><h2>${setup?'创建你的运营空间':'登录工作空间'}</h2><p class="subtitle">${setup?'首次使用，请设置管理员账号。':'继续跟进漏洞与整改进度。'}</p><div class="error" role="alert"></div>${setup?'<label class="field">管理员姓名<input name="name" autocomplete="name" required maxlength="60" placeholder="你的姓名"></label>':''}<label class="field">账号<input name="username" autocomplete="username" required maxlength="60" placeholder="输入账号"></label><label class="field">密码<input name="password" type="password" autocomplete="${setup?'new-password':'current-password'}" required ${setup?'minlength="10"':''} maxlength="128" placeholder="${setup?'设置至少 10 位密码':'输入密码'}"></label><button class="btn primary" type="submit">${setup?'创建并进入系统':'登录系统'} ${icon('arrow')}</button><div class="auth-foot">${setup?'管理员可创建安全运营、整改负责人和只读账号。':'账号由系统管理员分配 · 会话有效期 8 小时'}</div></form></main></div>`;
 $('#auth-form input')?.focus();
}
async function boot(){try{try{me=await api('/me');await start();}catch{auth(false);}}catch(e){$('#app').innerHTML=empty('服务暂时不可用',e.message,btn('重试','reload',true));}}
async function start(){[users,assets]=await Promise.all([api('/users'),api('/assets')]);view=new URLSearchParams(location.search).get('view')||'overview';filter={};page=1;shell();await render();const vid=Number(new URLSearchParams(location.search).get('vulnerability'));if(vid>0)await showDetail(vid);}
function shell(){
 const nav=[['overview','grid','运营总览'],['ledger','shield','漏洞台账'],['remediation','check','整改工作台'],['assets','box','资产目录'],...(canManage()?[['audit','clock','操作审计']]:[])];
 $('#app').innerHTML=`<div class="shell"><aside class="sidebar">${brand}<div class="nav-label">WORKSPACE</div><nav>${nav.map(([id,ic,title])=>`<button class="nav-btn ${view===id?'active':''}" data-view="${id}" title="${title}">${icon(ic)}<span>${title}</span></button>`).join('')}</nav><div class="sidebar-bottom"><div class="workspace-note"><strong><i class="status-dot"></i>风险有记录，整改有闭环</strong>发现 → 分派 → 整改 → 复测<br>所有进展，都有迹可循。</div></div></aside><main class="main"><header class="topbar"><div class="crumb">安全工作空间 <span>/</span> <span id="crumb-title">运营总览</span></div><div class="profile"><div class="avatar">${esc(me.name.slice(0,1))}</div><div class="profile-text">${esc(me.name)}<small>${roles[me.role]}</small></div></div></header><div class="scene-tab-wrap"><nav class="scene-tabs" aria-label="漏洞运营功能">${nav.map(([id,ic,title])=>`<button type="button" class="scene-tab ${view===id?'active':''}" data-view="${id}" aria-pressed="${view===id}">${icon(ic)}<span>${title}</span></button>`).join('')}</nav></div><div class="content" id="content"></div></main></div>`;
}
function head(title,sub,actions='',eyebrow='SECURITY OPERATIONS'){return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><div class="subtitle">${sub}</div></div><div class="actions">${actions}</div></div>`;}
async function render(){
 if(view==='users')view='overview';
 const token=++loadVersion;
 document.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x.dataset.view===view);x.setAttribute('aria-pressed',String(x.dataset.view===view));});
 const url=new URL(location.href);url.searchParams.set('view',view);history.replaceState(history.state,'',url);
 parent.postMessage({type:'aegis:vuln-view',view},location.origin);

 const names={overview:'运营总览',ledger:'漏洞台账',remediation:'整改工作台',assets:'资产目录',audit:'操作审计'};
 $('#crumb-title').textContent=names[view];
 try{
  let html='';
  if(view==='overview') html=overview(await api('/dashboard'));
  if(['ledger','remediation'].includes(view)) html=ledger(await api('/vulnerabilities?'+query()));
  if(view==='assets'){assets=await api('/assets?q='+encodeURIComponent(assetSearch));html=assetPage();}
  if(view==='audit') html=auditView(await api('/audit?page='+auditPage));
  if(token!==loadVersion)return;
  $('#content').innerHTML=html+`<div class="footer-note"><span>VulnOps · 漏洞运营系统</span><span>统计范围：${me.role==='owner'?'分配给我的漏洞':'全部可访问漏洞'} · 业务日期按北京时间 · ${localDate()}</span></div>`;
 }catch(e){if(token===loadVersion&&$('#content'))$('#content').innerHTML=empty('加载失败',e.message,btn('重新加载','refresh',true));}
}
function metric(label,value,foot,ic,go,featured=false){return `<button class="metric ${featured?'featured':''}" data-go="${go}"><div class="metric-label">${label}${icon(ic)}</div><div class="metric-value">${value}<span>项</span></div><div class="metric-foot">${foot}</div></button>`;}
function trendChart(trend){
 const max=Math.max(2,...trend.flatMap(d=>[d.new,d.closed]));
 const total=trend.reduce((n,d)=>n+d.new,0),peak=Math.max(0,...trend.map(d=>d.new)),average=trend.length?total/trend.length:0;
 const xs=i=>38+i*(470/Math.max(1,trend.length-1)),ys=n=>164-n/max*136;
 const points=field=>trend.map((d,i)=>`${i?'L':'M'}${xs(i)} ${ys(d[field])}`).join(' ');
 return `<div class="vuln-trend-layout"><div class="vuln-trend-summary"><span>新增漏洞总量</span><strong>${total}<small>项</small></strong><div class="vuln-trend-facts"><div>峰值<b>${peak}</b></div><div>日均<b>${average.toFixed(1)}</b></div></div><span class="vuln-trend-period"><i></i>最近 14 天</span></div><div class="chart vuln-trend-chart">${trend.some(d=>d.new||d.closed)?`<svg viewBox="0 0 540 200" role="img" aria-label="最近14天新增漏洞与关闭漏洞数量"><title>近14天新增 ${total} 项，单日峰值 ${peak} 项</title><defs><linearGradient id="vuln-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a7da64" stop-opacity=".28"/><stop offset="100%" stop-color="#a7da64" stop-opacity="0"/></linearGradient></defs>${[0,1,2].map(n=>`<path class="grid" d="M30 ${ys(max*n/2)}H520"/><text x="8" y="${ys(max*n/2)+4}">${Number((max*n/2).toFixed(1))}</text>`).join('')}<path d="${points('new')} L${xs(trend.length-1)} 164 L38 164 Z" fill="url(#vuln-area)"/><path d="${points('new')}" fill="none" stroke="#91bf56" stroke-width="2.5"/><path d="${points('closed')}" fill="none" stroke="#425a39" stroke-width="2" stroke-dasharray="4 3"/>${trend.map((d,i)=>`<g><title>${d.date}：新增 ${d.new}，关闭 ${d.closed}</title><circle cx="${xs(i)}" cy="${ys(d.new)}" r="3" fill="#a7da64" stroke="#fff"/><circle cx="${xs(i)}" cy="${ys(d.closed)}" r="2" fill="#425a39"/>${i%3===0||i===trend.length-1?`<text x="${xs(i)}" y="188" text-anchor="middle">${d.date.slice(5)}</text>`:''}</g>`).join('')}</svg>`:'<div class="trend-empty">暂无趋势数据<small>登记漏洞后，自动展示发现与关闭趋势</small></div>'}<div class="chart-caption"><span>新增按发现日期 · 关闭按当前关闭日期</span></div></div></div>`;
}

function overview(d){
 let angle=0;const stops=Object.entries(d.severity).map(([s,n])=>{const start=angle;angle+=d.open?n/d.open*100:0;return `${colors[s]} ${start}% ${angle}%`;}).join(',');
 return head('运营总览','掌握风险全貌，让每一项整改都有进展。',`<span class="date-pill">${icon('calendar')}${localDate()}</span>${btn('导出台账','export',false,'download')}${canManage()?btn('登记漏洞','new-vuln',true,'plus'):''}`,'OVERVIEW / 风险与整改')+
 `<div class="metric-grid">${metric('累计登记漏洞',d.total,`<b>${d.closed} 项已关闭</b> 覆盖全生命周期`,'shield','all',true)}${metric('未关闭高危 / 严重',d.critical_high,'优先推进高风险漏洞整改','alert','high')}${metric('逾期未关闭',d.overdue,`<b class="warn">${d.overdue?'需要关注':'当前无逾期'}</b> 超过整改截止日`,'clock','overdue')}${metric('等待安全复测',d.retest,'整改已提交，等待验证结果','check','retest')}</div>`+
 (d.overdue?`<div class="attention">${icon('alert')}<span>有 <b>${d.overdue}</b> 项漏洞已超过整改期限，请及时跟进责任人；待复测漏洞仍计入未关闭风险。</span><button data-go="overdue">查看逾期 ${icon('arrow')}</button></div>`:'')+
 (!d.total?`<div class="attention">${icon('shield')}<span>${canManage()?'从添加资产和整改负责人开始，再登记第一条漏洞。系统不会预填示例数据。':'当前暂无可访问的漏洞记录。'}</span>${canManage()?'<button data-action="new-asset">添加资产 →</button>':''}</div>`:'')+
 `<div class="overview-content"><section class="panel vuln-trend-panel"><div class="panel-head"><div><h2>漏洞发现与关闭趋势</h2><div class="panel-sub">持续跟踪风险流入与整改产出</div></div><div class="legend"><span><i style="background:#a5cd7f"></i>新增</span><span><i style="background:#6a8f48"></i>关闭</span></div></div>${trendChart(d.trend)}</section><section class="panel"><div class="panel-head"><div><h2>当前风险分布</h2><div class="panel-sub">仅统计未关闭漏洞</div></div><span class="badge status-new">${d.open} 项风险</span></div><div class="risk-body"><div class="donut" style="background:${d.open?'conic-gradient('+stops+')':'#eef2e9'}"><div class="donut-value">${d.open}<small>未关闭漏洞</small></div></div><div class="risk-legend">${Object.entries(d.severity).map(([s,n])=>`<div class="risk-row"><i style="background:${colors[s]}"></i>${levels[s]}<b>${n}</b><small>${d.open?Math.round(n/d.open*100):0}%</small></div>`).join('')}</div></div><div class="risk-note"><span>累计关闭率 <b>${d.close_rate}%</b></span><span>平均关闭周期 <b>${d.avg_days===null?'—':d.avg_days+' 天'}</b></span></div></section>`+
 `<section class="panel priority-panel"><div class="panel-head"><div><h2>优先跟进</h2><div class="panel-sub">按整改期限排序，先处理临近与逾期风险</div></div><button class="table-link" data-go="all">全部漏洞 →</button></div>${d.urgent.length?`<div class="table-wrap"><table><thead><tr><th>漏洞 / 资产</th><th>风险等级</th><th>责任人</th><th>整改期限</th></tr></thead><tbody>${d.urgent.map(v=>`<tr><td><button class="vuln-title" data-detail="${v.id}">${esc(v.title)}</button><small>${esc(v.code)} · ${esc(v.asset_name)}</small></td><td>${level(v.severity)}</td><td>${esc(v.owner_name||'待分派')}</td><td>${due(v)}</td></tr>`).join('')}</tbody></table></div>`:empty('暂无待跟进风险','新增漏洞后，可在这里查看优先整改事项。')}</section><section class="panel"><div class="panel-head"><div><h2>部门整改进展</h2><div class="panel-sub">按资产所属部门统计</div></div><span class="badge status-new">关闭 / 总量</span></div><div class="departments">${d.departments.length?d.departments.slice(0,5).map(x=>`<div class="department"><div class="department-top"><span>${esc(x.name)}</span><small>${x.closed} / ${x.total}</small></div><div class="progress"><span style="width:${x.total?x.closed/x.total*100:0}%"></span></div><div class="department-foot"><span>关闭率 ${Math.round(x.closed/x.total*100)}%</span><span>${x.overdue?'逾期 '+x.overdue+' 项':'无逾期'}</span></div></div>`).join(''):empty('暂无部门数据','登记资产时设置所属部门。')}</div></section></div>`;
}
function query(){return new URLSearchParams({...filter,page,page_size:10}).toString();}
function ledger(d){
 const remedy=view==='remediation';
 const activeAsset=filter.asset_id?assets.find(a=>String(a.id)===String(filter.asset_id)):null;
 return head(remedy?'整改工作台':'漏洞台账',remedy?'明确责任、跟进修复、完成复测，推动漏洞闭环。':`集中管理漏洞记录，共 ${d.total} 条符合当前筛选条件。`,`${btn('导出当前结果','export',false,'download')}${canManage()?btn('登记漏洞','new-vuln',true,'plus'):''}`,remedy?'REMEDIATION / 闭环跟踪':'REGISTER / 风险档案')+
 (activeAsset?`<div class="attention"><span>当前资产：${esc(activeAsset.name)}</span><button data-action="reset-filter">清除资产筛选</button></div>`:'')+
 (remedy?'<div class="workflow"><b>01 待分派</b>→<b>02 待整改</b>→<b>03 整改中</b>→<b>04 待复测</b>→<b>05 已关闭</b><span>复测未通过将退回整改</span></div>':'')+
 `<section class="panel"><div class="tabs"><button class="tab ${!filter.status?'active':''}" data-status="">全部记录</button>${Object.entries(states).map(([s,n])=>`<button class="tab ${filter.status===s?'active':''}" data-status="${s}">${n}</button>`).join('')}</div><form class="toolbar" id="filter-form"><label class="search">${icon('search')}<input name="q" value="${esc(filter.q||'')}" placeholder="搜索漏洞名称、编号、资产或 CVE" aria-label="搜索漏洞"></label><select name="severity" aria-label="风险等级">${options({...levels,critical_high:'未关闭高危 / 严重'},filter.severity,'全部风险等级')}</select><select name="owner_id" aria-label="责任人">${options(Object.fromEntries(users.map(u=>[u.id,u.name])),filter.owner_id,'全部责任人')}</select><label class="check-label"><input type="checkbox" name="overdue" ${filter.overdue?'checked':''}>仅逾期</label>${me.role!=='owner'?`<label class="check-label"><input type="checkbox" name="mine" ${filter.mine?'checked':''}>分配给我</label>`:''}<button class="btn small" type="submit">查询</button><button class="text-btn" type="button" data-action="reset-filter">重置</button></form><div class="table-wrap ledger-scroll"><table><thead><tr><th>漏洞名称 / 编号</th><th>风险等级</th><th>关联资产</th><th>责任人</th><th>状态</th><th>整改期限</th><th>操作</th></tr></thead><tbody>${d.items.map(v=>`<tr><td><button class="vuln-title" data-detail="${v.id}">${esc(v.title)}</button><small>${v.code} · ${esc(v.category)}</small></td><td>${level(v.severity)}</td><td>${esc(v.asset_name)}<small>${esc(v.department||'未设置部门')}</small></td><td>${esc(v.owner_name||'待分派')}</td><td>${state(v.status)}</td><td>${due(v)}</td><td><button class="table-link" data-detail="${v.id}">查看详情 →</button></td></tr>`).join('')}</tbody></table>${!d.items.length?empty('暂无符合条件的漏洞','调整筛选条件，或登记一条新漏洞。'):''}</div><div class="pagination"><span>共 ${d.total} 条 · 每页 10 条</span><div class="actions"><button class="btn small" data-page="${page-1}" ${page<=1?'disabled':''}>上一页</button><span>${page} / ${Math.max(1,Math.ceil(d.total/10))}</span><button class="btn small" data-page="${page+1}" ${page*10>=d.total?'disabled':''}>下一页</button></div></div></section>`;
}
function assetPage(){return head('资产目录','将每一项风险关联到明确的业务系统与所属部门。',canManage()?btn('添加资产','new-asset',true,'plus'):'','ASSETS / 风险归属')+`<form id="asset-filter-form" class="asset-search-bar"><label class="field"><span>搜索资产</span><div class="asset-search-input">${icon('search')}<input type="search" name="q" maxlength="200" value="${esc(assetSearch)}" placeholder="搜索资产名称、域名 / IP、所属部门" aria-label="搜索资产"></div></label><button type="submit" class="btn primary">${icon('search')}查询</button><button type="button" class="btn" data-action="reset-assets">${icon('refresh')}重置</button><span class="asset-result-count">共 ${assets.length} 项资产</span></form><div class="asset-grid">${assets.map(a=>`<article class="asset-card"><div class="asset-top"><div class="asset-icon">${icon('box')}</div><span class="badge ${a.importance==='核心'?'severity-high':'status-new'}">${esc(a.importance)}资产</span></div><h3>${esc(a.name)}</h3><div class="asset-address">${esc(a.address)}</div><div class="asset-meta"><span>${esc(a.department||'未设置部门')}</span><span>累计 ${a.total} 项漏洞</span></div><div class="asset-stats"><span><b>${a.open_count}</b>未关闭</span><div class="asset-card-actions">${canManage()?`<button type="button" class="table-link asset-edit" data-edit-asset="${a.id}">编辑</button><button type="button" class="table-link asset-delete" data-delete-asset="${a.id}">删除</button>`:''}<button type="button" class="table-link" data-asset="${a.id}">查看漏洞 →</button></div></div></article>`).join('')}</div>${!assets.length?empty(assetSearch?'未找到匹配资产':'先建立资产目录',assetSearch?'试试其他名称、地址或部门，或者重置搜索。':'添加业务系统、服务器或应用，为漏洞记录确定归属。',!assetSearch&&canManage()?btn('添加第一个资产','new-asset',true,'plus'):''):''}`;}

function auditView(d){return head('操作审计','保留关键操作与处理说明，让漏洞整改过程可追溯。',btn('刷新记录','refresh',false,'refresh'),'AUDIT / 操作留痕')+`<section class="panel"><div class="table-wrap"><table><thead><tr><th>时间 / 操作人</th><th>操作</th><th>关联漏洞</th><th>记录内容</th></tr></thead><tbody>${d.items.map(e=>`<tr><td>${stamp(e.created_at)}<small>${esc(e.actor)}</small></td><td>${esc(e.action)}</td><td>${e.vuln_id?`<button class="table-link" data-detail="${e.vuln_id}">VUL-${String(e.vuln_id).padStart(5,'0')}</button>`:'—'}</td><td><div class="audit-note">${esc(e.note)}</div></td></tr>`).join('')}</tbody></table></div><div class="pagination"><span>共 ${d.total} 条操作记录</span><div class="actions"><button class="btn small" data-audit-page="${auditPage-1}" ${auditPage<=1?'disabled':''}>上一页</button><span>${auditPage} / ${Math.max(1,Math.ceil(d.total/30))}</span><button class="btn small" data-audit-page="${auditPage+1}" ${auditPage*30>=d.total?'disabled':''}>下一页</button></div></div></section>`;}

function openOverlay(html){if(!$('#overlay').innerHTML)lastFocus=document.activeElement;$('#overlay').innerHTML=html;document.body.style.overflow='hidden';$('#app').inert=true;requestAnimationFrame(()=>$('#overlay input:not([type=hidden]),#overlay textarea,#overlay select,#overlay button')?.focus());}
function closeOverlay(){const returnId=modalReturn;modalReturn=null;$('#overlay').innerHTML='';document.body.style.overflow='';$('#app').inert=false;if(returnId&&me){showDetail(returnId);return;}lastFocus?.focus?.();}
function modal(title,body,formId,submit='保存',subtitle=''){
 openOverlay(`<div class="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-head"><div><h2 id="modal-title">${title}</h2>${subtitle?`<div class="subtitle">${subtitle}</div>`:''}</div><button class="close-btn" data-action="close" aria-label="关闭">×</button></header><form id="${formId}" class="modal-body"><div class="error" role="alert"></div>${body}<div class="modal-footer"><button class="btn" type="button" data-action="close">取消</button><button class="btn primary" type="submit">${submit}</button></div></form></section></div>`);
}
function field(label,name,value='',extra='',type='text'){return `<label class="field">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;}
function area(label,name,value='',extra=''){return `<label class="field full">${label}<textarea name="${name}" ${extra}>${esc(value)}</textarea></label>`;}
async function vulnForm(edit=false){
 [assets,users]=await Promise.all([api('/assets'),api('/users')]);
 if(!assets.length){toast('请先添加一个关联资产');assetForm();return;}
 const v=edit?detail:{severity:'high',category:'配置缺陷',source:'人工排查',discovered_at:localDate()};
 modalReturn=edit?v.id:null;
 modal(edit?'编辑漏洞信息':'登记漏洞',`<div class="form-grid"><div class="full">${field('漏洞名称 *','title',v.title,'required minlength="3" maxlength="160" placeholder="例如：管理后台存在未授权访问"')}</div><label class="field">风险等级 *<select name="severity">${options(levels,v.severity)}</select></label><label class="field">漏洞类型 *<input name="category" list="categories" value="${esc(v.category)}" required maxlength="80"><datalist id="categories">${['配置缺陷','访问控制','SQL 注入','跨站脚本','组件漏洞','信息泄露','弱口令','文件上传','其他'].map(c=>`<option value="${c}">`).join('')}</datalist></label><label class="field">关联资产 *<select name="asset_id" required>${options(Object.fromEntries(assets.map(a=>[a.id,a.name])),v.asset_id,'选择资产')}</select></label><label class="field">发现来源 *<select name="source">${options(Object.fromEntries(['人工排查','漏洞扫描','渗透测试','代码审计','外部通报','应急响应','其他'].map(s=>[s,s])),v.source)}</select></label>${field('发现日期 *','discovered_at',v.discovered_at,'required max="'+localDate()+'"','date')}${field('整改截止日期','due_date',v.due_date,'','date')}<label class="field full">整改负责人<select name="owner_id" ${edit?'disabled':''}>${ownerOptions(v.owner_id)}</select><small>${edit?'变更责任人请使用分派操作。':'可以稍后分派，未分派的漏洞进入“待分派”状态。'}</small></label>${field('CVE / 外部编号','cve',v.cve,'maxlength="100" placeholder="选填"')}${field('受影响位置 / URL','location',v.location,'maxlength="1000" placeholder="选填：路径、端口或组件版本"')}${area('漏洞描述与影响 *','description',v.description,'required minlength="3" maxlength="20000" placeholder="记录漏洞现象、影响范围和复现条件"')}${area('修复建议','recommendation',v.recommendation,'maxlength="10000" placeholder="建议的修复方式和验收标准"')}${edit?area('修改原因 *','reason','','required minlength="3" maxlength="2000" placeholder="说明本次修改的原因，变更将保留记录"'):''}</div><div class="hint">不填写截止日期时，按发现日期计算：严重 1 天、高危 7 天、中危 30 天、低危 90 天。历史漏洞可能登记时已逾期。证据附件可在保存后上传。</div>`,edit?'edit-vuln-form':'vuln-form',edit?'保存修改':'登记漏洞');
}
function assetForm(id=null){const a=id?assets.find(item=>item.id===id):null;if(id&&!a){toast('资产不存在，请刷新重试');return;}modal(a?'编辑资产':'添加资产',`<div class="form-grid">${a?`<input type="hidden" name="asset_id" value="${a.id}">`:''}<div class="full">${field('资产名称 *','name',a?.name||'','required maxlength="100" placeholder="如：统一身份认证平台"')}</div><div class="full">${field('域名 / IP / 资产标识 *','address',a?.address||'','required maxlength="300" placeholder="如：auth.example.internal"')}</div>${field('所属部门','department',a?.department||'','maxlength="80" placeholder="如：平台研发部"')}<label class="field">业务重要性<select name="importance">${options({'普通':'普通','重要':'重要','核心':'核心'},a?.importance||'普通')}</select></label></div>${a?'<div class="hint">修改后保留原资产与所有关联漏洞。</div>':''}`,a?'edit-asset-form':'asset-form',a?'保存修改':'添加资产');}

function passwordForm(){modal('修改密码',`${field('原密码','old_password','','required autocomplete="current-password" maxlength="128"','password')}${field('新密码','new_password','','required minlength="10" maxlength="128" autocomplete="new-password" placeholder="至少 10 位"','password')}<div class="hint">修改后会注销当前账号的全部会话，请使用新密码重新登录。</div>`,'password-form','更新密码');}
async function showDetail(id){
 const v=await api('/vulnerabilities/'+id);detail=v;modalReturn=null;
 const df=(label,value)=>`<div class="detail-field"><small>${label}</small><span>${esc(value||'—')}</span></div>`;
 const ownSubmit=v.last_submitter===me.id;
 const action=(name,label,primary=false)=>btn(label,'workflow',primary,'',`data-workflow="${name}"`);
 let actions='';
 if(canManage()&&!['closed','retest'].includes(v.status))actions+=action('assign',v.owner_id?'转派责任人':'分派责任人');
 if(canWrite()&&v.status==='assigned')actions+=action('start','开始整改',true);
 if(canWrite()&&['assigned','fixing'].includes(v.status))actions+=action('submit','提交整改 · 申请复测',true);
 if(canManage()&&v.status==='retest'&&!ownSubmit)actions+=action('pass','复测通过 · 关闭',true)+action('reject','复测未通过');
 if(canManage()&&v.status==='closed')actions+=action('reopen','重新打开');
 if(canManage()&&v.status!=='closed')actions+=btn('编辑信息','edit-vuln');
 if(canWrite())actions+=action('comment','补充记录');
 openOverlay(`<div class="backdrop drawer-wrap"><section class="drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title"><header class="drawer-head"><div><span class="code">${v.code} / VULNERABILITY RECORD</span><h2 id="detail-title">${esc(v.title)}</h2><div class="detail-badges">${level(v.severity)}${state(v.status)}${v.overdue_days?`<span class="badge severity-high">逾期 ${v.overdue_days} 天</span>`:''}</div></div><button class="close-btn" data-action="close" aria-label="关闭">×</button></header><div class="drawer-body"><div class="detail-grid">${df('关联资产',v.asset_name)}${df('所属部门',v.department)}${df('整改负责人',v.owner_name||'待分派')}${df('发现日期',v.discovered_at)}${df('整改期限',v.due_date)}${df('漏洞来源',v.source)}${df('漏洞类型',v.category)}${df('外部编号',v.cve)}${df('关闭时间',v.closed_at?stamp(v.closed_at):'—')}</div>${v.location?`<section class="detail-section"><h3>受影响位置</h3><div class="prose">${esc(v.location)}</div></section>`:''}<section class="detail-section"><h3>漏洞描述与影响</h3><div class="prose">${esc(v.description)}</div></section><section class="detail-section"><h3>修复建议</h3><div class="prose">${esc(v.recommendation||'尚未填写修复建议')}</div></section>${actions?`<div class="detail-actions">${actions}</div>`:''}${v.status==='retest'&&ownSubmit&&canManage()?'<div class="hint">你已提交本次整改，请由另一位安全运营人员或管理员完成复测。</div>':''}<section class="detail-section"><div class="actions" style="justify-content:space-between;margin-bottom:15px"><h3 style="margin:0">证据附件 <small>(${v.attachments.length})</small></h3>${canWrite()?btn('上传证据','upload',false,'plus'):''}<input type="file" id="evidence-file" class="hidden" accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.log,.csv,.docx,.xlsx,.zip"></div>${v.attachments.length?v.attachments.map(a=>`<div class="attachment"><a href="/api/scenes/vulnops/api/attachments/${a.id}" download>${icon('file')} ${esc(a.filename)}</a><small>${(a.size/1024).toFixed(1)} KB · ${esc(a.actor)}</small></div>`).join(''):'<div class="hint">尚未上传证据。可上传漏洞截图、整改说明和复测记录，单个文件最大 10 MB。</div>'}</section><section class="detail-section"><h3>处理时间线</h3><div class="timeline">${v.events.map(e=>`<div class="timeline-item"><div class="timeline-top"><b>${esc(e.action)}</b><small>${stamp(e.created_at)}</small></div><div class="timeline-actor">${esc(e.actor)}</div><div class="timeline-note">${esc(e.note)}</div></div>`).join('')}</div></section></div></section></div>`);
}
function actionForm(action){
 const labels={assign:'分派责任人',start:'开始整改',submit:'提交整改',pass:'复测通过',reject:'复测未通过',reopen:'重新打开漏洞',comment:'补充处理记录'};
 const tips={assign:'记录分派原因和整改要求。',start:'确认开始处理该漏洞，状态将更新为“整改中”。',submit:'填写实际整改措施、修复范围和验证结果，可先在详情中上传证据。提交后进入“待复测”。',pass:'请填写复测方式、验证结果和复测范围。通过后漏洞关闭。',reject:'请说明仍存在的问题与补充整改要求，漏洞将退回“整改中”。',reopen:'填写重新打开的原因。原整改期限保留，需要调整时可编辑漏洞信息。',comment:'补充沟通、进展或处置记录，不改变漏洞状态。'};
 modalReturn=detail.id;
 modal(labels[action],`<input type="hidden" name="action" value="${action}"><div class="hint">${tips[action]}</div>${action==='assign'?`<label class="field">整改负责人 *<select name="owner_id" required>${ownerOptions(detail.owner_id,false)}</select></label>`:''}${area(action==='start'?'处理说明（可选）':'处理说明 *','note','',`${action==='start'?'':'required minlength="3"'} maxlength="10000" placeholder="${tips[action]}"`)}`,'action-form',labels[action]);
}
async function navigate(name){view=name;filter={};page=1;auditPage=1;await render();window.scrollTo(0,0);}
document.addEventListener('click',async e=>{
 const el=e.target.closest('button,a');if(!el||el.disabled)return;
 try{
  if(el.dataset.view)return await navigate(el.dataset.view);
  if(el.dataset.detail)return await showDetail(Number(el.dataset.detail));
  if(el.dataset.go){view='ledger';filter={};page=1;const go=el.dataset.go;if(go==='overdue')filter.overdue='true';if(go==='retest')filter.status='retest';if(go==='high')filter.severity='critical_high';return await render();}
  if(el.dataset.deleteAsset){const a=assets.find(item=>item.id===Number(el.dataset.deleteAsset));if(!a)return;modal('删除资产',`<input type="hidden" name="asset_id" value="${a.id}"><p class="asset-delete-name">${esc(a.name)}</p><p class="subtitle">${esc(a.address)}</p><div class="hint">确定删除此资产？删除后不可恢复；有关联漏洞的资产会被保护，需先将漏洞关联到其他资产。</div>`,'delete-asset-form','确认删除');return;}
  if(el.dataset.editAsset)return assetForm(Number(el.dataset.editAsset));
  if(el.dataset.asset){view='ledger';filter={asset_id:el.dataset.asset};page=1;return await render();}
  if(el.hasAttribute('data-status')){if(el.dataset.status)filter.status=el.dataset.status;else delete filter.status;page=1;return await render();}
  if(el.dataset.page){page=Number(el.dataset.page);return await render();}
  if(el.dataset.auditPage){auditPage=Number(el.dataset.auditPage);return await render();}
  switch(el.dataset.action){
   case 'reload':return location.reload();
   case 'refresh':return await render();
   case 'close':return closeOverlay();
   case 'new-vuln':return await vulnForm();
   case 'edit-vuln':return await vulnForm(true);
   case 'new-asset':return assetForm();
   case 'reset-assets':assetSearch='';return await render();
   case 'password':return passwordForm();
   case 'logout':await api('/logout',{method:'POST'});me=null;return auth(false);
   case 'workflow':return actionForm(el.dataset.workflow);
   case 'upload':return $('#evidence-file').click();
   case 'reset-filter':filter={};page=1;return await render();
   case 'export':{const q=['ledger','remediation'].includes(view)?new URLSearchParams(filter).toString():'';const res=await fetch('/api/scenes/vulnops/api/export?'+q);if(!res.ok)throw new Error('导出失败，请重新登录后重试');const url=URL.createObjectURL(await res.blob());const a=document.createElement('a');a.href=url;a.download=`漏洞台账-${localDate()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return toast('已导出当前权限范围内的台账');}
  }
 }catch(err){toast(err.message);}
});
document.addEventListener('submit',async e=>{
 const form=e.target;e.preventDefault();const data=Object.fromEntries(new FormData(form));const error=$('.error',form);if(error)error.textContent='';const submit=$('[type=submit]',form);if(submit)submit.disabled=true;
 try{
  if(form.id==='auth-form'){
   if(form.dataset.setup==='true')await api('/setup',{method:'POST',body:{...data,role:'admin'}});
   me=await api('/login',{method:'POST',body:{username:data.username,password:data.password}});await start();return;
  }
  if(form.id==='filter-form'){const preserved=filter.status;const assetId=filter.asset_id;filter={};if(assetId)filter.asset_id=assetId;for(const [k,v]of Object.entries(data))if(v)filter[k]=['mine','overdue'].includes(k)?'true':v;if(preserved)filter.status=preserved;page=1;await render();return;}
  if(form.id==='asset-filter-form'){assetSearch=String(data.q||'').trim();await render();return;}
  let reopen=null,message='保存成功';
  if(['vuln-form','edit-vuln-form'].includes(form.id)){
   data.asset_id=Number(data.asset_id);data.owner_id=data.owner_id?Number(data.owner_id):null;data.due_date=data.due_date||null;
   if(form.id==='edit-vuln-form'){data.owner_id=detail.owner_id;data.version=detail.version;await api('/vulnerabilities/'+detail.id,{method:'PUT',body:data});reopen=detail.id;}
   else{const r=await api('/vulnerabilities',{method:'POST',body:data});reopen=r.id;message='漏洞已登记';}
  }
  if(form.id==='delete-asset-form'){await api('/assets/'+Number(data.asset_id),{method:'DELETE'});message='资产已删除';}
  if(form.id==='edit-asset-form'){const id=Number(data.asset_id);delete data.asset_id;await api('/assets/'+id,{method:'PUT',body:data});assets=await api('/assets');message='资产已更新';}
  if(form.id==='asset-form'){await api('/assets',{method:'POST',body:data});assets=await api('/assets');message='资产已添加，可继续登记漏洞';}
  if(form.id==='password-form'){await api('/password',{method:'POST',body:data});modalReturn=null;closeOverlay();me=null;auth(false);toast('密码已修改，请重新登录');return;}
  if(form.id==='action-form'){data.version=detail.version;if(data.owner_id)data.owner_id=Number(data.owner_id);await api('/vulnerabilities/'+detail.id+'/actions',{method:'POST',body:data});reopen=detail.id;message='处理结果已记录';}
  modalReturn=null;closeOverlay();await render();if(reopen)await showDetail(reopen);toast(message);
 }catch(err){if(error&&error.isConnected)error.textContent=err.message;else toast(err.message);}
 finally{if(submit&&submit.isConnected)submit.disabled=false;}
});
document.addEventListener('change',async e=>{
 if(e.target.id!=='evidence-file'||!e.target.files.length)return;
 const file=e.target.files[0];if(file.size>10*1024*1024){toast('单个附件不能超过 10 MB');e.target.value='';return;}
 const data=new FormData();data.append('file',file);const uploadBtn=$('[data-action=upload]');if(uploadBtn)uploadBtn.disabled=true;
 try{await api('/vulnerabilities/'+detail.id+'/attachments',{method:'POST',body:data});await showDetail(detail.id);toast('证据已上传');}catch(err){toast(err.message);}finally{if(uploadBtn?.isConnected)uploadBtn.disabled=false;e.target.value='';}
});
document.addEventListener('keydown',e=>{
 if(!$('#overlay').innerHTML)return;
 if(e.key==='Escape'){e.preventDefault();closeOverlay();}
 if(e.key==='Tab'){const items=[...$('#overlay').querySelectorAll('button:not(:disabled),a[href],input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(x=>x.offsetParent!==null);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
boot();
