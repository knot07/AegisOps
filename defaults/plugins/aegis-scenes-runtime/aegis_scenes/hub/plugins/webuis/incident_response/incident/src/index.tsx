import React,{useEffect,useState,useRef} from 'react';
import {Markdown} from '@aegisops/webui-contract-sdk';

const incidentUiEnglish:Record<string,string>={"待启动":"Not started","待调查":"Queued","调查中":"Investigating","已归档":"Archived","执行中":"Running","待复核":"Pending review","执行失败":"Failed","已中断":"Interrupted","完成":"Completed","待配置":"Needs setup","部分完成":"Partially completed","已提交":"Submitted","待执行":"Pending","全部事件":"All events","调查进行中":"In progress","异常 / 中断":"Failed / interrupted","勒索攻击":"Ransomware","恶意程序":"Malware","漏洞利用":"Exploitation","身份攻击":"Credential attack","横向移动":"Lateral movement","数据外传":"Data exfiltration","钓鱼攻击":"Phishing","外联通信":"External communication","扫描探测":"Reconnaissance","其他事件":"Other","来源 IP":"Source IP","目标 IP":"Destination IP","来源待核实":"Source unverified","到":"to","应急响应 Logo":"Incident response logo","应急响应工作台":"Incident response","从确认告警到证据链，让每一步调查都有依据。":"From confirmed alerts to evidence-backed investigations.","工作流 + AI 分析":"Workflows + AI analysis","新增事件":"New incident","主机与连接":"Hosts & connections","刷新":"Refresh","响应事件":"Incidents","等待复核":"Pending review","登记主机":"Registered hosts","响应事件台账":"Incident register","事件状态":"Incident status","搜索响应事件":"Search incidents","搜索事件名称、编号或来源 / 目标 IP":"Search name, ID, source or destination IP","筛选事件类型":"Filter incident types","全部事件类型":"All incident types","重置筛选":"Reset filters","事件名称 / 编号":"Incident / ID","事件类型":"Type","来源 → 目标":"Source → Destination","状态":"Status","登记时间":"Registered at","操作":"Actions","查看详情":"View details","正在加载响应事件…":"Loading incidents…","没有符合筛选条件的事件。":"No matching incidents.","暂无事件，可通过「新增事件」登记，或从正式告警发起调查。":"No incidents yet. Register one using New incident.","上一页":"Previous","下一页":"Next","返回事件台账":"Back to incidents","事件调查":"Investigation","调查功能":"Investigation stages","调查动态":"Activity","设备关联":"Device correlation","主机排查":"Host investigation","样本与逆向":"Samples & analysis","沙箱分析":"Sandbox analysis","响应报告":"Response report","事件操作":"Incident actions","更新状态":"Update status","导出报告":"Export report","删除事件":"Delete incident","来源设备":"Source device","尚未明确来源设备":"Source device not selected","变更来源":"Change source","明确来源设备":"Select source device","演示事件 · 仅预览流程，不查询真实设备、不上机、不上传样本。":"Demo incident · preview only. No real devices, hosts or sample uploads.","刷新关联日志":"Refresh correlation","尚未绑定来源设备":"No source device selected","更换设备":"Change device","选择设备":"Select device","查询关联日志":"Query related logs","查询记录与异常":"Query history and errors","查询范围说明":"Query scope","主机与调查连接":"Hosts and investigation connections","正在加载事件详情…":"Loading incident details…","无法打开此事件":"Could not open incident","可返回事件台账，或刷新后重试。":"Return to the register or refresh to retry.","正在读取调查记录和证据。":"Loading investigation records and evidence.","已登记":"Registered","未配置密钥":"No key configured","尚未配置":"Not configured","已配置密钥":"Key configured","关闭":"Close","取消":"Cancel","保存":"Save","报告":"Report","查看报告":"View report","应急响应报告详情":"Incident report details","调查结论":"Findings","暂无报告":"No report yet","生成报告":"Generate report","按时间倒序 · 相邻重复记录合并显示":"Newest first · consecutive duplicates grouped","收起记录":"Collapse records","暂无调查记录":"No investigation records","操作人：":"Actor: ","系统":"System","已下载":"Downloaded"};
const incidentLocale=()=>document.documentElement.lang.toLowerCase().startsWith('en');
function ui(text:string){return incidentLocale()?incidentUiEnglish[text]||text:text;}
function useIncidentLocale(){const [english,setEnglish]=useState(incidentLocale);useEffect(()=>{const observer=new MutationObserver(()=>setEnglish(incidentLocale()));observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});return()=>observer.disconnect()},[]);return english;}
const BASE='/api/scenes/incident';
async function req(path:string,data?:any,method='POST'){const r=await fetch(BASE+path,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...(data===undefined?{}:{method,body:JSON.stringify(data)})});const b=await r.json();if(!r.ok)throw Error(b.detail||'操作未完成');return b;}
const labels:Record<string,string>={new:'待启动',queued:'待调查',investigating:'调查中',closed:'已归档',running:'执行中',review:'待复核',failed:'执行失败',interrupted:'已中断',completed:'完成',blocked:'待配置',partial:'部分完成',submitted:'已提交',downloaded:'已下载'};
function Icon({type='shield'}:{type?:string}){return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{type==='file'?<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>:type==='host'?<><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5M7 8l2 2-2 2M12 12h4"/></>:<><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/><path d="m8 12 3 3 5-6"/></>}</svg>}


function StageIcon({stage}:{stage:string}){
 const shapes:Record<string,React.ReactNode>={
 intake:<><path fill="currentColor" fillOpacity=".13" stroke="none" d="m16 3 10 4v8c0 6-10 13-10 13S6 21 6 15V7Z"/><path d="m16 3 10 4v8c0 6-10 13-10 13S6 21 6 15V7Z"/><path d="m11 15 3.5 3.5L21 12"/></>,
 logs:<><rect x="3" y="4" width="11" height="8" rx="2" fill="currentColor" fillOpacity=".12"/><rect x="18" y="20" width="11" height="8" rx="2" fill="currentColor" fillOpacity=".12"/><path d="M8.5 12v4h15v4M6 7h5M21 24h5M5 25l4-4m-4 0h4v4M23 6l4 4m0-4v4h-4"/></>,
 host:<><rect x="3" y="5" width="24" height="17" rx="3" fill="currentColor" fillOpacity=".12"/><path d="M8 27h10M13 22v5M7 10l3 3-3 3M13 16h3"/><circle cx="23" cy="21" r="5" fill="var(--stage-soft)"/><circle cx="23" cy="21" r="5"/><path d="m27 25 3 3"/></>,
 sample:<><path fill="currentColor" fillOpacity=".12" d="M7 3h11l7 7v17H7Z" stroke="none"/><path d="M18 3H7v24h18V10l-7-7Zm0 0v7h7M11 14h8M11 18h5"/><circle cx="22" cy="24" r="5" fill="var(--stage-soft)"/><path d="M20 23v3m2-4v4m2-3v3"/></>,
 sandbox:<><path d="m16 3 12 6-12 6L4 9l12-6Z" fill="currentColor" fillOpacity=".12"/><path d="M4 9v14l12 6 12-6V9M16 15v14"/><path d="m10 12-2 6 4 3m10-9 2 6-4 3M16 19v4"/></>,
 report:<><rect x="5" y="4" width="21" height="24" rx="3" fill="currentColor" fillOpacity=".12"/><path d="M10 10h11M10 15h7M10 22v-3m4 3v-5"/><circle cx="24" cy="23" r="6" fill="var(--stage-soft)"/><path d="m21 23 2 2 4-4"/></>,
 };
 return <svg data-stage-icon={stage} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[stage]}</svg>;
}


// Keep log text literal and copyable; give machine-readable values their own typeface.
function ActivityMessage({message}:{message:string}){
 const parts=message.split(/(\b[0-9a-fA-F]{32,}\b|\b(?:\d{1,3}\.){3}\d{1,3}\b|(?<![\w:/])\/(?:[\w.@+-]+\/)*[\w@+-]+(?:\.[\w@+-]+)*)/g);
 return <>{parts.map((part,i)=>i%2?<code className="ir-activity-token" key={i}>{part}</code>:part)}</>;
}

function ActivityTimeline({events,compact=false}:{events:any[];compact?:boolean}){
 const [expanded,setExpanded]=useState(false);
 const english=incidentLocale(), locale=english?'en-US':'zh-CN', limit=compact?4:8;
 const dayFormat=new Intl.DateTimeFormat(locale,{month:'2-digit',day:'2-digit'});
 const timeFormat=new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const grouped:any[]=[];
 for(const e of events.slice().reverse()){
  const message=eventMessage(e),last=grouped[grouped.length-1];
  if(last&&last.stage===e.stage&&last.status===e.status&&last.message===message){last.count++;continue;}
  grouped.push({...e,message,count:1});
 }
 if(!events.length)return <div className="ir-activity-empty">{ui('暂无调查记录')}</div>;
 const shown=expanded?grouped:grouped.slice(0,limit);
 return <div className="ir-activity">
  <div className="ir-activity-meta">
   <span className="ir-activity-count"><strong>{events.length.toLocaleString(locale)}</strong> {english?(events.length===1?'record':'records'):'条记录'}</span>
   <small>{ui('按时间倒序 · 相邻重复记录合并显示')}</small>
  </div>
  <div className="ir-activity-list">
   {shown.map(e=>{
    const date=new Date(e.at), valid=Boolean(e.at)&&Number.isFinite(date.getTime()), message=String(e.message??'');
    const fullDate=valid?date.toLocaleString(locale,{hourCycle:'h23'}):'—';
    return <article className="ir-activity-row" key={e.id} data-status={e.status}>
     <div className="ir-activity-meta-cell">
      <time className="ir-activity-time" dateTime={valid?date.toISOString():undefined} title={fullDate}>
       <span>{valid?dayFormat.format(date):'—'}</span>{valid&&<> <span>{timeFormat.format(date)}</span></>}
      </time>
      <span className="ir-activity-status">{ui(labels[e.status]||e.status)}</span>
     </div>
     <details className="ir-activity-detail">
      <summary className="ir-activity-toggle"><span className="ir-activity-preview"><ActivityMessage message={message}/></span>
       {e.count>1&&<span className="ir-activity-repeat">×{e.count}</span>}
       <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </summary>
      <div className="ir-activity-expanded"><ActivityMessage message={message}/><small>{ui('操作人：')}{e.actor||ui('系统')} · {fullDate}</small></div>
     </details>
    </article>;
   })}
  </div>
  {grouped.length>limit&&<button type="button" className="ir-activity-more" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>
   {expanded?ui('收起记录'):english?`Show all ${grouped.length} groups`:`展开全部 ${grouped.length} 组记录`}
  </button>}
 </div>;
}

const attackThemes=[
 {id:'ransomware',label:'勒索攻击',accent:'#d34346',soft:'#fceeed',ink:'#a62d34',darkInk:'#ff999b',pattern:/勒索|ransomware/i},
 {id:'malware',label:'恶意程序',accent:'#ce5264',soft:'#fceff2',ink:'#9e3049',darkInk:'#ffa0b0',pattern:/木马|恶意文件|恶意程序|挖矿|webshell|malware|trojan|miner|backdoor|后门/i},
 {id:'exploit',label:'漏洞利用',accent:'#d17a2b',soft:'#fcf2e5',ink:'#8d480b',darkInk:'#ffbd80',pattern:/漏洞利用|代码执行|命令执行|反序列化|注入|exploit|\brce\b|\bsqli?\b|\bxss\b|cve-/i},
 {id:'credential',label:'身份攻击',accent:'#b9972f',soft:'#fcf7e0',ink:'#785b09',darkInk:'#f5d16d',pattern:/爆破|暴力破解|口令|凭据|撞库|brute.?force|credential|password/i},
 {id:'lateral',label:'横向移动',accent:'#497ccb',soft:'#eef4fe',ink:'#2f5696',darkInk:'#9cc5ff',pattern:/横向|远程执行|lateral|psexec|pass.the.hash/i},
 {id:'exfiltration',label:'数据外传',accent:'#ce6242',soft:'#fcefe8',ink:'#953d26',darkInk:'#ffae92',pattern:/外传|数据泄露|窃取|exfiltration|data.?leak/i},
 {id:'phishing',label:'钓鱼攻击',accent:'#a167bb',soft:'#f7eefb',ink:'#75408e',darkInk:'#e4b0ff',pattern:/钓鱼|phishing/i},
 {id:'c2',label:'外联通信',accent:'#388e8a',soft:'#eaf7f5',ink:'#246965',darkInk:'#87dbd3',pattern:/外联|命令控制|c2|command.and.control|beacon/i},
 {id:'recon',label:'扫描探测',accent:'#7a9c46',soft:'#f1f7e7',ink:'#4a6725',darkInk:'#c3e985',pattern:/探测|探测|扫描|侦察|scan|recon/i},
 {id:'other',label:'其他事件',accent:'#7b8999',soft:'#f0f3f6',ink:'#4e5b6c',darkInk:'#becbd9',pattern:/$^/},
];
function attackTheme(c:any){
 let alert:any={};try{alert=typeof c.alert==='string'?JSON.parse(c.alert):c.alert||{}}catch{}
 const text=[c.attack_type,c.category,c.title,alert.attack_type,alert.attackType,alert.category,alert.event_type,alert.title,alert.name].filter(v=>typeof v==='string').join(' ');
 return attackThemes.find(t=>t.pattern.test(text))||attackThemes[attackThemes.length-1];
}
const ledgerDate=new Intl.DateTimeFormat(undefined,{year:'numeric',month:'2-digit',day:'2-digit'});
const ledgerTime=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
function IncidentEndpoints({source,target}:{source?:string;target?:string}){
 return <span className="incident-endpoints"><span className="incident-ip" data-endpoint="source" title={ui("来源 IP")}>{source||ui('来源待核实')}</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-label={ui("到")} role="img"><path d="M4 12h15m-6-6 6 6-6 6"/></svg><span className="incident-ip" data-endpoint="target" title={ui("目标 IP")}>{target||'—'}</span></span>;
}
function IncidentRegisteredAt({value}:{value?:string}){
 const date=value?new Date(value):null;
 if(!date||!Number.isFinite(date.getTime()))return <span className="incident-event-date">—</span>;
 return <time className="incident-event-date" dateTime={date.toISOString()}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>{ledgerDate.format(date)}</span><span className="incident-clock-value">{ledgerTime.format(date)}</span></time>;
}
const stageColors=[['#16a34a','#ecfdf1'],['#089ace','#ecf9ff'],['#2563eb','#eef4ff'],['#d58a00','#fffae8'],['#7c3aed','#f5efff'],['#00a18a','#ebfcf7']];

function IncidentReportDialog({detail,onClose,heading="应急响应报告详情",downloadUrl}:{detail:any;onClose:()=>void;heading?:string;downloadUrl?:string}){
 const ref=useRef<HTMLDialogElement>(null);
 const [source,setSource]=useState(false);
 const chapters=Array.from((detail.report||'').matchAll(/^##\s+(.+)$/gm),(m:any)=>m[1]);
 useEffect(()=>{
  const node=ref.current!,previous=document.activeElement as HTMLElement,overflow=document.body.style.overflow;
  node.showModal();document.body.style.overflow='hidden';
  return()=>{node.close();document.body.style.overflow=overflow;previous?.focus()};
 },[]);
 return <dialog ref={ref} className="report-dialog" aria-labelledby="incident-report-title" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}>
  <header className="report-dialog-header"><div className="report-dialog-heading"><div className="report-preview-icon"><StageIcon stage="report"/></div><div><span>{heading==='样本分析详情'?'SAMPLE STATIC ANALYSIS':'INCIDENT RESPONSE REPORT'}</span><h2 id="incident-report-title">{heading}</h2><p>{detail.title}</p></div></div><button className="report-close" autoFocus aria-label={heading==='样本分析详情'?'关闭样本分析详情':'关闭报告详情'} onClick={onClose}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
  <div className="report-dialog-toolbar"><div className="report-view-toggle" role="group" aria-label="报告显示方式"><button aria-pressed={!source} onClick={()=>setSource(false)}>阅读视图</button><button aria-pressed={source} onClick={()=>setSource(true)}>Markdown 源文</button></div>{!source&&<select aria-label="跳转报告章节" defaultValue="" onChange={e=>{const value=e.target.value;if(value!=='')ref.current?.querySelectorAll('.report-document h2')[Number(value)]?.scrollIntoView({behavior:'smooth',block:'start'});e.target.value=''}}><option value="">跳转到章节</option>{chapters.map((title:string,i:number)=><option key={i} value={i}>{title}</option>)}</select>}<a className="export-report" href={downloadUrl||BASE+'/cases/'+detail.id+'/report.md'} download><Icon type="file"/>下载报告</a></div>
  <div className="report-dialog-body">{source?<pre className="report-source" aria-label="Markdown 报告源文">{detail.report}</pre>:<article className="report-document" aria-label="应急响应报告"><Markdown content={detail.report}/></article>}</div>
 </dialog>;
}



function SampleReviewSummary({review,onOpen,onAnalyze,disabled}:{review:any;onOpen:()=>void;onAnalyze:(force:boolean)=>void;disabled:boolean}){
 const verdicts:Record<string,string>={malicious:'存在明确恶意功能',suspicious:'存在可疑功能',no_clear_malice:'未见明确恶意功能',insufficient:'信息不足，待深入分析'};
 return <div className="sample-review-result" data-verdict={review?.result?.verdict||'pending'}><div className="sample-review-head"><strong>AI 样本分析</strong>{review?.status==='completed'&&<span>{verdicts[review.result.verdict]}</span>}</div>{review?.status==='completed'?<><p>{review.result.summary}</p><small>{review.method==='source_code_review'?'源码静态审阅':'二进制静态特征分析'} · 结果已归档 · 未执行样本</small><div className="sample-actions"><button className="primary" onClick={onOpen}>查看分析结果</button><button disabled={disabled} onClick={()=>onAnalyze(true)}>重新分析</button></div></>:<><p>{review?.status==='running'?'正在调用模型审阅样本，结果将自动保存。':review?.status==='failed'?(review.message||'分析未完成，原始样本保留，可重试。'):'该样本尚未生成独立的 AI 分析结果。'}</p><button className="primary" disabled={disabled||review?.status==='running'} onClick={()=>onAnalyze(false)}>{review?.status==='failed'?'重试 AI 分析':'AI 分析样本'}</button></>}</div>
}

const evidenceCategories=[['samples','样本文件'],['host','主机日志'],['device','设备日志'],['reports','分析报告'],['context','调查资料'],['process','过程记录']];
function evidenceCategory(e:any){if(e.kind==='sample')return 'samples';if(['host_logs','host_followup'].includes(e.kind))return 'host';if(e.kind==='device_logs')return 'device';if(['sample_analysis','rea_analysis','sandbox_report','static_analysis'].includes(e.kind))return 'reports';if(['ai_decision','rea_decision','rea_tool','sample_features'].includes(e.kind))return 'process';return 'context';}
const evidenceKindNames:Record<string,string>={sample:'取证样本',host_logs:'主机日志',host_followup:'主机追查',device_logs:'设备日志',sample_analysis:'AI 样本分析',rea_analysis:'REA 逆向报告',sandbox_report:'沙箱结果',static_analysis:'静态初筛',ai_decision:'AI 调查决策',rea_decision:'逆向决策',rea_tool:'逆向工具证据',sample_features:'样本静态特征',alert:'原始告警',manual_intake:'事件登记资料'};
const sourceBrands=[
 {key:'qianxin',match:/qianxin|skyeye|secgate|奇安信/i,name:'奇安信',asset:'qianxin.png',accent:'#3565ae',soft:'#eef3fb'},
 {key:'threatbook',match:/threatbook|tdp|onesec|onesig|微步/i,name:'微步在线',asset:'threatbook-hd.svg',accent:'#d85649',soft:'#fff1ed'},
 {key:'sangfor',match:/sangfor|深信服/i,name:'深信服',asset:'sangfor-hd.png',accent:'#237eae',soft:'#edf7fd'},
 {key:'chaitin',match:/chaitin|长亭/i,name:'长亭科技',asset:'chaitin-hd.png',accent:'#519839',soft:'#f0f9e8'},
 {key:'huorong',match:/huorong|火绒/i,name:'火绒安全',asset:'huorong-hd.png',accent:'#e18c27',soft:'#fff7e9'},
 {key:'huawei',match:/huawei|华为/i,name:'华为云',asset:'huaweicloud.png',accent:'#d94c57',soft:'#fff0f2'},
 {key:'360',match:/360|奇虎/i,name:'360 安全',asset:'360-hd.svg',accent:'#35a04b',soft:'#edf9ee'},
 {key:'qingteng',match:/qingteng|青藤/i,name:'青藤云安全',asset:'qingteng.png',accent:'#168b9e',soft:'#edf8f9'},
];
function sourceBrand(d:any){return sourceBrands.find(b=>b.match.test([d?.storage_key,d?.name].join(' ')))||{key:'custom',name:'安全设备',asset:'',accent:'#659d36',soft:'#f0f8e7'};}
function sourceDeviceName(d:any){const aliases:Record<string,string>={sangfor_atrust:'深信服 aTrust',chaitin_dongjian:'长亭洞鉴',huorong_edr:'火绒 EDR',huaweicloud_waf:'华为云 WAF',secgate3600:'奇安信 SecGate 3600', 'secgate 3600':'奇安信 SecGate 3600', '360_waf':'360 WAF', '360_fw':'360 防火墙',onesig:'微步 OneSIG'};return aliases[String(d?.name||'').toLowerCase()]||d?.name||'请选择来源设备';}
function SourceDeviceMark({device}:{device:any}){const b=sourceBrand(device);return <span className="source-vendor-logo" style={{'--vendor-accent':b.accent,'--vendor-soft':b.soft} as React.CSSProperties}>{b.asset?<><img src={'/vendor-logos/'+b.asset} alt={b.name} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement?.classList.add('image-failed')}}/><b aria-hidden="true">{b.name.slice(0,1)}</b></>:<StageIcon stage="logs"/>}</span>}
function DeviceSourcePicker({devices,value,onChange,label}:{devices:any[];value:string;onChange:(value:string)=>void;label:string}){
 const [open,setOpen]=useState(false),[active,setActive]=useState(0);const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);const selected=devices.find(d=>d.id===value),brand=sourceBrand(selected);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[open]);
 useEffect(()=>{if(open)root.current?.querySelectorAll<HTMLButtonElement>('[role=option]')[active]?.focus()},[open,active]);
 const pick=(id:string)=>{onChange(id);setOpen(false);trigger.current?.focus()};
 return <div className="device-source-picker" ref={root} style={{'--vendor-accent':brand.accent,'--vendor-soft':brand.soft} as React.CSSProperties}>
 <button ref={trigger} type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={label==='新事件来源设备'?'new-source-options':'source-options'} aria-haspopup="listbox" className={'source-picker-trigger '+(selected?'has-source':'')} onClick={()=>{setActive(Math.max(0,devices.findIndex(d=>d.id===value)));setOpen(!open)}} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setActive(Math.max(0,devices.findIndex(d=>d.id===value)));setOpen(true)}}}>{selected?<><SourceDeviceMark device={selected}/><span><strong>{sourceDeviceName(selected)}</strong><small>{sourceBrand(selected).name} · {selected.query_supported?'关联日志已适配':'日志适配待完成'}</small></span></>:<><StageIcon stage="logs"/><span>选择对应的态势感知或告警设备</span></>}<svg className="source-picker-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m5 7 5 5 5-5"/></svg></button>
 {open&&<div id={label==='新事件来源设备'?'new-source-options':'source-options'} role="listbox" aria-label={label+'选项'} className="source-picker-options" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);trigger.current?.focus()}if(devices.length&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();setActive(i=>(i+(e.key==='ArrowDown'?1:-1)+devices.length)%devices.length)}if(e.key==='Home'){e.preventDefault();setActive(0)}if(e.key==='End'){e.preventDefault();setActive(devices.length-1)}}}>{devices.length?devices.map((d,i)=>{const b=sourceBrand(d);return <button type="button" role="option" aria-selected={value===d.id} tabIndex={active===i?0:-1} key={d.id} style={{'--vendor-accent':b.accent,'--vendor-soft':b.soft} as React.CSSProperties} onClick={()=>pick(d.id)} onFocus={()=>setActive(i)}><SourceDeviceMark device={d}/><span className="source-option-copy"><strong>{sourceDeviceName(d)}</strong><small>{b.name} · {d.name}</small></span><span className={'source-adapter-badge '+(d.query_supported?'ready':'pending')}>{d.query_supported?'日志已适配':'待适配'}</span>{value===d.id&&<svg className="source-choice-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 10 4 4 8-8"/></svg>}</button>}):<p className="note">暂无已启用设备，请先在设备接入中配置。</p>}</div>}
 </div>;
}
function caseSource(detail:any){try{return JSON.parse(detail?.alert||'{}')._source_device||null}catch{return null}}
function eventMessage(e:any){return e.message==='设备日志查询失败，请检查已接入 TDP 的连接和权限。原告警证据已保留。'?'来源设备日志查询失败，请检查本事件绑定设备的连接与查询权限。原告警证据已保留。':e.message}
// Summarize only recorded metadata: missing counts never mean zero.
function logCoverage(value: unknown) {
 let meta: Record<string, unknown> = {};
 try {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) meta = parsed;
 } catch { /* Legacy or malformed metadata remains unknown. */ }
 const query = (meta.query && typeof meta.query === 'object' ? meta.query : {}) as Record<string, unknown>;
 const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
 const returned = count(meta.returned), total = count(meta.total), limit = count(meta.page_limit);
 const epoch = (v: unknown) => typeof v === 'number' && v > 0 && v < 1e11 ? new Date(v * 1000).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: false}) : '';
 const local = (v: unknown) => typeof v === 'string' && /^\d{4}[/\-]\d{2}[/\-]\d{2} \d{2}:\d{2}:\d{2}$/.test(v) ? v : '';
 const from = epoch(query.time_from) || local(query.time_start);
 const to = epoch(query.time_to) || local(query.time_end);
 if (meta.truncated === true || (returned !== null && total !== null && total > returned)) return { label: '结果已截断', from, to, returned, total, limit, note: '未返回的日志不在本次证据内，不能据此排除其他行为。' };
 if (limit !== null) return { label: '仅首批 · 覆盖未确认', from, to, returned, total, limit, note: '可能还有后续分页；本次证据不能代表完整查询结果。' };
 const requested = count(query.size);
 if (requested !== null && requested > 0 && returned !== null && returned >= requested) return { label: '达到查询上限 · 覆盖未确认', from, to, returned, total, limit, note: '返回条数达到请求上限，无法确认是否还有更多匹配日志。' };
 if (meta.truncated === false && returned !== null && total === returned) return { label: returned === 0 ? '本次返回 0 条' : '未记录截断', from, to, returned, total, limit, note: '仅代表这台设备在指定时间和过滤条件下的返回，不代表事件证据完整。' };
 return { label: '覆盖未知', from, to, returned, total, limit, note: '这份证据没有足够的范围或计数记录，不能据此判断是否查全。' };
}

function DeviceLogCoverage({detail}:{detail:any}) {
 const records = (detail.evidence || []).filter((e:any) => e.kind === 'device_logs').slice().reverse();
 const latest = (detail.events || []).filter((e:any) => e.stage === 'logs').slice(-1)[0];
 return <section aria-label="日志证据覆盖" style={{marginBottom:16}}>
  <div className="work-section-head" style={{marginBottom:8}}><div><h3>日志证据覆盖</h3><small>归档证据按时间倒序；覆盖范围不是事件完整度。</small></div>{latest&&<span className="badge">最近记录：{ui(labels[latest.status]||latest.status)}</span>}</div>
  <div className="device-results">{records.map((e:any) => {
   const coverage = logCoverage(e.metadata);
   return <div className="evidence compact-log" key={e.id} style={{flexWrap:'wrap'}}><Icon type="file"/><div className="body" style={{minWidth:0,overflowWrap:'anywhere'}}>
    <strong>{e.label} · {coverage.label}</strong>
    <small>归档：{new Date(e.created).toLocaleString()} · {(e.size/1024).toFixed(1)} KB</small>
    <small>查询范围：{coverage.from && coverage.to ? `${coverage.from} 至 ${coverage.to}（UTC+8）` : '未记录'}</small>
    <small>返回 {coverage.returned ?? '未知'} 条 · 记录总数 {coverage.total ?? '未知'}{coverage.limit !== null ? ` · 首批上限 ${coverage.limit} 条` : ''}</small>
    <p style={{margin:'5px 0 0',fontSize:12}}>{coverage.note}</p>
   </div><a href={BASE+'/cases/'+detail.id+'/evidence/'+e.id}>下载原始日志</a></div>;
  })}{records.length===0&&<div className="compact-empty">{caseSource(detail) ? '暂无归档日志。未采集不等于没有异常，请先查询关联日志。' : '尚未绑定告警来源设备，无法判断日志覆盖。'}</div>}</div>
 </section>;
}

const caseFilters=[
 {id:'',label:'全部事件',statuses:[]}, {id:'queued',label:'待调查',statuses:['new','queued']},
 {id:'active',label:'调查进行中',statuses:['investigating','running']}, {id:'review',label:'待复核',statuses:['review']},
 {id:'closed',label:'已归档',statuses:['closed']}, {id:'interrupted',label:'异常 / 中断',statuses:['failed','interrupted']},
];
const casePageSize=10;
function caseHref(id:string){const url=new URL(location.href);if(id)url.searchParams.set('case',id);else url.searchParams.delete('case');return url.pathname+url.search+url.hash;}

export default function IncidentPage(){
 useIncidentLocale();
 const [cases,setCases]=useState<any[]>([]),[selected,setSelected]=useState(new URLSearchParams(location.search).get('case')||''),[detail,setDetail]=useState<any>(null),[tab,setTab]=useState('overview'),[settings,setSettings]=useState<any>({hosts:[]}),[error,setError]=useState(''),[busy,setBusy]=useState(''),[query,setQuery]=useState(''),[modal,setModal]=useState(false),[remote,setRemote]=useState(''),[path,setPath]=useState('');
 const [analysisProvider,setAnalysisProvider]=useState('threatbook'),[externalReport,setExternalReport]=useState<any>(null);
 const [sourceOpen,setSourceOpen]=useState(false),[sourceDeviceId,setSourceDeviceId]=useState(''),[sourceNote,setSourceNote]=useState('');
 const [statusOpen,setStatusOpen]=useState(false),[statusAction,setStatusAction]=useState(''),[statusNote,setStatusNote]=useState(''),[caseStatusFilter,setCaseStatusFilter]=useState('');
 const [caseTypeFilter,setCaseTypeFilter]=useState(''),[casePage,setCasePage]=useState(1),[casesReady,setCasesReady]=useState(false);
 const selectedRef=useRef(selected);
 const showDetailView=Boolean(selected)||tab==='settings';
 const [evidenceFilter,setEvidenceFilter]=useState('samples'),[evidenceQuery,setEvidenceQuery]=useState('');
 const [reverseResults,setReverseResults]=useState<any>({}),[reverseReview,setReverseReview]=useState(''),[reaStatus,setReaStatus]=useState<any>(null);
 const [optionalJobs,setOptionalJobs]=useState<any[]>([]),[optionalLog,setOptionalLog]=useState('');
 const [reportOpen,setReportOpen]=useState(false),[sampleReview,setSampleReview]=useState('');
 const evidenceItems=(detail?.evidence||[]).filter((e:any)=>(evidenceFilter==='all'||evidenceCategory(e)===evidenceFilter)&&(!evidenceQuery.trim()||[e.label,e.sha256,e.id,evidenceKindNames[e.kind]||e.kind].join(' ').toLowerCase().includes(evidenceQuery.trim().toLowerCase()))).slice().reverse();
 useEffect(()=>{if(!document.querySelector('script[data-scene-controls]')){const script=document.createElement('script');script.src='/api/scenes/vulnops/static/control-icons.js?v=20261118-1';script.dataset.sceneControls='true';document.head.append(script);}},[]);
 const [eventModal,setEventModal]=useState(false),[deleteOpen,setDeleteOpen]=useState(false);
 const initialEvent=()=>({title:'',source:'',target:'',source_device_id:'',description:'',occurred_at:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),start_investigation:true});
 const [newEvent,setNewEvent]=useState(initialEvent);
 const eventRef=useRef(newEvent);eventRef.current=newEvent;
 const [host,setHost]=useState({name:'',address:'',protocol:'ssh',port:22,username:'',password:'',host_key:''});
 const hostRef=useRef(host);hostRef.current=host;
 async function refresh(id=selectedRef.current){try{const [c,s]=await Promise.all([req('/cases'),req('/settings')]);setCases(c);setCasesReady(true);setSettings(s);if(id&&selectedRef.current===id){const record=await req('/cases/'+encodeURIComponent(id));if(selectedRef.current===id)setDetail(record);const reverse=await req('/cases/'+encodeURIComponent(id)+'/reverse').catch(()=>({}));if(selectedRef.current===id)setReverseResults(reverse);}setReaStatus(await req('/rea/status').catch(()=>null));if(id===selectedRef.current)setError('');}catch(e:any){if(id===selectedRef.current){setCasesReady(true);setError(e.message)}}}
 useEffect(()=>{refresh();const timer=setInterval(refresh,6000);return()=>clearInterval(timer)},[selected]);
 async function action(name:string,fn:()=>Promise<any>){setBusy(name);setError('');try{await fn();await refresh()}catch(e:any){setError(e.message)}finally{setBusy('')}}
 useEffect(()=>{let gone=false;const load=()=>req('/optional/jobs').then(j=>{if(!gone)setOptionalJobs(j)}).catch(()=>{});load();const timer=setInterval(load,5000);return()=>{gone=true;clearInterval(timer)}},[]);
 async function openOptional(operation:string){
  if(!confirm(operation==='rea_install'?'授权下载并安装可选 REA 静态逆向环境？将按需下载约1GB依赖，仅支持此平台的 Linux x64 / WSL2 隔离 worker。':'授权 Solar 官方工具对本事件主机开展全面只读取证？会创建临时报告目录并读取系统日志、进程、文件信息；不执行样本、不外发证据。'))return;
  await action('准备 Atlas 协作',async()=>{
   const grant=await req('/optional/authorize',{operation,confirmed:true,case_id:detail?.id||'',host_id:remote});
   if(!(window as any).AegisSceneAI)await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='/api/scenes/assistant/widget.js';script.onload=()=>resolve();script.onerror=()=>reject(Error('Atlas 加载失败'));document.head.append(script)});
   (window as any).AegisSceneAI.open({kind:operation==='rea_install'?'rea-install':'forensics',context:{...grant,target:detail?.target,task_tool:'incident_optional_operations',instructions:'使用本次由管理员明确确认的授权启动固定工具任务；随后查询真实进度。不可在未成功自检时声称完成。'}});
  });
 }

 function choose(id:string,navigation:'push'|'replace'|'pop'='push'){
  if(id===selectedRef.current&&tab!=='settings')return;
  selectedRef.current=id;
  setExternalReport(null);setSourceOpen(false);setStatusOpen(false);setStatusNote('');setEvidenceFilter('samples');setEvidenceQuery('');setReverseReview('');setReverseResults({});setSampleReview('');setReportOpen(false);setSelected(id);setDetail(null);setError('');setTab('overview');
  if(navigation==='push'&&caseHref(id)!==location.pathname+location.search+location.hash)history.pushState(history.state,'',caseHref(id));
  if(navigation==='replace')history.replaceState(history.state,'',caseHref(id));
 }
 function followCase(event:React.MouseEvent<HTMLAnchorElement>,id:string){
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();choose(id);
 }
 useEffect(()=>{const onPop=()=>choose(new URLSearchParams(location.search).get('case')||'','pop');window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop);},[tab]);
 function openConnections(){if(selectedRef.current)choose('','replace');setTab('settings');}
 useEffect(()=>{
  if(!modal)return;let cancelled=false;
  const mount=()=>{if(cancelled)return;const el=document.getElementById('ir-ai-workbench'),manual=document.getElementById('ir-host-fields');if(!el||!manual)return;(window as any).AegisSceneAI.mount(el,{kind:'host',manual,context:()=>({form:Object.fromEntries(Object.entries(hostRef.current).filter(([key])=>['name','address','protocol','port','username'].includes(key)))}),onApply:(draft:any)=>setHost(current=>({...current,...Object.fromEntries(Object.entries(draft).filter(([key])=>['name','address','protocol','port','username'].includes(key)))}))});};
  if((window as any).AegisSceneAI)mount();else{const script=document.createElement('script');script.src='/api/scenes/assistant/widget.js';script.onload=mount;script.onerror=()=>{if(!cancelled)setError('AI 助手加载失败，可继续手动填写。')};document.head.append(script);}
  return()=>{cancelled=true};
 },[modal]);
 useEffect(()=>{
  if(!eventModal)return;let cancelled=false;
  const mount=()=>{if(cancelled)return;const el=document.getElementById('ir-event-ai'),manual=document.getElementById('ir-event-fields');if(!el||!manual)return;(window as any).AegisSceneAI.mount(el,{kind:'incident',manual,context:()=>({form:eventRef.current}),onApply:(draft:any)=>setNewEvent(current=>({...current,...Object.fromEntries(Object.entries(draft).filter(([key,value])=>['title','source','target','description','occurred_at'].includes(key)&&typeof value==='string'))}))});};
  if((window as any).AegisSceneAI)mount();else{const script=document.createElement('script');script.src='/api/scenes/assistant/widget.js';script.onload=mount;script.onerror=()=>{if(!cancelled)setError('AI 助手加载失败，可手动填写。')};document.head.append(script);}
  return()=>{cancelled=true};
 },[eventModal]);
 const platform=analysisProvider==='threatbook'?{name:'微步云沙箱',logo:'threatbook-hd.svg',accent:'#b45f55',soft:'#fcf3f0',ready:settings.sandbox_key_configured}:{name:'VirusTotal',logo:'virustotal.svg',accent:'#586e9d',soft:'#f0f3fa',ready:settings.virustotal_key_configured};
 function reportProvider(e:any){try{return JSON.parse(e.metadata||'{}').provider||(e.label.includes('VirusTotal')?'virustotal':'threatbook')}catch{return 'threatbook'}}
 async function showExternalReport(e:any){await action('读取分析报告',async()=>{const r=await fetch(BASE+'/cases/'+detail.id+'/evidence/'+e.id,{credentials:'same-origin'});if(!r.ok)throw Error('报告读取失败');const body=await r.json();const stats=body.data?.attributes?.last_analysis_stats;const results=body.data?.attributes?.last_analysis_results;const clean=(v:any)=>String(v??'—').replace(/[|\r\n]/g,' ');let md='# '+e.label+'\n\n报告来自外部平台。检出数量属于多引擎判断，不等同于攻击成功或攻击者归属。提交回执仅代表任务已接收，需稍后查询分析结果。\n\n';if(stats){md+='## 多引擎统计\n\n| 判定 | 引擎数量 |\n| --- | --- |\n'+Object.entries(stats).map(([k,v])=>'| '+clean(k)+' | '+clean(v)+' |').join('\n')+'\n\n'}if(results){md+='## 引擎检测结果\n\n| 引擎 | 判定 | 检测名称 |\n| --- | --- | --- |\n'+Object.entries(results).map(([k,v]:[string,any])=>'| '+clean(k)+' | '+clean(v.category)+' | '+clean(v.result)+' |').join('\n')+'\n\n'}md+='## 原始返回\n\n```json\n'+JSON.stringify(body,null,2)+'\n```';setExternalReport({title:e.label,report:md,id:e.id})})}
 function openSource(){setSourceDeviceId(caseSource(detail)?.id||'');setSourceNote('');setSourceOpen(true)}
 async function saveEvent(){if(!newEvent.source_device_id){setError('请选择本事件实际的来源设备');return}await action('创建事件',async()=>{const result=await req('/cases',{title:newEvent.title,source:newEvent.source,target:newEvent.target,description:newEvent.description,source_device_id:newEvent.source_device_id,first_time:Math.floor(new Date(newEvent.occurred_at).getTime()/1000),start_investigation:newEvent.start_investigation});setEventModal(false);choose(result.id);});}
 async function removeEvent(){if(!detail)return;setBusy('删除事件');setError('');try{await req('/cases/'+detail.id,{confirmed:true},'DELETE');setDeleteOpen(false);choose('','replace');await refresh('');}catch(e:any){setError(e.message)}finally{setBusy('')}}
 const matchingStatuses=caseFilters.find(f=>f.id===caseStatusFilter)?.statuses||[];
 const needle=query.trim().toLocaleLowerCase();
 const shown=cases.filter(c=>(!matchingStatuses.length||matchingStatuses.includes(c.status))&&(!caseTypeFilter||attackTheme(c).id===caseTypeFilter)&&[c.title,c.target,c.source,`IR-${c.id}`].some(value=>String(value??'').toLocaleLowerCase().includes(needle)));
 const casePageCount=Math.max(1,Math.ceil(shown.length/casePageSize));
 const currentCasePage=Math.min(casePage,casePageCount);
 const pageCases=shown.slice((currentCasePage-1)*casePageSize,currentCasePage*casePageSize);
 const locked=!!busy||detail?.processing||['running','closed'].includes(detail?.status);
 const selectedStatusAction=detail?.status_actions?.find((a:any)=>a.action===statusAction);
 const matching=settings.hosts.filter((h:any)=>h.address===detail?.target);
 const stages=[['intake','事件确认'],['logs','设备关联'],['host','主机排查'],['sample','样本取证'],['sandbox','沙箱分析'],['report','报告复核']];
 return <div className="ir" data-aegis-scene="incident"><link rel="stylesheet" href="/api/scenes/vulnops/static/workspace-controls.css?v=20261118-1"/><style>{`

 .ir{--green:#a2c67b;--green-hover:#b1d28e;--green-ink:#496b35;--soft:#f0f6e9;--ink:#26382c;--dim:#839080;--line:#e2e8df;color:var(--ink);background:radial-gradient(ellipse at 4% 0,#eaf5df80,transparent 42%),#f6f8f5;min-height:100dvh;padding:32px;font:14px/1.75 system-ui,-apple-system,'Segoe UI','Microsoft YaHei',sans-serif}
 .ir *{box-sizing:border-box}.ir button,.ir input,.ir select,.ir textarea{font-family:inherit;font-size:13px;line-height:1.6}.ir button,.ir a{transition:background .18s,border-color .18s,box-shadow .18s,transform .18s}
 .ir button{cursor:pointer;min-height:40px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:9px 16px;color:#586b4f;font-weight:500}.ir button:hover{background:#f2f7ed;border-color:#c8d9b9;transform:translateY(-1px)}.ir button:disabled{opacity:.45;cursor:not-allowed;transform:none}.ir button:focus-visible,.ir a:focus-visible{outline:2px solid #9cba74;outline-offset:3px}
 .ir .danger{color:#b47d6b;background:#fff9f5;border-color:#eedfd5}.ir .danger:hover{background:#fcf0e8;border-color:#dfbfae}.ir .confirm-dialog{width:min(520px,94vw)}.ir .check-line{display:flex;align-items:center;gap:10px;color:#7b8c6c;font-size:12px;margin:20px 0}.ir .check-line input{width:16px;height:16px;min-height:0;accent-color:#a2c67b}.ir .form-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.ir .dialog h2{font-size:20px}
 .ir .primary{background:var(--green);color:#24371d;border-color:transparent;box-shadow:0 3px 10px #536f3310}.ir .primary:hover{background:var(--green-hover);border-color:transparent}

 .ir .work-section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px}.ir .work-section-head h3{margin:0 0 4px}.ir .work-section-head small{font-size:12px;color:#819075}.ir .compact-log{display:flex;align-items:center;margin:10px 0;padding:14px}.ir .compact-log small{display:block;margin-top:5px;font-size:11px;color:#87937e}.ir .compact-log a{margin-left:auto;font-size:12px;white-space:nowrap}.ir .compact-empty{padding:32px 16px;border:1px dashed #dce7d2;border-radius:12px;color:#8b997f;text-align:center;font-size:13px}.ir .work-help{margin-top:14px;border:1px solid #e4ebdc;border-radius:10px;background:#fafcf7;padding:12px 14px}.ir .work-help>summary{font-size:12px;color:#788d61;cursor:pointer;font-weight:550}.ir .work-help p{font-size:12px;line-height:1.9;margin:12px 0 0}.ir .host-operation{display:flex;gap:16px;padding:20px 0;border-top:1px solid #e7eddf}.ir .host-operation:first-of-type{border-top:0;padding-top:5px}.ir .operation-number{flex:none;width:31px;height:31px;display:grid;place-items:center;background:#e8f2d8;color:#6d9349;border-radius:9px;font-size:12px;font-weight:650}.ir .operation-body{flex:1;min-width:0}.ir .operation-body h4{font-size:14px;font-weight:650;color:#3c5134;margin:4px 0 12px}.ir .operation-body>p{font-size:12px;margin:0 0 15px}.ir .operation-body .field{margin:0;max-width:600px}.ir .operation-body .field>span{font-size:12px;color:#89997c;font-weight:400}.ir .operation-body>small{display:block;color:#a18b53;margin-top:9px;font-size:12px}.ir .file-collect-line{display:flex;gap:10px}.ir .file-collect-line input{min-width:0;flex:1}.ir .file-collect-line button{flex:none}@media(max-width:700px){.ir .file-collect-line{flex-wrap:wrap}.ir .host-operation{gap:11px}}
 .ir .scene-page-brand{display:flex;align-items:center;gap:16px}.ir .scene-page-logo{width:54px;height:54px;flex:none;object-fit:contain;filter:drop-shadow(0 3px 4px #cd536320)}.ir h1{font-size:28px;letter-spacing:-.6px;font-weight:650;margin:0;line-height:1.45}.ir h2{font-size:20px;font-weight:600;margin:0;line-height:1.55}.ir h3{font-size:17px;font-weight:600;margin:0 0 13px}.ir p{color:var(--dim);margin:8px 0;line-height:1.8}
 .ir .head{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-bottom:28px}.ir .overline{letter-spacing:2.5px;color:#92a282;font-size:10px;margin-bottom:8px}.ir .tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ir .tools button{display:inline-flex;align-items:center;justify-content:center;gap:8px}
 .ir .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-bottom:26px}.ir .stat,.ir .panel{background:#fff;border:1px solid var(--line);border-radius:21px;box-shadow:0 4px 18px #20321a03}.ir .stat{padding:25px 27px;min-height:155px;position:relative;overflow:hidden}.ir .stat:first-child{background:radial-gradient(ellipse at 0 0,#e9f5db,transparent 85%),#fff}.ir .stat b{font-size:39px;font-weight:600;letter-spacing:-1px;display:block;margin-top:13px;line-height:1.2}.ir .stat span{color:#809076;font-size:13px}.ir .stat:after{content:'';position:absolute;width:7px;height:7px;border-radius:50%;right:26px;top:30px;background:#c4d7b2}
 .ir .layout{display:grid;grid-template-columns:310px minmax(0,1fr);gap:0;align-items:stretch;height:clamp(920px,calc(100dvh - 60px),1600px);overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:22px;box-shadow:0 4px 20px #20321a03}.ir .list{padding:20px 18px;border:0;border-right:1px solid #e5ebdf;border-radius:0;background:#fafcf8;box-shadow:none;min-height:0;max-height:none;overflow:hidden;display:flex;flex-direction:column}.ir .list-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 4px}.ir .list-heading h3{font-size:14px;margin:0;color:#61764f}.ir .list-heading span{font-size:11px;color:#9baa8d}.ir .list-search{padding-bottom:13px}.ir .case-scroll{overflow:auto;min-height:0;flex:1;scrollbar-width:thin;scrollbar-color:#d5dfcb transparent}.ir .case{width:100%;display:block;text-align:left;min-height:108px;padding:16px 14px;margin:0 0 9px;border-radius:12px;background:transparent}.ir .case.active{box-shadow:none}.ir .case small{font-size:10px}.ir .case .addr{font-size:11px}.ir .case strong{font-size:13px}
.ir input,.ir select,.ir textarea{width:100%;border:1px solid #dfe6da;background:#fcfdfb;color:#32472b;padding:11px 13px;border-radius:10px;outline:none}.ir input:focus,.ir select:focus,.ir textarea:focus{border-color:#a2bd84;box-shadow:0 0 0 3px #a2c67b18}
 .ir .empty{text-align:center;padding:88px 30px;color:#8b9982}.ir .empty>svg{display:inline-block;width:58px;height:58px;color:#aac095}.ir .empty h2{color:#586f49;margin:20px 0 12px}.ir .detail{padding:0;min-width:0;min-height:0;border:0;border-radius:0;box-shadow:none;display:flex;flex-direction:column;overflow:hidden;animation:ir-enter .3s ease}.ir .detail.settings-view{display:block;padding:26px;overflow:auto}.ir .case-summary{padding:24px 26px 0;flex-shrink:0}.ir .case-summary>.head{margin-bottom:14px}.ir .case-summary h2{font-size:19px}.ir .case-summary .head p{font-size:12px;margin:6px 0}.ir .case-context{padding:7px 0!important;margin:10px 0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#94a284!important;font-size:11px!important}.ir .investigation-body{overflow:auto;flex:1;min-height:0;padding:22px 26px 26px;scrollbar-width:thin;scrollbar-color:#d5dfcb transparent;overscroll-behavior:contain}.ir .timeline-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px}.ir .timeline-head h3{font-size:14px;margin:0}.ir .timeline-head p{font-size:11px;margin:4px 0 0}.ir .timeline-head button{min-height:33px;font-size:11px;padding:6px 12px}.ir .detail>.empty{padding:100px 24px}.ir .badge{display:inline-flex;align-items:center;min-height:26px;border:1px solid #e0ead5;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:500;background:#f1f6e9;color:#6d8754}
 .ir .steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;margin:14px 0 18px;padding:4px 0}.ir .step{position:relative;background:transparent;border:0;text-align:center;min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px 3px;font-size:11px;color:#8c9984}.ir .step:not(:last-child):after{content:'';position:absolute;top:20px;left:calc(50% + 20px);width:calc(100% - 40px);border-top:1px solid #e1e8d8}.ir .step.done{background:transparent;color:#6e8b51}.ir .step.warn{background:transparent;color:#9e957b}.ir .step i{display:grid;place-items:center;width:29px;height:29px;border-radius:50%;border:1px solid #e4eadd;background:#fafcf7;font-style:normal;font-size:12px;font-weight:500;margin-bottom:8px}.ir .step.done i{background:#edf5e4;border-color:#d5e5bf;color:#73964c}.ir .step.warn i{background:#faf7f0;border-color:#ece5d7;color:#aa9872}
 .ir .tabs{display:flex;gap:24px;padding:0;background:transparent;border:0;border-bottom:1px solid #e7ecdf;border-radius:0;margin:0;overflow:auto}.ir .tabs button{border:0;border-bottom:2px solid transparent;background:transparent;border-radius:0;padding:11px 2px;min-height:40px;white-space:nowrap;color:#8e9b85;font-size:12px}.ir .tabs .active{color:#60843e;background:transparent;border-bottom-color:#a2c67b;box-shadow:none}
 .ir .event{position:relative;border:0;border-left:1px solid #e1e9d7;background:transparent;border-radius:0;padding:0 0 23px 22px;margin:0 0 0 5px}.ir .event:before{content:'';position:absolute;left:-4px;top:6px;width:7px;height:7px;border-radius:50%;background:#bed3a6;box-shadow:0 0 0 4px #fff}.ir .event:last-child{border-left-color:transparent;padding-bottom:0}.ir .event time{color:#a0ab96;font-size:11px}.ir .event b{font-size:10px;font-weight:500;color:#82976b;margin-left:12px;background:#f2f6ec;border-radius:5px;padding:2px 6px}.ir .event p{color:#7c8f6d;font-size:12px;margin:7px 0 0;line-height:1.8}.ir .timeline{padding:0 3px}
 .ir .notice{background:#f5f8ef;border:1px solid #e2ead6;border-radius:12px;padding:16px 19px;color:#859571;font-size:12px;line-height:1.9;margin:18px 0}.ir .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.ir .field{display:block;margin:18px 0;color:#7a8b6e;font-size:13px}.ir .field input,.ir .field select,.ir .field textarea{margin-top:8px}
 .ir .evidence{padding:22px;border:1px solid #e3eadd;background:#fcfdfb;border-radius:15px;margin:15px 0;display:flex;gap:16px;align-items:flex-start}.ir .evidence>svg{color:#8aa46e;flex-shrink:0;margin-top:3px}.ir .evidence .body{flex:1;min-width:0}.ir .evidence strong{font-size:14px;font-weight:600}.ir code{font:11px/1.8 Consolas,monospace;overflow-wrap:anywhere;color:#8b9980}.ir .evidence a{font-size:12px;color:#668746;text-decoration:none}.ir .error{padding:15px 19px;background:#fff3ee;border:1px solid #f0ddcf;color:#aa7054;border-radius:13px;margin-bottom:24px}.ir pre{white-space:pre-wrap;word-break:break-word;background:#f8faf5;border:1px solid #e5ebdf;padding:25px;border-radius:15px;font:13px/1.95 system-ui,'Microsoft YaHei',sans-serif;max-height:none;overflow:visible;margin:18px 0 0}
 .ir .modal{position:fixed;inset:0;background:#152c2055;backdrop-filter:blur(5px);z-index:1000;display:grid;place-items:center;padding:25px}.ir .dialog{width:min(720px,94vw);background:#fff;border:1px solid #e5ebdf;border-radius:23px;padding:30px;max-height:92dvh;overflow:auto;animation:ir-enter .25s ease}.ir .note{font-size:12px;color:#8a9980}.ir .hostitem{border:1px solid #e2eadd;background:#fbfdf8;padding:22px;border-radius:15px;margin:14px 0;display:flex;gap:18px;align-items:center}.ir .hostitem>svg{width:27px;height:27px;color:#8eaa72}.ir .hostitem .badge{margin-left:auto}.ir a{color:#668249;text-decoration:none}.ir a:hover{color:#496a32}.ir .sample-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}.ir .sample-actions button{font-size:12px;padding:8px 13px;min-height:36px}.ir .busy{font-size:13px;color:#7c965d;margin-left:10px}
 .ir .asai h3{font-size:23px;font-weight:600;margin-bottom:10px}.ir .asai p{font-size:13px;color:#87918b}.ir .asai textarea{border:0;background:transparent;border-radius:0;padding:0;box-shadow:none}.ir .asai .assend{background:#a2c67b;color:#24371d;border-color:transparent}.ir .asai .asguide{min-height:100px;padding:20px;font-size:14px}.ir .asai .ascontent{padding:32px}.ir .asai .asmsg{font-size:14px}.ir .asai .asdraft pre{padding:10px;background:transparent;border:0}.ir .asai .ascomposer{padding:18px}
 @keyframes ir-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
 @media(min-width:1700px){.ir{padding:36px 40px}.ir .stat{min-height:170px}.ir .layout{grid-template-columns:330px minmax(0,1fr)}}
 @media(max-width:1200px){.ir{padding:24px}.ir .stats{gap:14px}.ir .layout{grid-template-columns:260px minmax(0,1fr)}.ir .case-summary{padding:20px 21px 0}.ir .investigation-body{padding:21px}.ir .stat{padding:22px;min-height:145px}.ir .stat b{font-size:35px}.ir .grid{grid-template-columns:1fr}}
 @media(max-width:850px){.ir .layout{grid-template-columns:1fr;height:auto;max-height:none}.ir .list{max-height:260px;min-height:180px;border-right:0;border-bottom:1px solid #e5ebdf}.ir .stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ir .head{flex-wrap:wrap}.ir .detail{min-height:680px;max-height:1050px}.ir .case{min-height:100px}.ir .investigation-body{max-height:680px}.ir .tabs{gap:19px}.ir .steps{grid-template-columns:repeat(6,minmax(0,1fr))}}
 @media(max-width:550px){.ir{padding:16px}.ir h1{font-size:24px}.ir .stats{gap:10px}.ir .stat{padding:18px;min-height:130px}.ir .stat b{font-size:32px}.ir .tabs button{padding:8px 10px;font-size:12px}.ir .case-summary{padding:18px 16px 0}.ir .investigation-body{padding:19px 16px}.ir .tabs{gap:15px}.ir .step{font-size:10px}.ir .step:not(:last-child):after{left:calc(50% + 17px);width:calc(100% - 34px)}.ir .tools{gap:8px}.ir .modal{padding:12px}.ir .dialog{padding:20px}.ir .asai .ascontent{padding:16px}.ir .evidence{padding:16px}}


 /* Shared typography for investigation, evidence and report content. */
 .ir .investigation-body,.ir .tabs{font-family:'Microsoft YaHei','PingFang SC','Segoe UI',sans-serif;font-size:13px;font-weight:400;line-height:1.8;letter-spacing:0;-webkit-font-smoothing:antialiased}
 .ir .investigation-body :is(p,div,span,label,button,input,select,textarea,a,strong,b,small,time,pre),.ir .tabs button{font-family:inherit;letter-spacing:0}
 .ir .investigation-body{color:#607155}
 .ir .investigation-body h3{font-family:inherit;font-size:15px;font-weight:600;line-height:1.6;color:#435b35;margin-bottom:12px}
 .ir .investigation-body p,.ir .investigation-body .field,.ir .investigation-body pre{font-size:13px;font-weight:400;line-height:1.85}
 .ir .investigation-body p{color:#85917b}
 .ir .investigation-body :is(button,input,select,textarea,a){font-size:13px;font-weight:400;line-height:1.65}
 .ir .investigation-body :is(.notice,.note,.evidence p){font-size:12px;font-weight:400;line-height:1.8;color:#8a977f}
 .ir .investigation-body .evidence strong{font-size:14px;font-weight:600;line-height:1.6;color:#526b42}
 .ir .investigation-body code{font-family:'Cascadia Mono',Consolas,monospace;font-size:11px;font-weight:400;line-height:1.8;color:#939f89}
 .ir .investigation-body pre{font-family:inherit;color:#607155;tab-size:2}
 .ir .investigation-body .sample-actions button{font-size:12px;font-weight:400}
 .ir .tabs button{font-size:13px;font-weight:400;line-height:1.6}.ir .tabs button.active{font-weight:500}
 @media(prefers-reduced-motion:reduce){.ir *{animation:none!important;transition:none!important}}

 .ir .step{color:var(--stage-accent)}
 .ir .step i,.ir .step.warn i{background:linear-gradient(140deg,#fff,var(--stage-soft));border-color:color-mix(in srgb,var(--stage-accent) 30%,white);color:var(--stage-accent);box-shadow:0 2px 6px color-mix(in srgb,var(--stage-accent) 7%,transparent)}
 .ir .step.done{color:var(--stage-accent)}.ir .step.done i{color:var(--stage-accent);background:linear-gradient(140deg,var(--stage-soft),color-mix(in srgb,var(--stage-accent) 18%,white));border-color:color-mix(in srgb,var(--stage-accent) 42%,white);font-weight:650}
 .ir .step:not(:last-child):after{border:0;height:1px;background:linear-gradient(90deg,color-mix(in srgb,var(--stage-accent) 32%,white),#e5eae6)}
 .ir .step.warn i{border-style:dashed}.ir .step-status{font-size:9px;margin-top:3px;line-height:1.3;color:#9a8055}
 .ir .case{position:relative;background:radial-gradient(ellipse at 0% 0%,var(--case-soft),transparent 90%),linear-gradient(125deg,#fff,var(--case-soft));border-color:color-mix(in srgb,var(--case-accent) 18%,#e8ece8);transition:border-color .18s,box-shadow .18s,background .18s}
 .ir .case strong{color:var(--case-accent)}.ir .case .addr{color:#64746b}.ir .case small{color:#819087;font-size:11px}
 .ir .case:hover{border-color:color-mix(in srgb,var(--case-accent) 55%,white);box-shadow:0 3px 10px color-mix(in srgb,var(--case-accent) 9%,transparent)}
 .ir .case.active{background:linear-gradient(125deg,var(--case-soft),color-mix(in srgb,var(--case-accent) 14%,white));border-color:color-mix(in srgb,var(--case-accent) 55%,white);box-shadow:inset 3px 0 var(--case-accent)}
 .ir .case-type{display:inline-block;color:var(--case-accent);background:color-mix(in srgb,var(--case-soft) 80%,white);border:1px solid color-mix(in srgb,var(--case-accent) 18%,white);border-radius:6px;font-size:10px;line-height:1.5;padding:2px 7px;margin-bottom:8px}
 .ir .case-status{display:inline-block;margin-left:5px;color:#6f7f73}.ir .case-status[data-status=running]{color:#4979aa}.ir .case-status[data-status=failed]{color:#b56262}.ir .case-status[data-status=review]{color:#a18445}


 /* Slightly stronger color depth and readable secondary text. */
 .ir .stat:nth-child(1){--stat-accent:#72964e}.ir .stat:nth-child(2){--stat-accent:#568cad}.ir .stat:nth-child(3){--stat-accent:#aa8a52}.ir .stat:nth-child(4){--stat-accent:#8d74ac}
 .ir .stat{background:radial-gradient(ellipse at 0% 0%,color-mix(in srgb,var(--stat-accent) 19%,white),transparent 95%),linear-gradient(135deg,#fff,color-mix(in srgb,var(--stat-accent) 7%,white));border-color:color-mix(in srgb,var(--stat-accent) 25%,white)}
 .ir .stat:after{background:var(--stat-accent);opacity:.65}.ir .stat span{color:#657b61}.ir .stat b{color:#30452f}
 .ir .case{background:linear-gradient(130deg,color-mix(in srgb,var(--case-accent) 12%,white),color-mix(in srgb,var(--case-accent) 5%,white));border-color:color-mix(in srgb,var(--case-accent) 31%,white)}
 .ir .case.active{background:linear-gradient(125deg,color-mix(in srgb,var(--case-accent) 23%,white),color-mix(in srgb,var(--case-accent) 12%,white));border-color:color-mix(in srgb,var(--case-accent) 65%,white)}
 .ir .case strong{display:block;font-size:13px;line-height:1.6;margin-bottom:4px}.ir .case-type{background:color-mix(in srgb,var(--case-accent) 15%,white);border-color:color-mix(in srgb,var(--case-accent) 28%,white)}
 .ir .case .addr,.ir .case small{color:#61766e}.ir .case small{display:block;margin-top:6px}
 .ir .step,.ir .step.warn{color:var(--stage-accent);font-weight:500}
 .ir .step i,.ir .step.warn i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 11%,white),color-mix(in srgb,var(--stage-accent) 20%,white));border-color:color-mix(in srgb,var(--stage-accent) 48%,white);font-weight:600}
 .ir .step.done i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 20%,white),color-mix(in srgb,var(--stage-accent) 32%,white));border-color:color-mix(in srgb,var(--stage-accent) 60%,white)}
 .ir .step:not(:last-child):after{background:linear-gradient(90deg,color-mix(in srgb,var(--stage-accent) 52%,white),#dce5dd)}
 .ir .tabs button{color:#72816a}.ir .tabs .active{color:#4d7439;border-bottom-color:#86aa60}
 .ir .head p,.ir .investigation-body p{color:#6e8066}.ir .event time{color:#819078}.ir .event b{background:#e5eedb;color:#67844e}.ir .event:before{background:#9bb97b}
 .ir .case-context{color:#7c8e6b!important}.ir .badge{background:#e8f0dd;border-color:#d5e2c5;color:#64814b}


 /* Match the analysis workspace: charcoal typography, one green headline metric. */
 .ir{color:#273239}.ir h1,.ir h2,.ir .investigation-body h3,.ir .list-heading h3{color:#263339}
 .ir .stat{background:#fff;border-color:#e5e9e6;box-shadow:0 3px 10px #21332b04}
 .ir .stat:first-child{background:#edf6df;border-color:#deebce}
 .ir .stat b{color:#202a2e}.ir .stat span{color:#66757b}.ir .stat:after{background:#b5c4ba;opacity:.65}.ir .stat:first-child:after{background:#7da94e}
 .ir .head p,.ir .investigation-body,.ir .investigation-body p{color:#59696d}
 .ir .event time,.ir .case-context{color:#75847d!important}.ir .event p{color:#53666a}.ir .event b{background:#e5efd8;color:#5e7d3e}.ir .event:before{background:#96b46a}
 .ir .case{background:linear-gradient(130deg,color-mix(in srgb,var(--case-accent) 19%,white),color-mix(in srgb,var(--case-accent) 9%,white));border-color:color-mix(in srgb,var(--case-accent) 40%,white)}
 .ir .case.active{background:linear-gradient(125deg,color-mix(in srgb,var(--case-accent) 30%,white),color-mix(in srgb,var(--case-accent) 17%,white));border-color:color-mix(in srgb,var(--case-accent) 75%,white)}
 .ir .case strong,.ir .case-type{color:color-mix(in srgb,var(--case-accent) 78%,#182a33)}
 .ir .case .addr,.ir .case small{color:#566c70}
 .ir .step,.ir .step.warn,.ir .step.done{color:color-mix(in srgb,var(--stage-accent) 80%,#1d3038)}
 .ir .step i,.ir .step.warn i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 18%,white),color-mix(in srgb,var(--stage-accent) 29%,white));border-color:color-mix(in srgb,var(--stage-accent) 60%,white);color:color-mix(in srgb,var(--stage-accent) 80%,#1d3038)}
 .ir .step.done i{background:linear-gradient(140deg,color-mix(in srgb,var(--stage-accent) 28%,white),color-mix(in srgb,var(--stage-accent) 42%,white));border-color:var(--stage-accent);color:color-mix(in srgb,var(--stage-accent) 76%,#1d3038)}
 .ir .tabs button{color:#68767a}.ir .tabs .active{color:#517831;border-bottom-color:#91ba55;font-weight:500}
 .ir button,.ir a{color:#52665a}.ir button.primary{background:#a8cd77;color:#2e4323}.ir button.danger{color:#ac6d5a}


 /* Fixed top alignment keeps every circle centered on the connector, regardless of status text. */
 .ir .step{justify-content:flex-start;min-height:86px;padding:5px 3px;color:var(--stage-accent);line-height:1.6}
 .ir .step.warn,.ir .step.done{color:var(--stage-accent)}
 .ir .step i,.ir .step.warn i{box-sizing:border-box;flex:none;width:32px;height:32px;margin:0 0 8px;background:linear-gradient(140deg,var(--stage-soft),color-mix(in srgb,var(--stage-accent) 20%,white));border-color:var(--stage-accent);color:var(--stage-accent);font-size:13px;font-weight:650;line-height:1;box-shadow:0 2px 7px color-mix(in srgb,var(--stage-accent) 13%,transparent)}
 .ir .step.done i{background:var(--stage-accent);border-color:var(--stage-accent);color:#fff;box-shadow:0 3px 9px color-mix(in srgb,var(--stage-accent) 23%,transparent)}
 .ir .step:not(:last-child):after{top:21px;left:calc(50% + 23px);width:calc(100% - 46px);height:2px;transform:translateY(-50%);border:0;background:linear-gradient(90deg,color-mix(in srgb,var(--stage-accent) 50%,white),color-mix(in srgb,var(--stage-accent) 20%,white))}
 .ir .step-status{color:#a27118;font-weight:400}
 .ir button.danger{background:#ef4444;border-color:#ef4444;color:#fff;box-shadow:0 3px 9px #ef444420}
 .ir button.danger:hover:not(:disabled){background:#dc2626;border-color:#dc2626;color:#fff}
 .ir button.danger:focus-visible{outline:2px solid #f87171;outline-offset:3px}
 .ir button.danger:disabled{opacity:.45;box-shadow:none}


 .ir .export-report{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:9px 15px;border:1px solid #d5dfcc;border-radius:11px;background:linear-gradient(135deg,#fff,#f0f6e8);color:#52723a;font-size:13px;font-weight:500;text-decoration:none;line-height:1.5;transition:background .18s,border-color .18s}
 .ir .export-report svg{width:16px;height:16px;flex:none}
 .ir .export-report:hover{background:#eaf2e0;border-color:#b3c69d;color:#46662f}
 .ir a.export-report:focus-visible{outline:2px solid #92b36e;outline-offset:3px}
 .ir button.danger{background:#d65a55;border-color:#d65a55;color:#fff;box-shadow:none}
 .ir button.danger:hover:not(:disabled){background:#c64c48;border-color:#c64c48;color:#fff}
 .ir button.danger:focus-visible{outline-color:#e39b97}


 /* Model-list inspired event surfaces: colored start, clean white finish. */
 .ir .case{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 10%,white) 0%,color-mix(in srgb,var(--case-accent) 4%,white) 48%,#fff 90%);border-color:color-mix(in srgb,var(--case-accent) 23%,#edf0ed);border-radius:13px;box-shadow:none}
 .ir .case:hover{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 14%,white),#fff 92%);border-color:color-mix(in srgb,var(--case-accent) 43%,white);box-shadow:0 3px 10px color-mix(in srgb,var(--case-accent) 6%,transparent)}
 .ir .case.active{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 16%,white) 0%,color-mix(in srgb,var(--case-accent) 6%,white) 48%,#fff 94%);border-color:color-mix(in srgb,var(--case-accent) 60%,white);box-shadow:inset 2px 0 var(--case-accent),0 2px 8px color-mix(in srgb,var(--case-accent) 5%,transparent)}
 .ir .case-type{background:color-mix(in srgb,var(--case-accent) 9%,white);border-color:color-mix(in srgb,var(--case-accent) 18%,white)}


 /* Dedicated stage emblems retain their identity after completion. */
 .ir .steps{--step-node-size:40px}
 .ir .step{min-height:96px}
 .ir .step i,.ir .step.warn i,.ir .step.done i{position:relative;width:var(--step-node-size);height:var(--step-node-size);border-style:solid;background:linear-gradient(140deg,#fff,color-mix(in srgb,var(--stage-accent) 20%,white));color:var(--stage-accent);border-color:color-mix(in srgb,var(--stage-accent) 56%,white)}
 .ir .step i>[data-stage-icon]{width:26px;height:26px;display:block}
 .ir .step.done i{background:linear-gradient(140deg,var(--stage-soft),color-mix(in srgb,var(--stage-accent) 27%,white));border-color:var(--stage-accent)}
 .ir .step:not(:last-child):after{top:calc(5px + var(--step-node-size) * .5);left:calc(50% + var(--step-node-size) * .5 + 7px);width:calc(100% - var(--step-node-size) - 14px)}
 .ir .stage-completed{position:absolute;right:-4px;bottom:-3px;display:grid;place-items:center;width:15px;height:15px;border:2px solid #fff;border-radius:50%;background:var(--stage-accent);color:#fff;box-sizing:content-box}
 .ir .stage-completed svg{display:block;width:11px;height:11px}
 @media(max-width:550px){.ir .steps{--step-node-size:34px}.ir .step i>[data-stage-icon]{width:23px;height:23px}}


 /* Shared typography hierarchy across investigation tabs and dialogs. */
 .ir{font-family:Inter,'Segoe UI','Microsoft YaHei',sans-serif;color:#35434b;font-size:13px;line-height:1.7}
 .ir h1{font-size:26px;font-weight:650;letter-spacing:-.4px;color:#263238}
 .ir h2,.ir .case-summary h2,.ir .dialog h2{font-size:19px;font-weight:650;line-height:1.5;letter-spacing:-.15px;color:#2d3940}
 .ir h3,.ir .timeline-head h3{font-size:15px;line-height:1.6;font-weight:650;color:#34434a;margin-bottom:8px}
 .ir p,.ir .investigation-body>p,.ir .settings-view p{font-size:13px;line-height:1.8;color:#75828a}
 .ir .head p,.ir .timeline-head p{font-size:12px;line-height:1.7;font-weight:400;color:#859097;margin:5px 0 0}
 .ir .tabs{gap:25px}
 .ir .tabs button{font-size:13px;font-weight:500;line-height:1.6;color:#7e8a91;padding:12px 2px}
 .ir .tabs button.active{font-weight:650;color:#63883e}
 .ir .step{font-size:12px;font-weight:500;line-height:1.6}
 .ir .case strong{font-size:13px;line-height:1.6;font-weight:600;letter-spacing:0}
 .ir .case .addr{font-size:12px;line-height:1.7;font-variant-numeric:tabular-nums}
 .ir .case small{font-size:11px;line-height:1.6}
 .ir .event{padding-left:24px;padding-bottom:25px}
 .ir .event time{display:inline-block;font-family:Inter,'Segoe UI',sans-serif;font-size:12px;line-height:20px;font-weight:500;letter-spacing:.1px;font-variant-numeric:tabular-nums;color:#849198}
 .ir .event b{display:inline-flex;align-items:center;vertical-align:middle;font-size:11px;line-height:18px;font-weight:600;letter-spacing:0;margin-left:10px;padding:1px 7px;border-radius:5px;background:#edf4e5;color:#6a884b}
 .ir .event p{font-size:13px;line-height:1.85;font-weight:400;color:#52636c;margin:8px 0 0;overflow-wrap:anywhere}
 .ir .notice,.ir .note,.ir .check-line{font-size:12px;line-height:1.85;font-weight:400}
 .ir .field{font-size:13px;font-weight:500;color:#5d6d76;line-height:1.6}
 .ir input,.ir select,.ir textarea{font-size:13px;font-weight:400;color:#41525c}
 .ir .evidence strong,.ir .hostitem strong{font-size:13px;font-weight:600;line-height:1.7;color:#41525b}
 .ir .evidence p,.ir .hostitem p{font-size:12px;color:#829097;line-height:1.7}
 .ir code{font-family:Consolas,'SFMono-Regular',monospace;font-size:11px;line-height:1.8;color:#7d8b93;font-variant-numeric:tabular-nums}
 .ir pre{font-family:Inter,'Segoe UI','Microsoft YaHei',sans-serif;font-size:13px;line-height:1.95;color:#52616a}
 .ir .badge{font-size:11px;font-weight:600;line-height:1.6}
 .ir .tools button,.ir .tools a,.ir .timeline-head button,.ir .sample-actions button{font-size:12px;font-weight:500;line-height:1.6}


 .ir button.primary,.ir a.export-report,.ir .native-scene-launch .atlas-workbench-entry{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:9px 16px;border:1px solid #9bc967;border-radius:10px;background:linear-gradient(120deg,#b6e583,#9dd464);color:#314e20;font-family:inherit;font-size:13px;font-weight:600;line-height:1.4;text-decoration:none;box-shadow:0 3px 9px #648c351a;transition:background .18s,border-color .18s,box-shadow .18s,transform .18s}
 .ir button.primary:hover:not(:disabled),.ir a.export-report:hover:not(:disabled),.ir .native-scene-launch .atlas-workbench-entry:hover:not(:disabled){background:linear-gradient(120deg,#a8dc71,#90c956);border-color:#8fbe5b;color:#314e20;box-shadow:0 4px 12px #648c3529;transform:translateY(-1px)}
 .ir button.primary:active:not(:disabled),.ir a.export-report:active:not(:disabled),.ir .native-scene-launch .atlas-workbench-entry:active:not(:disabled){background:linear-gradient(120deg,#9fd267,#88bf51);box-shadow:0 1px 3px #648c3520;transform:translateY(0)}
 .ir button.primary:focus-visible,.ir a.export-report:focus-visible,.ir .native-scene-launch .atlas-workbench-entry:focus-visible{outline:3px solid #99c96766;outline-offset:3px}
 .ir button.primary:disabled,.ir a.export-report:disabled,.ir .native-scene-launch .atlas-workbench-entry:disabled{opacity:.45;box-shadow:none;transform:none;cursor:not-allowed}


 /* Secondary controls and destructive actions use the shared type scale. */
 .ir button,.ir .tools button,.ir .tools a,.ir .timeline-head button,.ir .sample-actions button{font-family:Inter,'Segoe UI','Microsoft YaHei',sans-serif;font-size:13px;font-weight:600;line-height:1.5;letter-spacing:.1px}
 .ir button:not(.primary):not(.danger):not(.case){color:#52656a}
 .ir .tabs button{font-size:13px;font-weight:500;letter-spacing:0}
 .ir .tabs button.active{font-weight:650;color:#63883e}
 .ir button.danger{background:#faeaea;border:1px solid #faeaea;color:#d54e43;font-size:13px;font-weight:600;box-shadow:none}
 .ir button.danger:hover:not(:disabled){background:#f6dedd;border-color:#f1cecb;color:#c64036;box-shadow:none}
 .ir button.danger:active:not(:disabled){background:#f1d1cf;color:#ba392f;transform:translateY(0)}
 .ir button.danger:focus-visible{outline:3px solid #edb5b066;outline-offset:3px}

  /* Evidence report reading surface. */
 .ir .report-document{margin-top:22px;padding:28px 30px;border:1px solid #dfe7d8;border-radius:16px;background:linear-gradient(145deg,#fcfef9,#fff 45%);color:#374b3c;min-width:0;font-size:14px;line-height:1.95;overflow-wrap:anywhere}
 .ir .report-document :is(p,li,td,th,blockquote){font-size:14px;line-height:1.95;color:#526354;font-weight:400}
 .ir .report-document p{margin:12px 0}.ir .report-document :is(h1,h2,h3,h4){color:#2e4531;font-weight:650;line-height:1.55;letter-spacing:0;scroll-margin-top:20px}
 .ir .report-document h1{font-size:23px;margin:0 0 24px}.ir .report-document h2{font-size:18px;margin:30px 0 14px;padding-bottom:10px;border-bottom:1px solid #e2eadc}.ir .report-document h3{font-size:16px;margin:23px 0 10px}.ir .report-document h4{font-size:14px;margin:20px 0 8px}
 .ir .report-document :is(strong,b){font-weight:650;color:#304c36}.ir .report-document :is(ul,ol){padding-left:25px;margin:14px 0;list-style-position:outside}.ir .report-document ul{list-style-type:disc}.ir .report-document ol{list-style-type:decimal}.ir .report-document li{padding-left:3px;margin:7px 0}.ir .report-document li::marker{color:#6e9652;font-weight:600}
 .ir .report-document blockquote{border-left:3px solid #9dc575;background:#f0f6e9;padding:10px 17px;margin:18px 0;border-radius:0 9px 9px 0}.ir .report-document blockquote p{margin:3px 0}
 .ir .report-document code{font-family:'Cascadia Mono',Consolas,monospace;font-size:12px;line-height:1.8;background:#edf3e7;color:#426039;padding:2px 5px;border-radius:5px;white-space:break-spaces;overflow-wrap:anywhere}
 .ir .report-document pre{font-family:'Cascadia Mono',Consolas,monospace;background:#f2f5ef;border:1px solid #dfe6d9;padding:16px 18px;margin:18px 0;overflow:auto;white-space:pre;word-break:normal;max-width:100%;border-radius:10px}.ir .report-document pre code{font-size:12px;background:none;padding:0;white-space:pre;overflow-wrap:normal;color:#3b5140}
 .ir .report-document table{display:block;width:100%;max-width:100%;overflow-x:auto;border-collapse:collapse;margin:18px 0;border:1px solid #e0e7db;border-radius:9px}.ir .report-document :is(th,td){padding:10px 13px;text-align:left;vertical-align:top;border:1px solid #e0e7db;min-width:100px;font-size:13px}.ir .report-document th{background:#edf4e5;color:#385333;font-weight:600}.ir .report-document tr:nth-child(even) td{background:#f8faf5}
 .ir .report-document hr{height:1px;border:0;background:#e1e8dc;margin:26px 0}.ir .report-document a{color:#527f35;text-decoration:underline;text-decoration-color:#a9c58d;text-underline-offset:3px}.ir .report-document a:hover{color:#315d1f}.ir .report-document .report-evidence-link{font-size:12px;font-family:Consolas,monospace}
 .ir .report-view-toggle{display:flex;gap:4px;padding:3px;background:#f0f4ec;border:1px solid #e0e7db;border-radius:10px;margin-left:auto}.ir .report-view-toggle button{min-height:30px;padding:4px 12px;background:transparent;border:0;border-radius:7px}.ir .report-view-toggle button[aria-pressed=true]{background:#fff;color:#456d30;box-shadow:0 1px 4px #263d1910;font-weight:600}
 .ir .report-empty{padding:clamp(22px,4vw,35px);text-align:center;border:1px dashed rgb(var(--ui-border));border-radius:14px;background:color-mix(in srgb,rgb(var(--ui-selected)) 32%,rgb(var(--ui-surface)));margin:20px 0 12px;color:rgb(var(--ui-secondary))}
 @media(max-width:850px){.ir .report-document{padding:20px 17px}.ir .report-document h1{font-size:20px}.ir .report-view-toggle{margin-left:0}}


 .ir .report-preview{display:flex;align-items:center;gap:20px;padding:26px;border:1px solid #dce7d2;border-radius:17px;background:radial-gradient(ellipse at 0 0,#e9f3dc88,transparent 65%),#fcfef9;margin:4px 0 18px}
 .ir .report-preview-icon{--stage-soft:#edf7e7;display:grid;place-items:center;flex:none;width:52px;height:56px;background:linear-gradient(145deg,#e7f4d7,#f6faef);border:1px solid #d4e7bf;border-radius:14px;color:#669d3c}.ir .report-preview-icon svg{width:33px;height:33px}
 .ir .report-preview-copy{flex:1;min-width:0}.ir .report-preview-copy h3{font-size:17px;color:#344c2d;margin:0 0 6px}.ir .report-preview-copy p{margin:0 0 8px;font-size:13px;color:#7a8e6a}.ir .report-preview-copy small{font-size:12px;color:#8b9a7e}
 .ir .report-dialog{position:fixed;inset:0;margin:auto;width:min(1180px,calc(100vw - 48px));height:min(90dvh,1050px);max-width:none;max-height:calc(100dvh - 32px);border:1px solid #dce6d4;border-radius:22px;padding:0;background:#f7faf4;color:#344733;box-shadow:0 24px 90px #13230f38;overflow:hidden;animation:ir-report-enter .22s ease}
 .ir .report-dialog[open]{display:flex;flex-direction:column}.ir .report-dialog::backdrop{background:#14251c66;backdrop-filter:blur(5px)}
 .ir .report-dialog-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:23px 28px;background:linear-gradient(120deg,#edf5e4,#fff 80%);border-bottom:1px solid #e0e8d9;flex:none}.ir .report-dialog-heading{display:flex;align-items:center;gap:16px;min-width:0}.ir .report-dialog-heading>div:last-child{min-width:0}.ir .report-dialog-heading span{font-size:9px;letter-spacing:1.8px;color:#8aa374}.ir .report-dialog-heading h2{font-size:21px;font-weight:650;line-height:1.5;margin:3px 0;color:#304a2b}.ir .report-dialog-heading p{font-size:12px;margin:2px 0 0;line-height:1.6;color:#819174;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:760px}.ir .report-close{width:36px;height:36px;min-height:36px;display:grid;place-items:center;padding:0;border-color:#dfe7d8;background:#ffffffaa;border-radius:10px;flex:none}
 .ir .report-dialog-toolbar{display:flex;align-items:center;gap:12px;padding:12px 28px;border-bottom:1px solid #e1e8dc;background:#fff;flex:none}.ir .report-dialog-toolbar .report-view-toggle{margin:0}.ir .report-dialog-toolbar select{width:auto;max-width:300px;padding:6px 30px 6px 12px;min-height:34px;font-size:12px;background-color:#f8faf5}.ir .report-dialog-toolbar .export-report{margin-left:auto;min-height:34px;padding:6px 12px;font-size:12px}
 .ir .report-dialog-body{min-height:0;flex:1;overflow:auto;overscroll-behavior:contain;padding:24px 28px 32px;scrollbar-width:thin;scrollbar-color:#cbd9bf transparent}.ir .report-dialog-body .report-document{margin:0;padding:28px 34px;background:#fff}.ir .report-dialog-body .report-source{margin:0;font:13px/1.9 'Cascadia Mono',Consolas,monospace;color:#43553b;background:#fff;padding:24px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
 @keyframes ir-report-enter{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
 @media(prefers-reduced-motion:reduce){.ir .report-dialog{animation:none}}
 @media(max-width:700px){.ir .report-preview{flex-wrap:wrap;padding:20px;gap:14px}.ir .report-preview>.primary{width:100%}.ir .report-dialog{width:calc(100vw - 20px);height:94dvh;border-radius:16px}.ir .report-dialog-header{padding:16px}.ir .report-dialog-heading h2{font-size:18px}.ir .report-dialog-heading .report-preview-icon{width:40px;height:44px}.ir .report-dialog-toolbar{padding:10px 14px;flex-wrap:wrap;gap:8px}.ir .report-dialog-toolbar select{max-width:170px;flex:1}.ir .report-dialog-body{padding:14px}.ir .report-dialog-body .report-document{padding:20px 17px}}

 .ir .sample-review-result{margin-top:17px;padding:16px 18px;border:1px solid #dce6d3;border-radius:12px;background:linear-gradient(125deg,#edf5e5aa,#fff)}.ir .sample-review-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.ir .sample-review-head strong{font-size:13px;color:#425d35}.ir .sample-review-head span{font-size:11px;font-weight:600;border-radius:6px;padding:2px 8px;background:#e8f3df;color:#52773a}.ir .sample-review-result[data-verdict=malicious] .sample-review-head span{background:#fbe9e7;color:#b14e47}.ir .sample-review-result[data-verdict=suspicious] .sample-review-head span{background:#fbf1db;color:#9c741e}.ir .sample-review-result[data-verdict=insufficient] .sample-review-head span{background:#edf0ec;color:#71806b}.ir .sample-review-result p{font-size:13px;color:#576b4e;line-height:1.85;margin:9px 0}.ir .sample-review-result small{font-size:11px;color:#8b987f}.ir .sample-review-result .sample-actions{margin-top:12px}.ir .sample-review-result>button{margin-top:5px}

 .ir .investigation-nav{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding-top:22px;margin-top:20px;border-top:1px solid #e0e8d8}.ir .investigation-nav button{display:flex;align-items:center;justify-content:center;gap:9px;padding:12px 7px;text-align:left;background:transparent;border:1px solid transparent;border-radius:12px;transition:background .18s,border-color .18s,transform .18s}.ir .investigation-nav button:hover{background:#f1f6e9;transform:translateY(-1px)}.ir .investigation-nav button.active{background:linear-gradient(130deg,#dceebf,#eff6e3);border-color:#bbd79a;color:#476b2c;box-shadow:0 3px 8px #42632208}.ir .investigation-nav i{--stage-soft:#eff6e3;display:grid;place-items:center;width:29px;flex:none;color:#6c8654}.ir .investigation-nav svg{width:29px;height:29px}.ir .investigation-nav span{min-width:0}.ir .investigation-nav strong{display:block;font-size:13px;font-weight:500;white-space:nowrap}.ir .investigation-nav .active strong{font-weight:700}.ir .investigation-nav small{display:block;font-size:10px;margin-top:4px;color:#869379}.ir .investigation-nav small[data-status=running]{color:#649434}.ir .investigation-nav small[data-status=partial],.ir .investigation-nav small[data-status=blocked]{color:#a27d35}.ir .rea-environment{display:flex;align-items:center;gap:16px;background:linear-gradient(120deg,#e9f0fc,#f5f8fd);padding:19px;border:1px solid #d5e1f1;border-radius:14px;margin-bottom:18px}.ir .rea-environment>svg{width:38px;height:38px;color:#4d76a6}.ir .rea-environment p{margin:5px 0;font-size:12px;line-height:1.7}.ir .rea-environment strong{font-size:14px}@media(max-width:1100px){.ir .investigation-nav{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.ir .investigation-nav button{transition:none}}

 .ir .evidence-browser{margin:20px 0 16px;padding:15px 17px;border:1px solid #dfe7d7;border-radius:14px;background:linear-gradient(130deg,#f4f8ee,#fff)}.ir .evidence-category-tabs{display:flex;gap:7px;flex-wrap:wrap;padding-bottom:13px;border-bottom:1px solid #e4eadf}.ir .evidence-category-tabs button{display:inline-flex;align-items:center;gap:8px;min-height:34px;padding:6px 11px;background:transparent;border:1px solid transparent;font-size:12px;color:#78866d;border-radius:9px}.ir .evidence-category-tabs button span{font-size:10px;padding:0 5px;border-radius:5px;background:#eaf0e4;color:#7b8c6b;min-width:19px;text-align:center}.ir .evidence-category-tabs button[aria-pressed=true]{background:#e5f0d7;border-color:#c8dcaf;color:#4f7134;font-weight:650}.ir .evidence-category-tabs button[aria-pressed=true] span{background:#cfe2b5;color:#45672d}.ir .evidence-category-tabs button:hover{border-color:#d7e3ca;background:#f1f6e9}.ir .evidence-search{display:flex;align-items:center;gap:12px;padding-top:13px}.ir .evidence-search label{display:flex;align-items:center;gap:9px;flex:1;min-width:0;background:#fff;border:1px solid #dee7d6;border-radius:9px;padding:0 11px}.ir .evidence-search label:focus-within{border-color:#95b972;box-shadow:0 0 0 2px #a7ca7d22}.ir .evidence-search label svg{width:17px;height:17px;color:#8b9f7b;flex:none}.ir .evidence-search input{border:0;background:none;min-width:0;width:100%;box-shadow:none;outline:none;padding:9px 0;font-size:12px}.ir .evidence-search small{font-size:11px;white-space:nowrap;color:#91a082}.ir .evidence-kind{font-size:11px;font-weight:500;color:#799163}.ir .evidence .body{min-width:0}.ir .evidence code{overflow-wrap:anywhere}@media(max-width:700px){.ir .evidence-search{flex-wrap:wrap}.ir .evidence-search label{min-width:200px}}

 /* Fresh foliage accents: clearer chroma without darkening the workspace. */
 .ir{--green:#a9d96d;--green-hover:#9dd05f;--green-ink:#427c23;--soft:#eef8df;--line:#dfebd6;background:radial-gradient(ellipse at 4% 0,#e9f8d988,transparent 45%),#f7faf4}
 .ir .stat:first-child{background:linear-gradient(125deg,#e8f7ce,#f3fae8);border-color:#d5eabb}.ir .stat:first-child:after{background:#7abc42;opacity:1}
 .ir .list{background:linear-gradient(170deg,#f7fbf1,#fcfdf9)}.ir .case{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 13%,white),color-mix(in srgb,var(--case-accent) 4%,white) 65%,#fff);border-color:color-mix(in srgb,var(--case-accent) 28%,white)}
 .ir .case.active{background:linear-gradient(115deg,color-mix(in srgb,var(--case-accent) 22%,white),color-mix(in srgb,var(--case-accent) 7%,white) 78%,#fff);border-color:color-mix(in srgb,var(--case-accent) 65%,white);box-shadow:inset 3px 0 var(--case-accent),0 3px 9px color-mix(in srgb,var(--case-accent) 7%,transparent)}
 .ir .case-type{background:color-mix(in srgb,var(--case-accent) 12%,white);border-color:color-mix(in srgb,var(--case-accent) 23%,white)}.ir .case strong{color:color-mix(in srgb,var(--case-accent) 70%,#17352b)}
 .ir .investigation-nav button i{color:#6ba83e}.ir .investigation-nav button.active{background:linear-gradient(125deg,#d9f1b3,#edf9df);border-color:#b5dc87;color:#397820;box-shadow:0 3px 8px #68a1370a}.ir .investigation-nav button.active i{--stage-soft:#e8f7d4;color:#4a972b}.ir .investigation-nav button.active small{color:#65854a}.ir .investigation-nav small[data-status=completed]{color:#5b9732}
 .ir .investigation-body .notice{background:linear-gradient(115deg,#eef8e0,#f7fbef);border-color:#d8e9c3;color:#607c48}.ir .evidence{background:linear-gradient(125deg,#f0f8e9,#fcfef9 70%);border-color:#dcebcf}.ir .evidence>svg{color:#6bb239}.ir .investigation-body .evidence strong{color:#416c2d}.ir .investigation-body .evidence p{color:#6b8059}.ir .investigation-body .evidence code{color:#728765}
 .ir .sample-review-result{background:linear-gradient(120deg,#eaf6dc,#fcfef8);border-color:#d4e7bc}.ir .sample-review-head strong{color:#48752d}.ir .sample-review-head span{background:#ddefc9;color:#48782b}
 .ir button.primary,.ir a.export-report{background:linear-gradient(125deg,#b2df77,#a0d264);border-color:#9dce61;color:#2e4f1c;box-shadow:0 3px 8px #6f9b3320}.ir button.primary:hover:not(:disabled),.ir a.export-report:hover{background:linear-gradient(125deg,#a7d96a,#95ca56);border-color:#8bbf4a;color:#294a17}
 .ir .investigation-body .sample-actions button:not(.primary){background:linear-gradient(125deg,#f0f8e6,#fcfef8);border-color:#cfe3b6;color:#528332}.ir .investigation-body .sample-actions button:not(.primary):hover:not(:disabled){background:#e8f5d7;border-color:#b5d28f;color:#3e7122}
 .ir .evidence-category-tabs button[aria-pressed=true]{background:linear-gradient(120deg,#e1f3c5,#eef9e1);border-color:#bddc96;color:#48752a}.ir .evidence-category-tabs button[aria-pressed=true] span{background:#cce7a8;color:#3f6c21}

 .ir .status-update{background:linear-gradient(125deg,#eff9e3,#fff);border-color:#c5e29f;color:#497c28;font-weight:600}.ir .status-dialog{width:min(620px,94vw)}.ir .status-current{display:flex;align-items:center;gap:14px;padding:15px 18px;background:linear-gradient(120deg,#e8f6d6,#f7fcef);border:1px solid #d4e9ba;border-radius:12px;margin-bottom:20px;font-size:12px;color:#7d9369}.ir .status-current strong{color:#4f7b31;font-size:13px;font-weight:600}.ir .status-current>span{color:#8eb768;font-size:17px}.ir .status-report-needed{color:#a6782e;font-size:12px}.ir .case-status[data-status=closed]{color:#398568}.ir .case-status[data-status=investigating]{color:#57942d}.ir .list-search select{width:100%;margin-top:8px;min-height:32px;padding:6px 30px 6px 10px;font-size:11px;border-color:#dbe8cf;background-color:#f5faed;color:#688050}.ir .case-summary .archive-fact{font-size:11px;color:#548064}

 .ir .source-device-line{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-top:9px;font-size:11px;color:#839673}.ir .source-device-line strong{font-size:11px;font-weight:600;color:#4d7d31}.ir .source-query-notice{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px}.ir .source-query-notice button{margin-left:auto;min-height:30px;padding:4px 10px;font-size:11px}

 .ir .device-source-picker{position:relative;margin-top:5px}.ir button.source-picker-trigger{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;text-align:left;padding:11px 14px;background:linear-gradient(120deg,var(--vendor-soft),#fff 85%);border:1px solid color-mix(in srgb,var(--vendor-accent) 25%,white);border-radius:12px;color:var(--vendor-accent);transform:none}.ir .source-picker-trigger[aria-expanded=true]{border-color:var(--vendor-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--vendor-accent) 10%,transparent)}.ir .source-picker-trigger>svg:not(.source-picker-chevron){width:26px;height:26px;flex:none}.ir .source-picker-trigger>span:not(.source-vendor-logo){flex:1;min-width:0;font-size:13px}.ir .source-picker-trigger strong{display:block;font-size:14px;font-weight:600;color:var(--vendor-accent)}.ir .source-picker-trigger small{display:block;font-size:11px;margin-top:3px;color:#7c8b7b}.ir .source-picker-chevron{width:18px;height:18px;margin-left:auto;flex:none;transition:transform .18s}.ir [aria-expanded=true] .source-picker-chevron{transform:rotate(180deg)}
 .ir .source-vendor-logo{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;background:#fff;border:1px solid color-mix(in srgb,var(--vendor-accent) 15%,white);padding:6px;flex:none;box-sizing:border-box}.ir .source-vendor-logo img{display:block;width:100%;height:100%;object-fit:contain}.ir .source-vendor-logo b{display:none;color:var(--vendor-accent)}.ir .source-vendor-logo.image-failed b{display:block}.ir .source-vendor-logo>svg{width:23px;height:23px}
 .ir .source-picker-options{margin-top:9px;max-height:320px;overflow:auto;overscroll-behavior:contain;padding:7px;background:#fff;border:1px solid #e0e9d9;border-radius:14px;box-shadow:0 7px 22px #263c1910;scrollbar-width:thin;scrollbar-color:#c7d9b8 transparent;animation:ir-enter .16s ease}.ir .source-picker-options button{display:flex;align-items:center;gap:12px;width:100%;margin-bottom:6px;padding:11px 12px;min-height:64px;border-radius:10px;text-align:left;background:linear-gradient(110deg,var(--vendor-soft),#fff 90%);border:1px solid color-mix(in srgb,var(--vendor-accent) 18%,white);transform:none;box-shadow:none}.ir .source-picker-options button:last-child{margin-bottom:0}.ir .source-picker-options button:hover,.ir .source-picker-options button:focus-visible{border-color:color-mix(in srgb,var(--vendor-accent) 65%,white);outline:0;background:linear-gradient(110deg,color-mix(in srgb,var(--vendor-accent) 14%,white),#fff)}.ir .source-picker-options button[aria-selected=true]{border-color:var(--vendor-accent);box-shadow:inset 3px 0 var(--vendor-accent)}.ir .source-option-copy{flex:1;min-width:0}.ir .source-option-copy strong{display:block;font-size:13px;font-weight:600;color:var(--vendor-accent)}.ir .source-option-copy small{display:block;font-size:10px;line-height:1.6;color:#869187;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px}.ir .source-adapter-badge{font-size:10px;border-radius:6px;padding:3px 6px;white-space:nowrap;font-weight:500;background:#f4f5f1;color:#8a9383}.ir .source-adapter-badge.ready{background:#e6f5d8;color:#5c8d35}.ir .source-choice-check{width:18px;height:18px;color:var(--vendor-accent);flex:none}
 @media(max-width:550px){.ir .source-picker-options button{gap:8px;padding:10px 8px}.ir .source-picker-options{max-height:260px}.ir .source-adapter-badge{font-size:9px}}

 .ir .analysis-platform-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:25px}.ir .analysis-platform-tabs button{display:flex;align-items:center;gap:13px;text-align:left;padding:17px 18px;min-height:88px;background:linear-gradient(115deg,var(--analysis-soft),#fff);border:1px solid color-mix(in srgb,var(--analysis-accent) 20%,white);color:var(--analysis-accent);border-radius:15px}.ir .analysis-platform-tabs button[aria-selected=true]{border-color:var(--analysis-accent);box-shadow:inset 0 -3px var(--analysis-accent),0 4px 14px color-mix(in srgb,var(--analysis-accent) 10%,transparent)}.ir .analysis-platform-tabs img{width:38px;height:38px;object-fit:contain}.ir .analysis-platform-tabs span{flex:1}.ir .analysis-platform-tabs strong{display:block;font-size:15px;font-weight:650}.ir .analysis-platform-tabs small{display:block;font-size:11px;color:#7b8490;margin-top:3px}.ir .analysis-platform-tabs i{font-style:normal;font-size:11px;white-space:nowrap}
 .ir .analysis-brand-head{display:flex;align-items:center;gap:12px;margin-bottom:17px}.ir .analysis-brand-head>img{width:32px;height:32px;object-fit:contain}.ir .analysis-brand-head h3{margin:0;color:var(--analysis-accent);font-size:17px;font-weight:650}.ir .analysis-brand-head p{margin:3px 0 0;font-size:12px;color:#7b8490}.ir .analysis-notice{padding:15px 18px;border-radius:12px;margin-bottom:18px;background:linear-gradient(110deg,var(--analysis-soft),#fff);border:1px solid color-mix(in srgb,var(--analysis-accent) 17%,white);color:color-mix(in srgb,var(--analysis-accent) 75%,#48505b);font-size:13px;line-height:1.85}
 .ir .external-analysis .evidence.analysis-sample{background:linear-gradient(115deg,var(--analysis-soft),#fff 95%);border:1px solid color-mix(in srgb,var(--analysis-accent) 20%,white);padding:20px;border-radius:14px;box-shadow:none}.ir .analysis-sample>svg{color:var(--analysis-accent)}.ir .analysis-sample strong{color:color-mix(in srgb,var(--analysis-accent) 70%,#26333d);font-size:14px;font-weight:650}.ir .analysis-sample code{display:block;margin-top:8px;overflow-wrap:anywhere;font-size:12px;color:#7d8690;background:transparent}.ir .external-analysis .analysis-sample button,.ir .external-analysis .analysis-sample a{color:var(--analysis-accent);border-color:color-mix(in srgb,var(--analysis-accent) 26%,white);background:#ffffffb8}.ir .external-analysis .analysis-sample button:hover{background:var(--analysis-soft);border-color:var(--analysis-accent)}.ir .external-analysis .analysis-sample button.analysis-submit{background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-accent) 17%,white),var(--analysis-soft));font-weight:600}.ir .external-analysis .analysis-results-title{font-size:14px;margin:26px 0 12px;color:#4e5860}
 @media(max-width:650px){.ir .analysis-platform-tabs{grid-template-columns:1fr}.ir .analysis-platform-tabs button{min-height:74px;padding:13px}.ir .analysis-platform-tabs strong{font-size:14px}}

 .ir .investigation-body .external-analysis .analysis-sample strong{color:#343f4b;font-weight:650}.ir .investigation-body .external-analysis .analysis-sample code{color:#77808e;font-weight:400}.ir .investigation-body .external-analysis .analysis-sample p{color:#77808e}.ir .investigation-body .external-analysis .sample-actions button:not(.primary),.ir .investigation-body .external-analysis .sample-actions a{color:var(--analysis-accent);border-color:color-mix(in srgb,var(--analysis-accent) 28%,white);background:linear-gradient(120deg,#fff,var(--analysis-soft))}.ir .investigation-body .external-analysis .sample-actions button:not(.primary):hover:not(:disabled){color:var(--analysis-accent);border-color:var(--analysis-accent);background:var(--analysis-soft)}.ir .investigation-body .external-analysis .sample-actions .analysis-submit:not(.primary){background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-accent) 17%,white),var(--analysis-soft));font-weight:600}
 .ir .analysis-brand-head>div{flex:1}.ir .external-analysis .analysis-official-link{display:inline-flex;align-items:center;gap:8px;flex:none;padding:9px 14px;border:1px solid color-mix(in srgb,var(--analysis-accent) 25%,white);border-radius:10px;color:var(--analysis-accent);font-size:12px;font-weight:600;background:linear-gradient(120deg,#fff,var(--analysis-soft))}.ir .external-analysis .analysis-official-link:hover{border-color:var(--analysis-accent);box-shadow:0 3px 12px color-mix(in srgb,var(--analysis-accent) 12%,transparent)}
 @media(max-width:650px){.ir .analysis-brand-head{flex-wrap:wrap}.ir .analysis-official-link{margin-left:44px}}


 .ir .external-analysis[data-provider=threatbook]{--analysis-border:#ead9d3;--analysis-fill:#efd8d0;--analysis-ink:#88483f}.ir .external-analysis[data-provider=virustotal]{--analysis-border:#dbe1ee;--analysis-fill:#dce4f4;--analysis-ink:#405782}
 .ir .external-analysis .analysis-platform-tabs button{background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-soft) 65%,white),#fff);border-color:color-mix(in srgb,var(--analysis-accent) 18%,white);color:#43505c;box-shadow:none}.ir .external-analysis .analysis-platform-tabs button[aria-selected=true]{background:linear-gradient(115deg,color-mix(in srgb,var(--analysis-accent) 11%,white),var(--analysis-soft) 65%,#fff);border-color:color-mix(in srgb,var(--analysis-accent) 48%,white);box-shadow:0 3px 12px color-mix(in srgb,var(--analysis-accent) 7%,transparent)}.ir .external-analysis .analysis-platform-tabs button:hover{border-color:color-mix(in srgb,var(--analysis-accent) 42%,white);background:var(--analysis-soft)}.ir .external-analysis .analysis-platform-tabs strong{color:color-mix(in srgb,var(--analysis-accent) 76%,#303c48)}.ir .external-analysis .analysis-platform-tabs small{color:#828792}.ir .external-analysis .analysis-platform-tabs i{color:#828792}
 .ir .external-analysis .analysis-brand-head h3{color:var(--analysis-ink)}.ir .external-analysis .analysis-notice{background:linear-gradient(115deg,var(--analysis-soft),#fdfdfc);border-color:var(--analysis-border);color:#747c85}.ir .investigation-body .external-analysis .evidence.analysis-sample{background:linear-gradient(115deg,var(--analysis-soft),#fff 90%);border-color:var(--analysis-border)}.ir .investigation-body .external-analysis .analysis-sample>svg{color:var(--analysis-accent)}.ir .investigation-body .external-analysis .analysis-sample strong{color:#343f4b}.ir .investigation-body .external-analysis .analysis-sample code{color:#7b818b}
 .ir .investigation-body .external-analysis .sample-actions button:not(.primary),.ir .investigation-body .external-analysis .sample-actions a{color:var(--analysis-ink);border-color:var(--analysis-border);background:#ffffffd9}.ir .investigation-body .external-analysis .sample-actions button:not(.primary):hover:not(:disabled){color:var(--analysis-ink);border-color:color-mix(in srgb,var(--analysis-accent) 48%,white);background:var(--analysis-soft)}.ir .investigation-body .external-analysis .sample-actions button.analysis-submit:not(.primary){background:linear-gradient(120deg,var(--analysis-fill),var(--analysis-soft));border-color:color-mix(in srgb,var(--analysis-accent) 25%,white);color:var(--analysis-ink);box-shadow:none}.ir .investigation-body .external-analysis .sample-actions button.analysis-submit:not(.primary):hover:not(:disabled){background:linear-gradient(120deg,color-mix(in srgb,var(--analysis-accent) 24%,white),var(--analysis-fill));color:var(--analysis-ink)}.ir .external-analysis .analysis-official-link{background:#fff;border-color:var(--analysis-border);color:var(--analysis-ink);box-shadow:none}

 /* Investigation rails and report chrome follow the same theme as the event register. */
 html[data-theme-skin] .ir[data-aegis-scene=incident]{--ir-accent:var(--skin-accent,var(--night-green,#47632e));--ir-surface:rgb(var(--ui-surface));--ir-track:rgb(var(--ui-subtle));--ir-thumb:color-mix(in srgb,var(--ir-accent) 76%,var(--ir-track))}
 html[data-theme-skin] .ir[data-aegis-scene=incident] :is(.case-scroll,.investigation-body,.report-dialog-body,.source-picker-options){scrollbar-color:var(--ir-thumb) var(--ir-track)}
 html[data-theme-skin] .ir[data-aegis-scene=incident] .report-preview{background:linear-gradient(115deg,rgb(var(--ui-selected)),var(--ir-surface) 78%)!important;border-color:var(--skin-outline,rgb(var(--ui-border)))!important}
 html[data-theme-skin] .ir[data-aegis-scene=incident] .report-preview .report-preview-icon{--stage-soft:rgb(var(--ui-selected));background:var(--stage-soft)!important;border-color:rgb(var(--ui-border))!important;color:var(--ir-accent)!important}
 html[data-theme-skin] .ir[data-aegis-scene=incident] .report-preview-copy h3{color:rgb(var(--ui-text))!important}
 html[data-theme-skin] .ir[data-aegis-scene=incident] .report-preview-copy :is(p,small){color:rgb(var(--ui-secondary))!important}
 /* Full-width event register; investigation no longer competes with a sidebar. */
 .ir .incident-ledger,.ir .incident-ledger-toolbar,.ir .incident-ledger-table-wrap,.ir .incident-ledger-footer{min-width:0}
 .ir .incident-ledger{--ledger-selected:rgb(var(--ui-selected));--ledger-surface:rgb(var(--ui-surface));--ledger-raised:rgb(var(--ui-subtle));--ledger-ink:rgb(var(--ui-text));--ledger-secondary:rgb(var(--ui-secondary));--ledger-line:rgb(var(--ui-border));--ledger-accent:var(--skin-accent,var(--night-green,#47632e));display:grid;gap:14px;color:var(--ledger-ink)}
 .ir .incident-ledger-nav,.ir .incident-ledger-toolbar,.ir .incident-ledger-table-wrap{border:1px solid var(--ledger-line);border-radius:14px;background:var(--ledger-surface)}
 .ir .incident-ledger-nav{display:flex;flex-wrap:wrap;gap:5px;padding:6px;background:var(--ledger-raised)}
 .ir .incident-ledger-nav button[aria-pressed=true]{background:var(--ledger-selected)!important;border-color:var(--skin-outline,var(--ledger-line))!important;color:var(--ledger-accent)!important;font-weight:650!important}
 .ir .incident-ledger-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:12px 14px}
 .ir .incident-ledger-search{position:relative;flex:0 1 350px;min-width:min(100%,220px)}
 .ir .incident-ledger-search svg{position:absolute;inset-inline-start:11px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--ledger-secondary)}
 .ir .incident-ledger-toolbar .incident-ledger-search input{width:100%;padding-inline-start:38px!important}
 .ir .incident-ledger-table-wrap{overflow:hidden}
 .ir .incident-ledger table{width:100%;border-collapse:collapse;text-align:start}
 .ir .incident-ledger thead{background:var(--ledger-raised);color:var(--ledger-secondary)}
 .ir .incident-ledger :is(th,td){padding:14px;text-align:start}
 .ir .incident-ledger th{font-size:12px;font-weight:650;white-space:nowrap}
 .ir .incident-ledger td{border-top:1px solid var(--ledger-line);overflow-wrap:anywhere}
 .ir .incident-ledger tbody td:first-child{border-inline-start:3px solid var(--event-type,transparent)}
 .ir .incident-ledger tbody td:first-child strong{color:var(--event-accent);display:block;font-size:14px;line-height:1.5}
 .ir .incident-ledger td small{display:block;margin-top:4px;font-size:11px;color:var(--ledger-secondary)}
 .ir .incident-ledger .incident-event-type,.ir .incident-ledger .incident-event-state{display:inline-block;padding:3px 8px;border-radius:999px;background:var(--event-tint);color:var(--event-accent);white-space:nowrap;font-size:12px;font-weight:600}
 .ir .incident-ledger .incident-event-state{background:var(--ledger-raised);color:var(--ledger-secondary)}
 .ir .incident-ledger .incident-event-state[data-status=review]{background:var(--ledger-selected);color:var(--ledger-accent)}
 .ir .incident-ledger a.incident-open,.ir a.incident-back{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:5px 11px;border:1px solid rgb(var(--ui-border));border-radius:9px;background:rgb(var(--ui-surface));color:rgb(var(--ui-text));text-decoration:none;white-space:nowrap}
 .ir :is(a.incident-open,a.incident-back):hover{background:rgb(var(--ui-hover));color:var(--skin-accent,var(--night-green,#47632e))}
 .ir :is(a.incident-open,a.incident-back):focus-visible{outline:2px solid rgb(var(--ui-focus));outline-offset:2px}
 .ir .incident-ledger-footer{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:10px 14px;border-top:1px solid var(--ledger-line);color:var(--ledger-secondary)}
 .ir .incident-ledger-pagination{display:flex;align-items:center;gap:8px}
 .ir .incident-ledger .incident-ledger-empty td{padding:28px;text-align:center;color:var(--ledger-secondary);background:var(--ledger-surface)}
 .ir .incident-breadcrumb{display:flex;align-items:center;gap:10px;margin:0 0 12px;color:rgb(var(--ui-secondary))}
 .ir .layout.incident-detail-layout{display:block;height:auto;max-height:none;min-height:0;overflow:visible}
  .ir .incident-detail-layout:has(>.incident-case-workbench){background:none;border:0;border-radius:0;box-shadow:none}
 .ir .incident-detail-layout .detail{min-height:0;height:auto;overflow:visible}
 .ir .incident-detail-layout .investigation-body{min-height:280px;max-height:clamp(360px,65dvh,860px);flex:auto}
 @media(max-width:720px){
  .ir .incident-ledger :is(table,tbody){display:block}
  .ir .incident-ledger thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  .ir .incident-ledger tbody tr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px 14px;padding:14px;border-top:1px solid var(--ledger-line)}
  .ir .incident-ledger tbody td,.ir .incident-ledger tbody td:first-child{border:0;padding:0}
  .ir .incident-ledger tbody td:is(:first-child,:nth-child(3),:last-child){grid-column:1/-1}
  .ir .incident-ledger tbody td:is(:nth-child(2),:nth-child(3),:nth-child(4),:nth-child(5))::before{display:block;content:attr(data-label);margin-bottom:3px;font-size:11px;color:var(--ledger-secondary)}
  .ir .incident-ledger tbody td:last-child{text-align:end}
  .ir .incident-ledger tbody .incident-ledger-empty td{text-align:center}
  .ir .incident-ledger-search{flex:1 1 100%}
 }

 /* Keep semantic event colors fixed; only the workspace controls follow the skin. */
 .ir:has(.incident-ledger){box-sizing:border-box;min-height:100dvh;display:flex;flex-direction:column}
 .ir .incident-ledger{display:flex;flex:1;flex-direction:column}
 .ir .incident-ledger-table-wrap{display:flex;flex:1;flex-direction:column}
 .ir .incident-ledger-footer{margin-top:auto}
 .ir .incident-ledger-toolbar select{width:auto;min-width:min(100%,164px);max-width:100%}
 .ir .incident-ledger :is(th,td){padding:16px 18px}
 .ir .incident-ledger td{height:70px}
 .ir .incident-ledger tbody tr[data-event-type]{--event-base:#fff;--event-zebra:#f6f8fa;--event-accent:var(--event-light-ink);--event-tint:var(--event-soft);--event-wash:var(--event-tint);background:linear-gradient(100deg,var(--event-wash),var(--event-base) 90%)}
 .ir .incident-ledger tbody tr[data-event-type]:nth-child(even){--event-wash:color-mix(in srgb,var(--event-tint) 36%,var(--event-zebra));background:linear-gradient(100deg,var(--event-wash),var(--event-zebra) 90%)}
 html.dark .ir .incident-ledger tbody tr[data-event-type]{--event-base:#1b2431;--event-zebra:#202a38;--event-accent:var(--event-dark-ink);--event-tint:color-mix(in srgb,var(--event-type) 19%,var(--event-base))}
 .ir .incident-ledger tbody tr[data-event-type]:is(:hover,:focus-within){--event-wash:color-mix(in srgb,var(--event-type) 16%,var(--event-tint));background:linear-gradient(100deg,var(--event-wash),var(--event-base) 90%)}
 .ir .incident-event-type::before{content:'';display:inline-block;width:6px;height:6px;margin-inline-end:5px;vertical-align:2px;border-radius:50%;background:currentColor}
 .ir :is(.incident-endpoints,.incident-event-date){display:inline-flex;align-items:center;flex-wrap:wrap;gap:5px;max-width:100%;font-variant-numeric:tabular-nums}
 .ir :is(.incident-endpoints,.incident-event-date)>svg{flex:none;color:var(--skin-accent,#47632e)}
 .ir :is(.incident-ip,.incident-event-date){box-sizing:border-box;border:1px solid rgb(var(--ui-border));border-radius:7px;background:rgb(var(--ui-surface));color:rgb(var(--ui-text));padding:4px 7px;font-size:12px;line-height:1.35}
 .ir .incident-ip{min-width:0;overflow-wrap:anywhere;font-family:ui-monospace,Consolas,monospace}
 .ir .incident-ip[data-endpoint=target]{background:rgb(var(--ui-subtle))}
 .ir .incident-clock-value{padding-inline-start:6px;border-inline-start:1px solid rgb(var(--ui-border));color:rgb(var(--ui-secondary));white-space:nowrap}
 .ir .incident-case-endpoints{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:9px;color:rgb(var(--ui-secondary))}
 .ir .incident-event-state::before{content:'';display:inline-block;width:6px;height:6px;margin-inline-end:5px;vertical-align:2px;border-radius:50%;background:currentColor}
 .ir .incident-ledger .incident-event-state:is([data-status=queued],[data-status=new]){color:#755224;background:#f9efdc}
 .ir .incident-ledger .incident-event-state:is([data-status=running],[data-status=investigating]){color:#315b91;background:#e7effb}
 .ir .incident-ledger .incident-event-state:is([data-status=failed],[data-status=interrupted]){color:#953e3b;background:#fae9e7}
 html.dark .ir .incident-ledger .incident-event-state:is([data-status=queued],[data-status=new]){color:#f3d4a1;background:#422f22}
 html.dark .ir .incident-ledger .incident-event-state:is([data-status=running],[data-status=investigating]){color:#b9d6ff;background:#263852}
 html.dark .ir .incident-ledger .incident-event-state:is([data-status=failed],[data-status=interrupted]){color:#ffc1ba;background:#482d35}
 .ir .incident-ledger a.incident-open{border-color:color-mix(in srgb,var(--ledger-accent) 24%,var(--ledger-line));background:var(--ledger-raised);color:var(--ledger-accent);font-weight:550}
 .ir .incident-ledger a.incident-open:is(:hover,:focus-visible){background:var(--ledger-selected)}
 html[data-theme-skin] .ir[data-aegis-scene=incident] .investigation-nav button:not(.active):is(:hover,:focus-visible){background:rgb(var(--ui-hover))!important;border-color:rgb(var(--ui-border))!important}
 html[data-theme-skin] .ir[data-aegis-scene=incident] .investigation-nav button:not(.active):is(:hover,:focus-visible) :is(strong,small){color:var(--ir-accent)!important}
 @media(max-width:720px){
  .ir .incident-ledger :is(th,td){height:auto}
  .ir .incident-ledger tbody tr[data-event-type]{border-inline-start:3px solid var(--event-type)}
 }
 /* Let the active theme show through the gutters without recoloring the cards. */
  html .ir[data-aegis-scene=incident] .incident-detail-layout .incident-case-workbench{--incident-card-gutter:color-mix(in srgb,rgb(var(--ui-selected)) 76%,rgb(var(--ui-canvas)));display:grid;min-width:0;max-height:none;gap:14px;padding:0;border:0;border-radius:14px;background:var(--incident-card-gutter)!important;box-shadow:none!important}
 .ir .incident-case-workbench :is(.case-summary,.investigation-body){min-width:0;border:1px solid rgb(var(--ui-border));border-radius:14px;background:rgb(var(--ui-surface));box-shadow:0 3px 13px rgb(15 23 42 / .04)}
 .ir .incident-detail-layout .incident-case-workbench .investigation-body{min-height:0;max-height:none;padding:18px 22px;overflow:visible}
 html .ir .incident-detail-layout .case-stage-bar .investigation-nav{grid-template-columns:repeat(auto-fit,minmax(min(100%,130px),1fr));gap:9px;margin:0;padding:0;border:0;background:transparent!important}
 .ir .incident-case-workbench .analysis-platform-tabs{padding:5px;border-radius:18px;background:var(--incident-card-gutter)}
  .ir .case-stage-bar .investigation-nav [role=tab]{min-height:62px;justify-content:flex-start;padding:10px 12px;border-color:rgb(var(--ui-border));background:rgb(var(--ui-surface));color:rgb(var(--ui-text));box-shadow:none}
 .ir .case-stage-bar .investigation-nav [role=tab].active{background:rgb(var(--ui-selected));border-color:var(--skin-outline,rgb(var(--ui-focus)));color:var(--skin-accent,#47632e)}
 html .ir .case-stage-bar .investigation-nav [role=tab] small{color:rgb(var(--ui-secondary))!important}
 html .ir .case-stage-bar .investigation-nav [role=tab][aria-selected=true] small{color:var(--skin-accent,var(--night-green,#47632e))!important}
 .ir .case-stage-bar .investigation-nav [role=tab] strong{white-space:normal;overflow-wrap:anywhere}
  html .ir[data-aegis-scene=incident] .incident-case-workbench :is(.investigation-nav [role=tab] i,.operation-number){--stage-soft:rgb(var(--ui-selected));color:var(--skin-accent,var(--night-green,#47632e))!important;background:var(--stage-soft)!important}
  .ir .case-stage-bar .investigation-nav [role=tab] i{border-radius:8px;padding:4px;width:31px;height:31px}
  .ir .incident-case-workbench .host-operation{border-top-color:rgb(var(--ui-border))}
 .ir .case-stage-bar .investigation-nav [role=tab] i svg{width:23px;height:23px}
 .ir .case-summary:has(.incident-case-head){padding:18px 22px}
 .ir .incident-case-workbench .case-context{margin:14px 0 0;padding:9px 12px;border:1px solid rgb(var(--ui-border));border-radius:8px;background:rgb(var(--ui-subtle));color:rgb(var(--ui-secondary))}
 .ir .case-summary .incident-case-head{margin:0;align-items:flex-start;gap:14px 24px}
 .ir .incident-case-identity{min-width:0;flex:1 1 320px}
 .ir .incident-case-kicker{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px}
 .ir .incident-case-kicker code{color:rgb(var(--ui-secondary));background:rgb(var(--ui-subtle));border-radius:6px;padding:3px 7px}
 .ir .incident-case-identity h2{margin:0;font-size:clamp(18px,2vw,23px);overflow-wrap:anywhere;color:rgb(var(--ui-text))}
 .ir .incident-case-identity p{color:rgb(var(--ui-secondary));overflow-wrap:anywhere}
 .ir .incident-case-identity .source-device-line{margin-top:8px;padding-block-end:10px}
 .ir[data-aegis-scene=incident] .incident-case-identity .source-device-line .ir-source-action{--ir-source-ink:var(--skin-accent,var(--night-green,#47632e));display:inline-flex;align-items:center;justify-content:center;min-height:24px!important;padding:1px 7px!important;border:1px solid color-mix(in srgb,var(--ir-source-ink) 46%,rgb(var(--ui-border)))!important;border-radius:7px!important;background:color-mix(in srgb,var(--ir-source-ink) 13%,rgb(var(--ui-selected)))!important;color:color-mix(in srgb,var(--ir-source-ink) 64%,rgb(var(--ui-text)))!important;font-family:inherit;font-size:11px!important;font-weight:650!important;line-height:1.3!important;box-shadow:none;white-space:nowrap}
 .ir[data-aegis-scene=incident] .incident-case-identity .source-device-line .ir-source-action:hover:not(:disabled){background:color-mix(in srgb,var(--ir-source-ink) 22%,rgb(var(--ui-selected)))!important}
 .ir[data-aegis-scene=incident] .incident-case-identity .source-device-line .ir-source-action:focus-visible{outline:2px solid rgb(var(--ui-focus));outline-offset:2px}
 .ir .source-device-line .ir-source-action:disabled{opacity:.55}
 /* Investigation activity and device query history share the same text hierarchy. */
 .ir .ir-activity{--activity-text:rgb(var(--ui-text));--activity-meta:rgb(var(--ui-secondary));--activity-surface:rgb(var(--ui-surface));--activity-subtle:rgb(var(--ui-subtle));--activity-border:rgb(var(--ui-border));--activity-accent:var(--skin-accent,var(--night-green,#47632e));--activity-mono:ui-monospace,'Cascadia Mono',Consolas,monospace;font-family:system-ui,'Microsoft YaHei','PingFang SC',sans-serif;min-width:0}
 .ir .ir-log-history>summary{font-size:14px;font-weight:650;line-height:1.5;color:rgb(var(--ui-text))}
 .ir .ir-log-history>.ir-activity{margin-top:13px}
 .ir .ir-activity-meta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px 12px;color:var(--activity-meta);margin-bottom:10px;line-height:1.4}
 .ir .ir-activity-meta small,.ir .ir-activity-count{font-size:12px}
 .ir .ir-activity-count{background:var(--activity-subtle);border-radius:6px;padding:4px 8px;white-space:nowrap}
 .ir .ir-activity-count strong{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--activity-text)}
 .ir .ir-activity-list{border:1px solid var(--activity-border);border-radius:11px;overflow:hidden;background:var(--activity-surface)}
 .ir .ir-activity-row{display:grid;grid-template-columns:145px minmax(0,1fr);align-items:start;gap:14px;padding:12px 14px}
 .ir .ir-activity-row+.ir-activity-row{border-top:1px solid var(--activity-border)}
 .ir .ir-activity-meta-cell{display:flex;align-items:flex-start;flex-wrap:wrap;flex-direction:column;gap:6px}
 .ir .ir-activity time.ir-activity-time{display:inline-flex;gap:.55em;align-items:center;color:var(--activity-text);background:var(--activity-subtle);border-radius:5px;padding:3px 6px;font:500 12px/1.4 var(--activity-mono);font-variant-numeric:tabular-nums;white-space:nowrap}
 .ir .ir-activity-time span:first-child{color:var(--activity-meta)}
 .ir .ir-activity-status{--status-ink:color-mix(in srgb,var(--activity-accent) 65%,var(--activity-text));--status-bg:rgb(var(--ui-selected));display:inline-flex;gap:5px;align-items:center;padding:2px 7px;border-radius:999px;background:var(--status-bg);color:var(--status-ink);font-size:11px;font-weight:650;line-height:1.45}
 .ir .ir-activity-status::before{content:'';width:5px;height:5px;flex:none;border-radius:50%;background:currentColor}
 .ir .ir-activity-row[data-status=running] .ir-activity-status{--status-ink:#245891;--status-bg:#edf4ff}
 .ir .ir-activity-row:is([data-status=blocked],[data-status=partial]) .ir-activity-status{--status-ink:#76510b;--status-bg:#fcf3dc}
 .ir .ir-activity-row:is([data-status=failed],[data-status=interrupted]) .ir-activity-status{--status-ink:#942f37;--status-bg:#fcebed}
 html.dark .ir .ir-activity-row[data-status=running] .ir-activity-status{--status-ink:#bbd6ff;--status-bg:#263852}
 html.dark .ir .ir-activity-row:is([data-status=blocked],[data-status=partial]) .ir-activity-status{--status-ink:#f2d18e;--status-bg:#423521}
 html.dark .ir .ir-activity-row:is([data-status=failed],[data-status=interrupted]) .ir-activity-status{--status-ink:#ffc1ba;--status-bg:#482d35}
 .ir .ir-activity-toggle{display:flex;gap:8px;align-items:flex-start;justify-content:space-between;padding:2px 0;cursor:pointer;list-style:none;color:var(--activity-text);font-size:14px;font-weight:500;line-height:1.6}
 .ir .ir-activity-toggle::-webkit-details-marker{display:none}
 .ir .ir-activity-toggle:focus-visible{outline:2px solid rgb(var(--ui-focus));outline-offset:3px;border-radius:5px}
 .ir .ir-activity-toggle svg{margin-top:3px;width:16px;height:16px;flex:none;color:var(--activity-meta)}
 .ir .ir-activity-detail[open] .ir-activity-toggle svg{transform:rotate(180deg)}
 .ir .ir-activity-preview{flex:1;min-width:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
 .ir .ir-activity-repeat{font:600 11px/1.5 var(--activity-mono);background:var(--activity-subtle);color:var(--activity-meta);padding:1px 5px;border-radius:4px;white-space:nowrap}
 .ir[data-aegis-scene=incident] .ir-activity code.ir-activity-token{font:500 .92em/1.55 var(--activity-mono);color:var(--activity-text)!important;background:var(--activity-subtle)!important;padding:1px 3px;border-radius:4px;overflow-wrap:anywhere;box-decoration-break:clone;-webkit-box-decoration-break:clone}
 .ir .ir-activity-expanded{font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 12px;color:var(--activity-text);background:var(--activity-subtle);border-radius:7px;margin-top:6px}
 .ir .ir-activity-expanded small{display:block;margin-top:6px;font-size:12px;color:var(--activity-meta)}
 .ir .ir-activity-more{display:block;margin:12px auto 0;padding:5px 12px}
 .ir .ir-activity-empty{padding:14px;border:1px dashed rgb(var(--ui-border));border-radius:9px;color:rgb(var(--ui-secondary))}
 @media(max-width:640px){.ir .ir-activity-row{grid-template-columns:minmax(0,1fr);gap:7px;padding:11px 12px}.ir .ir-activity-meta-cell{flex-direction:row;align-items:center}.ir .ir-activity-toggle{font-size:13px}}
 .ir .incident-case-actions{flex:0 1 auto;justify-content:flex-end;flex-wrap:wrap;gap:8px}
 .ir .incident-case-actions .danger{margin-inline-start:4px}
 @media(max-width:700px){html .ir .incident-detail-layout .case-stage-bar .investigation-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.ir .case-summary:has(.incident-case-head),.ir .incident-detail-layout .incident-case-workbench .investigation-body{padding:14px}.ir .incident-case-actions{justify-content:flex-start}}
`}</style>
 <div className="head"><div className="scene-page-brand"><img data-scene-logo="incident" className="scene-page-logo" src="/api/scenes/assistant/logos/incident.svg" alt={ui("应急响应 Logo")}/><div><div className="overline">INCIDENT RESPONSE / EVIDENCE INTO ACTION</div><h1>{ui("应急响应工作台")}</h1><p>{ui("从确认告警到证据链，让每一步调查都有依据。")}</p></div></div><div className="tools"><span className="badge">{ui("工作流 + AI 分析")}</span><button className="primary" onClick={()=>{setNewEvent(initialEvent());setEventModal(true)}}>{ui("新增事件")}</button><button onClick={openConnections}><Icon type="host"/> {ui("主机与连接")}</button><button onClick={()=>void refresh()}>{ui("刷新")}</button></div></div>
 {error&&<div role="alert" className="error">{error}</div>}
 {!showDetailView&&<div className="stats">{[['响应事件',cases.length],['调查进行中',cases.filter(c=>['queued','running','investigating'].includes(c.status)).length],['等待复核',cases.filter(c=>c.status==='review').length],['登记主机',settings.hosts.length]].map(([label,value])=><div className="stat" key={String(label)}><span>{ui(String(label))}</span><b>{value}</b></div>)}</div>}
  {!showDetailView?<section className="incident-ledger" aria-label={ui("响应事件台账")}>
    <nav className="incident-ledger-nav" aria-label={ui("事件状态")}>
      {caseFilters.map(({id,label,statuses})=><button type="button" key={id} aria-pressed={caseStatusFilter===id} onClick={()=>{setCaseStatusFilter(id);setCasePage(1)}}>{ui(label)} · {cases.filter(c=>!statuses.length||statuses.includes(c.status)).length}</button>)}
    </nav>
    <div className="incident-ledger-toolbar">
      <label className="incident-ledger-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg><input aria-label={ui("搜索响应事件")} placeholder={ui("搜索事件名称、编号或来源 / 目标 IP")} value={query} onChange={e=>{setQuery(e.target.value);setCasePage(1)}}/></label>
      <select aria-label={ui("筛选事件类型")} value={caseTypeFilter} onChange={e=>{setCaseTypeFilter(e.target.value);setCasePage(1)}}><option value="">{ui("全部事件类型")}</option>{attackThemes.map(t=><option key={t.id} value={t.id}>{ui(t.label)}</option>)}</select>
      {(query||caseStatusFilter||caseTypeFilter)&&<button type="button" onClick={()=>{setQuery('');setCaseStatusFilter('');setCaseTypeFilter('');setCasePage(1)}}>{ui("重置筛选")}</button>}
    </div>
    <div className="incident-ledger-table-wrap">
      <table role="table" aria-label={ui("响应事件")}><thead role="rowgroup"><tr role="row">{['事件名称 / 编号','事件类型','来源 → 目标','状态','登记时间','操作'].map(name=><th scope="col" key={name}>{ui(name)}</th>)}</tr></thead>
      <tbody role="rowgroup">{pageCases.map(c=>{const type=attackTheme(c);return <tr role="row" key={c.id} data-event-type={type.id} style={{'--event-type':type.accent,'--event-soft':type.soft,'--event-light-ink':type.ink,'--event-dark-ink':type.darkInk} as React.CSSProperties}>
        <td role="cell"><strong>{c.title}</strong><small>IR-{c.id.slice(0,10)}</small></td><td role="cell" data-label={ui("事件类型")}><span className="incident-event-type">{ui(type.label)}</span></td>
        <td role="cell" data-label={ui("来源 → 目标")}><IncidentEndpoints source={c.source} target={c.target}/></td><td role="cell" data-label={ui("状态")}><span className="incident-event-state" data-status={c.status}>{ui(labels[c.status]||c.status)}</span></td>
        <td role="cell" data-label={ui("登记时间")}><IncidentRegisteredAt value={c.created}/></td><td role="cell"><a className="incident-open" href={caseHref(c.id)} aria-label={`${ui("查看详情")}: ${c.title}`} onClick={event=>followCase(event,c.id)}>{ui("查看详情")} <span aria-hidden="true">→</span></a></td>
      </tr>} )}{!pageCases.length&&<tr role="row" className="incident-ledger-empty"><td role="cell" colSpan={6}>{ui(!casesReady?'正在加载响应事件…':cases.length?'没有符合筛选条件的事件。':'暂无事件，可通过「新增事件」登记，或从正式告警发起调查。')}</td></tr>}</tbody></table>
      <div className="incident-ledger-footer"><span aria-live="polite">{incidentLocale()?`${shown.length} incidents · ${casePageSize} per page`:`共 ${shown.length} 条 · 每页 ${casePageSize} 条`}</span><div className="incident-ledger-pagination"><button type="button" disabled={currentCasePage<=1} onClick={()=>setCasePage(currentCasePage-1)}>{ui("上一页")}</button><span>{currentCasePage} / {casePageCount}</span><button type="button" disabled={currentCasePage>=casePageCount} onClick={()=>setCasePage(currentCasePage+1)}>{ui("下一页")}</button></div></div>
    </div>
  </section>:<>
  <div className="incident-breadcrumb"><a className="incident-back" href={caseHref('')} onClick={event=>followCase(event,'')}>← {ui("返回事件台账")}</a><span>{ui(tab==='settings'?'主机与连接':'事件调查')}</span></div>
  <div className="layout incident-detail-layout">

 <section className={"panel detail "+(tab==='settings'?'settings-view':detail?'incident-case-workbench':'')}>{tab==='settings'?<><div className="head"><div><h2>{ui("主机与调查连接")}</h2><p>仅登记受管主机，凭据使用平台 Secret Manager 保存。</p></div><button className="primary" onClick={()=>setModal(true)}>{ui("登记主机")}</button></div><details className="work-help"><summary>主机接入与权限说明</summary><p>仅管理员可访问事件证据。SSH 校验主机公钥；WinRM 使用 HTTPS 和可信证书；主机须与事件目标一致。</p></details>{settings.hosts.map((h:any)=><div className="hostitem" key={h.id}><Icon type="host"/><div><strong>{h.name}</strong><p>{h.address}:{h.port} · {h.protocol==='ssh'?'Linux SSH':'Windows WinRM'} · {h.username}</p></div><span className="badge">{ui("已登记")}</span></div>)}<h3 style={{marginTop:25}}>微步云沙箱</h3><p>复用 threatbook-cn 文件分析凭据：<span className="badge">{settings.sandbox_key_configured?'已配置密钥':'尚未配置'}</span></p><p>取证完成后可按哈希查报告，或明确确认后上传样本。提交和报告均归档到事件证据库。</p><a href="https://s.threatbook.com/" target="_blank" rel="noreferrer">打开微步云沙箱 ↗</a><h3 style={{marginTop:25}}>VirusTotal</h3><p>复用 VirusTotal API 凭据：<span className="badge">{settings.virustotal_key_configured?'已配置密钥':'尚未配置'}</span></p><p>支持文件哈希查询与确认后的样本提交，多引擎结果归档到事件证据库。</p><a href="https://www.virustotal.com/" target="_blank" rel="noreferrer">打开 VirusTotal ↗</a></>:!detail?<div className="empty" role="status"><Icon/><h2>{error?'无法打开此事件':'正在加载事件详情…'}</h2><p>{error?'可返回事件台账，或刷新后重试。':'正在读取调查记录和证据。'}</p></div>:<>
 <div className="case-stage-bar"><div className="investigation-nav" role="tablist" aria-label={ui("调查功能")}>{[['overview','调查动态','intake'],['logs','设备关联','logs'],['host','主机排查','host'],['evidence','样本与逆向','sample'],['sandbox','沙箱分析','sandbox'],['report','响应报告','report']].map(([key,name,stage])=>{const events=detail.events.filter((e:any)=>e.stage===stage);const last=events[events.length-1];return <button type="button" role="tab" id={`incident-tab-${key}`} aria-controls="incident-tab-content" aria-selected={tab===key} className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}><i><StageIcon stage={stage}/></i><span><strong>{ui(name)}</strong><small data-status={last?.status||'pending'}>{ui(labels[last?.status]||'待执行')}</small></span></button>})}</div></div>
 <div className="case-summary"><div className="head incident-case-head"><div className="incident-case-identity"><div className="incident-case-kicker"><span className="badge">{ui(labels[detail.status]||detail.status)}</span><code>IR-{detail.id.slice(0,10)}</code></div><h2>{detail.title}</h2><div className="incident-case-endpoints"><IncidentEndpoints source={detail.source} target={detail.target}/>{detail.actor&&<span>{detail.actor}</span>}</div><div className="source-device-line"><span>{ui("来源设备")}</span><strong>{caseSource(detail)?.name||ui('尚未明确来源设备')}</strong><button type="button" className="ir-source-action" disabled={locked} onClick={openSource}>{ui(caseSource(detail)?'变更来源':'明确来源设备')}</button></div>{detail.status==='closed'&&<p className="archive-fact">已归档 · {new Date(detail.closed_at).toLocaleString()} · {detail.closed_by}</p>}</div><div className="tools incident-case-actions" role="group" aria-label={ui("事件操作")}><button className="status-update" disabled={!!busy||detail.processing||!detail.status_actions?.length} onClick={()=>{setStatusAction(detail.status_actions?.[0]?.action||'');setStatusNote('');setStatusOpen(true)}}>{ui("更新状态")}</button><a className="export-report" href={BASE+'/cases/'+detail.id+'/report.md'} download><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></svg>{ui("导出报告")}</a><button className="danger" disabled={!!busy||locked} onClick={()=>setDeleteOpen(true)}>{ui("删除事件")}</button></div></div>
 {JSON.parse(detail.alert||'{}')._demo&&<div className="notice case-context">{ui("演示事件 · 仅预览流程，不查询真实设备、不上机、不上传样本。")}</div>}</div><div id="incident-tab-content" className="investigation-body" role="tabpanel" aria-labelledby={`incident-tab-${tab}`}>
 {optionalJobs.length>0&&['host','evidence'].includes(tab)&&<details className="work-help"><summary>取证与环境任务 · {optionalJobs.filter(j=>['running','queued'].includes(j.status)).length} 项执行中</summary>{optionalJobs.slice(0,5).map(j=><div className="optional-job" key={j.id}><strong>{j.kind==='rea_install'?'REA 安装':'Solar 取证'} · {ui(labels[j.status]||j.status)}</strong><p>{j.result?.message}</p>{j.kind==='rea_install'&&<button onClick={()=>req('/optional/jobs/'+j.id+'/log').then(r=>setOptionalLog(r.text))}>查看日志</button>}</div>)}</details>}
 {optionalLog&&<div className="modal" onClick={()=>setOptionalLog('')}><div className="dialog" onClick={e=>e.stopPropagation()}><button onClick={()=>setOptionalLog('')}>{ui("关闭")}</button><h3>安装日志</h3><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:12}}>{optionalLog}</pre></div></div>}
 {busy&&<p className="busy" role="status">{busy}，请稍候…</p>}
 {tab==='overview'&&<><div className="work-section-head"><h3>{ui("调查动态")}</h3><button disabled={!!busy||locked} onClick={()=>action('重新关联日志',()=>req('/cases/'+detail.id+'/run',{}))}>{ui("刷新关联日志")}</button></div><ActivityTimeline events={detail.events}/></>}
 {tab==='logs'&&<><div className="work-section-head"><div><h3>{ui("设备关联")}</h3><small>{caseSource(detail)?.name||ui('尚未绑定来源设备')}</small></div><div className="tools"><button disabled={locked} onClick={openSource}>{ui(caseSource(detail)?'更换设备':'选择设备')}</button><button className="primary" disabled={!!busy||locked||!caseSource(detail)} onClick={()=>action('关联设备日志',()=>req('/cases/'+detail.id+'/run',{}))}>{ui("查询关联日志")}</button></div></div><DeviceLogCoverage detail={detail}/>{detail.events.some((e:any)=>e.stage==='logs')&&<details className="work-help ir-log-history" open={detail.events.filter((e:any)=>e.stage==='logs').slice(-1)[0]?.status==='blocked'||detail.events.filter((e:any)=>e.stage==='logs').slice(-1)[0]?.status==='failed'}><summary>{ui("查询记录与异常")}</summary><ActivityTimeline compact events={detail.events.filter((e:any)=>e.stage==='logs')}/></details>}<details className="work-help"><summary>{ui("查询范围说明")}</summary><p>仅查询当前事件绑定的设备、告警时间窗口及关联 IP。原始响应保留在证据库，完整性以证据 SHA-256 校验。</p></details></>}
 {tab==='sandbox'&&<section className="external-analysis" data-provider={analysisProvider} style={{'--analysis-accent':platform.accent,'--analysis-soft':platform.soft} as React.CSSProperties}>
 <div className="analysis-platform-tabs" role="tablist" aria-label="样本分析平台">{[['threatbook','微步云沙箱','threatbook-hd.svg','动态行为 · 云沙箱'],['virustotal','VirusTotal','virustotal.svg','多引擎检测 · 文件情报']].map(([id,name,logo,desc])=><button role="tab" aria-selected={analysisProvider===id} key={id} onClick={()=>setAnalysisProvider(id)} style={{'--analysis-accent':id==='threatbook'?'#b45f55':'#586e9d','--analysis-soft':id==='threatbook'?'#fcf3f0':'#f0f3fa'} as React.CSSProperties}><img src={'/vendor-logos/'+logo} alt={name}/><span><strong>{ui(name)}</strong><small>{desc}</small></span><i>{(id==='threatbook'?settings.sandbox_key_configured:settings.virustotal_key_configured)?'已配置':'待配置'}</i></button>)}</div>
 <div className="analysis-brand-head"><img src={'/vendor-logos/'+platform.logo} alt=""/><div><h3>{platform.name}样本分析</h3><p>{analysisProvider==='threatbook'?'以云沙箱行为报告辅助验证可疑文件。':'聚合多引擎检出与文件情报，辅助交叉验证样本风险。'}</p></div><a className="analysis-official-link" href={analysisProvider==='threatbook'?'https://s.threatbook.com/':'https://www.virustotal.com/gui/home/upload'} target="_blank" rel="noopener noreferrer">前往{analysisProvider==='threatbook'?'微步':' VT'}官网上传 <span aria-hidden="true">↗</span></a></div>
 <div className="analysis-notice">{platform.ready?'已配置 API。':'尚未配置 API Key，请在工具清单中配置对应平台。'}先按哈希查询，文件不会上传；提交文件需单独确认外发授权。{analysisProvider==='virustotal'&&'标准 VT 上传可能向安全社区及合作方共享样本，敏感文件请勿提交。'}</div>
 {detail.evidence.filter((e:any)=>e.kind==='sample').map((e:any)=><div className="evidence analysis-sample" key={e.id}><Icon type="file"/><div className="body"><strong>{e.label}</strong><code>SHA-256 {e.sha256}</code><div className="sample-actions"><button disabled={!!busy||locked||!platform.ready} onClick={()=>action('查询'+platform.name+'报告',()=>req('/cases/'+detail.id+'/evidence/'+e.id+'/sandbox',{submit:false,provider:analysisProvider}))}>按哈希查报告</button><button className="analysis-submit" disabled={!!busy||locked||!platform.ready} onClick={()=>{if(confirm(analysisProvider==='virustotal'?'确认已获文件外发授权，将样本上传至 VirusTotal？标准上传可能向安全社区及合作方共享文件，敏感文件请勿提交。':'确认已获文件外发授权，将此样本上传到微步云沙箱？'))action('提交'+platform.name,()=>req('/cases/'+detail.id+'/evidence/'+e.id+'/sandbox',{submit:true,provider:analysisProvider,external_upload_confirmed:true}))}}>确认外发并提交{analysisProvider==='threatbook'?'沙箱':' VT'}</button></div></div></div>)}
 {!detail.evidence.some((e:any)=>e.kind==='sample')&&<div className="empty">尚无取证样本，请先完成文件取证。</div>}
 <h3 className="analysis-results-title">分析回执与报告</h3>{detail.evidence.filter((e:any)=>e.kind==='sandbox_report'&&reportProvider(e)===analysisProvider).slice().reverse().map((e:any)=><div className="evidence analysis-sample" key={e.id}><Icon type="file"/><div className="body"><strong>{e.label}</strong><p>{new Date(e.created).toLocaleString()}</p><div className="sample-actions"><button onClick={()=>showExternalReport(e)}>{ui("查看详情")}</button><a href={BASE+'/cases/'+detail.id+'/evidence/'+e.id}>下载原始报告</a></div></div></div>)}{!detail.evidence.some((e:any)=>e.kind==='sandbox_report'&&reportProvider(e)===analysisProvider)&&<p className="note">当前平台尚无分析结果。查询或提交成功后，原始返回会保存在本事件证据库。</p>}
 </section>}
 {tab==='host'&&<><div className="work-section-head"><h3>{ui("主机排查")}</h3><button onClick={openConnections}>管理主机</button></div><section className="host-operation"><div className="operation-number">01</div><div className="operation-body"><h4>选择目标主机</h4><label className="field"><span>事件目标：{detail.target}</span><select aria-label="调查目标主机" value={remote} onChange={e=>setRemote(e.target.value)}><option value="">选择已登记主机</option>{matching.map((h:any)=><option key={h.id} value={h.id}>{h.name} · {h.protocol}</option>)}</select></label>{!matching.length&&<small>请先登记目标主机的 SSH 或 WinRM 连接。</small>}</div></section><section className="host-operation"><div className="operation-number">02</div><div className="operation-body"><h4>启动 AI 调查</h4><p>采集主机线索，关联证据并生成报告。</p><button className="primary" disabled={!remote||!!busy||locked} onClick={()=>{if(confirm('确认授权 Atlas 对当前事件目标执行只读调查及已发现可疑文件的自动取证？最多3轮追查，不执行样本，不做删除、修复或外部上传。'))action('远程调查',()=>req('/cases/'+detail.id+'/run',{host_id:remote,remote_authorized:true,ai_autonomous:true}))}}>授权并启动 AI 调查</button><details className="work-help"><summary>调查范围与授权说明</summary><p>从进程、连接、登录和持久化线索出发，最多3轮按证据追查及取证；所有动作与模型决策归档。不执行样本、不删除或修复文件，不自动外发。</p></details></div></section><section className="host-operation"><div className="operation-number">03</div><div className="operation-body"><h4>补充文件取证</h4><div className="file-collect-line"><input aria-label="取证文件路径" value={path} onChange={e=>setPath(e.target.value)} placeholder="输入远程文件的绝对路径"/><button disabled={!path||!remote||!!busy||locked} onClick={()=>{if(confirm('确认从事件目标采集这个文件到平台隔离证据库？文件不会被执行。'))action('文件取证',()=>req('/cases/'+detail.id+'/files',{host_id:remote,path,confirmed:true}))}}>采集并分析</button></div><details className="work-help"><summary>文件采集说明</summary><p>按实际线索填写完整路径。单文件最大20MB，远端与本地 SHA-256 一致后入库，随后执行静态初筛。</p></details></div></section></>}
 {tab==='evidence'&&<><div className="rea-environment"><StageIcon stage="sample"/><div><strong>REA · Ghidra 深度静态逆向</strong><p>{reaStatus?.ready?'引擎已就绪 · Linux / WSL2 · AI 按证据选择函数与调用关系':'尚未安装或环境未就绪'}。PE / ELF 使用静态反编译。</p></div>{!reaStatus?.ready&&<button className="primary" disabled={!!busy} onClick={()=>void openOptional('rea_install')}>安装 REA</button>}</div><div className="notice">证据为原始响应或实际采集内容，下载前校验 SHA-256。样本以 .bin 附件下载，请在隔离环境中处理。上传外部沙箱前确认文件可对外共享。</div><div className="evidence-browser"><div className="evidence-category-tabs" role="group" aria-label="证据分类">{[['all','全部证据'],...evidenceCategories].map(([key,name])=><button type="button" key={key} aria-pressed={evidenceFilter===key} onClick={()=>setEvidenceFilter(key)}>{name}<span>{(detail.evidence||[]).filter((e:any)=>key==='all'||evidenceCategory(e)===key).length}</span></button>)}</div><div className="evidence-search"><label><Icon type="file"/><input aria-label="搜索证据" value={evidenceQuery} onChange={e=>setEvidenceQuery(e.target.value)} placeholder="搜索文件名称、证据编号或 SHA-256"/></label>{evidenceQuery&&<button type="button" onClick={()=>setEvidenceQuery('')}>清空</button>}<small>显示 {evidenceItems.length} 项 / 共 {detail.evidence.length} 项</small></div></div>{!evidenceItems.length&&<div className="empty"><Icon type="file"/><h3>{evidenceQuery?'没有匹配的证据':'此分类暂无证据'}</h3><p>{evidenceFilter==='samples'?'完成文件取证后，样本会自动归入这里。':'调查过程中产生的证据会按用途自动归类。'}</p><button onClick={()=>{setEvidenceFilter('all');setEvidenceQuery('')}}>查看全部证据</button></div>}{evidenceItems.map((e:any)=><div className="evidence" key={e.id}><Icon type="file"/><div className="body"><strong>{e.label}</strong><p><span className="evidence-kind">{evidenceKindNames[e.kind]||'调查资料'}</span> · {(e.size/1024).toFixed(1)} KB · {new Date(e.created).toLocaleString()}</p><code>SHA-256 {e.sha256}</code>{e.kind==='sample'&&<SampleReviewSummary review={detail.sample_analyses?.[e.id]} disabled={!!busy||locked} onOpen={()=>setSampleReview(e.id)} onAnalyze={(force:boolean)=>action('AI 样本分析',()=>req('/cases/'+detail.id+'/evidence/'+e.id+'/analysis',{force}))}/>}<div><a href={BASE+'/cases/'+detail.id+'/evidence/'+e.id}>下载原始证据</a></div>{e.kind==='sample'&&<div className="sample-review-result"><div className="sample-review-head"><strong>REA 深度逆向</strong><span>{labels[reverseResults[e.id]?.status]||'尚未分析'}</span></div><p>{reverseResults[e.id]?.pseudocode_count?`实际取得 ${reverseResults[e.id].pseudocode_count} 个函数伪代码，原始工具结果已归档。`:(reverseResults[e.id]?.message||'支持 5 MB 以内 PE / ELF。只做静态反编译，不执行样本。')}</p><div className="sample-actions"><button disabled={!reaStatus?.ready||!!busy||locked||['queued','running'].includes(reverseResults[e.id]?.status)} onClick={()=>action('提交 REA 逆向',()=>req('/cases/'+detail.id+'/evidence/'+e.id+'/reverse',{}))}>REA 深度逆向</button>{reverseResults[e.id]?.markdown&&<button onClick={()=>setReverseReview(e.id)}>查看逆向报告</button>}</div></div>}{e.kind==='sample'&&<div className="sample-actions"><button disabled={locked} onClick={()=>action('查询沙箱报告',()=>req('/cases/'+detail.id+'/evidence/'+e.id+'/sandbox',{submit:false}))}>微步哈希查报告</button><button disabled={locked} onClick={()=>{if(confirm('这将把该证据文件上传到微步云沙箱（外部服务）。确认已获文件外发授权并接受对应沙箱的数据政策？'))action('提交沙箱',()=>req('/cases/'+detail.id+'/evidence/'+e.id+'/sandbox',{submit:true,external_upload_confirmed:true}))}}>提交微步沙箱</button><button disabled={!!busy} onClick={()=>{setAnalysisProvider('virustotal');setTab('sandbox')}}>VirusTotal 分析</button></div>}</div></div>)}</>}
 {tab==='report'&&<>{detail.report?<div className="report-preview"><div className="report-preview-icon"><StageIcon stage="report"/></div><div className="report-preview-copy"><h3>应急响应调查报告</h3><p>查看事件判定、关联线索与处置建议</p><small>{detail.evidence.length} 项证据 · {detail.events.length} 条调查记录</small></div><button className="primary" onClick={()=>setReportOpen(true)}>查看报告详情 <span aria-hidden="true">↗</span></button></div>:<div className="report-empty">报告尚未生成，完成调查后会自动汇总。</div>}<div className="tools"><button disabled={!!busy||locked} onClick={()=>action('更新关联报告',()=>req('/cases/'+detail.id+'/report',{}))}>按最新证据生成报告</button>{detail.report&&<a href={BASE+'/cases/'+detail.id+'/report.md'} download>下载 Markdown</a>}</div></> }
 </div></>}</section></div></>}
 {sourceOpen&&detail&&<div className="modal" onClick={()=>!busy&&setSourceOpen(false)}><form className="dialog status-dialog" role="dialog" aria-modal="true" aria-label="明确事件来源设备" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();action('绑定来源设备',async()=>{await req('/cases/'+detail.id+'/source',{device_id:sourceDeviceId,expected_device_id:caseSource(detail)?.id||'',note:sourceNote});setSourceOpen(false)})}}><div className="head"><div><h2>{ui("明确来源设备")}</h2><p>绑定实际产生本事件告警或日志的设备</p></div><button type="button" aria-label="关闭来源窗口" onClick={()=>setSourceOpen(false)}>×</button></div><label className="field">{ui("来源设备")}<DeviceSourcePicker devices={settings.devices||[]} value={sourceDeviceId} onChange={setSourceDeviceId} label="事件来源设备"/></label><div className="notice">来源与查询目标会保存在事件中。未适配的设备会明确提示，不会回退查询 TDP 或其他设备。历史查询证据保留原设备标识。</div><label className="field">来源确认依据<textarea required minLength={3} maxLength={2000} rows={4} aria-label="来源确认依据" value={sourceNote} onChange={e=>setSourceNote(e.target.value)} placeholder="例如：从该设备的告警详情创建，核对了事件时间与目标IP"/></label>{error&&<div role="alert" className="error">{error}</div>}<div className="form-footer"><button type="button" onClick={()=>setSourceOpen(false)}>{ui("取消")}</button><button className="primary" disabled={locked||!sourceDeviceId||sourceNote.trim().length<3}>保存来源设备</button></div></form></div>}
 {statusOpen&&detail&&<div className="modal" onClick={()=>!busy&&setStatusOpen(false)}><form className="dialog status-dialog" role="dialog" aria-modal="true" aria-label="更新事件状态" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();action('更新事件状态',async()=>{await req('/cases/'+detail.id+'/status',{action:statusAction,expected_status:detail.status,note:statusNote});setStatusOpen(false)})}}><div className="head"><div><h2>更新事件状态</h2><p>{detail.title}</p></div><button type="button" aria-label="关闭状态窗口" onClick={()=>setStatusOpen(false)}>×</button></div><div className="status-current">当前状态 <strong>{ui(labels[detail.status]||detail.status)}</strong><span>→</span><strong>{labels[selectedStatusAction?.target]||'请选择操作'}</strong></div><label className="field">{ui("操作")}<select value={statusAction} onChange={e=>setStatusAction(e.target.value)}>{(detail.status_actions||[]).map((a:any)=><option key={a.action} value={a.action}>{a.label}</option>)}</select></label><div className="notice">{selectedStatusAction?.description}{selectedStatusAction?.needs_report&&!detail.report&&<p className="status-report-needed">尚未生成响应报告，请先到“响应报告”按最新证据生成。</p>}</div><label className="field">处理说明<textarea aria-label="状态处理说明" required minLength={3} maxLength={2000} rows={4} value={statusNote} onChange={e=>setStatusNote(e.target.value)} placeholder="记录调查安排、复核结论、退回原因或重新打开的依据"/></label>{error&&<div role="alert" className="error">{error}</div>}<p className="note">状态变更将记录操作人、时间和处理说明。开始调查不会自动执行远程命令。</p><div className="form-footer"><button type="button" onClick={()=>setStatusOpen(false)}>{ui("取消")}</button><button className="primary" type="submit" disabled={!!busy||detail.processing||!selectedStatusAction?.enabled||statusNote.trim().length<3}>{selectedStatusAction?.label||'确认更新'}</button></div></form></div>}
 {deleteOpen&&detail&&<div className="modal" onClick={()=>!busy&&setDeleteOpen(false)}><section className="dialog confirm-dialog" role="dialog" aria-modal="true" aria-label="删除应急事件" onClick={e=>e.stopPropagation()}><h2>删除应急事件</h2><p>{detail.title}</p><div className="notice">删除后，事件将从工作台移除。原始证据和删除记录保留在后台。正在处理的事件无法删除。</div><div className="form-footer"><button disabled={!!busy} onClick={()=>setDeleteOpen(false)}>{ui("取消")}</button><button className="danger" disabled={!!busy} onClick={()=>void removeEvent()}>{busy?'正在删除…':'确认删除'}</button></div></section></div>}
 {reverseReview&&reverseResults[reverseReview]?.markdown&&detail&&<IncidentReportDialog detail={{...detail,title:detail.evidence.find((e:any)=>e.id===reverseReview)?.label||'样本逆向',report:reverseResults[reverseReview].markdown}} heading="REA 逆向分析详情" downloadUrl={BASE+'/cases/'+detail.id+'/evidence/'+reverseReview+'/reverse.md'} onClose={()=>setReverseReview('')}/>}
 {externalReport&&detail&&<IncidentReportDialog detail={externalReport} heading="外部样本分析详情" downloadUrl={BASE+'/cases/'+detail.id+'/evidence/'+externalReport.id} onClose={()=>setExternalReport(null)}/>}
 {reportOpen&&detail&&<IncidentReportDialog detail={detail} onClose={()=>setReportOpen(false)}/>}
 {sampleReview&&detail?.sample_analyses?.[sampleReview]?.status==='completed'&&<IncidentReportDialog detail={{...detail,title:detail.evidence.find((e:any)=>e.id===sampleReview)?.label||'样本分析',report:detail.sample_analyses[sampleReview].markdown}} heading="样本分析详情" downloadUrl={BASE+'/cases/'+detail.id+'/evidence/'+sampleReview+'/analysis.md'} onClose={()=>setSampleReview('')}/>}
 {eventModal&&<div className="modal" onClick={()=>!busy&&setEventModal(false)}><form className="dialog scene-ai-modal" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();void saveEvent()}}><div className="head"><div><h2>新增应急响应事件</h2><p>与 Atlas 整理线索，或手工登记事件</p></div><button type="button" aria-label="关闭新增事件" onClick={()=>setEventModal(false)}>×</button></div><div id="ir-event-ai"/><div id="ir-event-fields">{error&&<div className="error" role="alert">{error}</div>}<label className="field">事件名称<input required minLength={3} maxLength={160} value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} placeholder="例如：业务服务器疑似异常登录"/></label><div className="grid"><label className="field">{ui("目标 IP")}<input required value={newEvent.target} onChange={e=>setNewEvent({...newEvent,target:e.target.value})} placeholder="受影响主机的 IP"/></label><label className="field">来源 IP（选填）<input value={newEvent.source} onChange={e=>setNewEvent({...newEvent,source:e.target.value})} placeholder="未知时可留空"/></label></div><label className="field">来源设备 / 态势感知平台 *<DeviceSourcePicker devices={settings.devices||[]} value={newEvent.source_device_id} onChange={value=>setNewEvent({...newEvent,source_device_id:value})} label="新事件来源设备"/></label><p className="note">手工事件需要明确来源，不会自动选用默认设备。标注“日志适配待完成”的设备可登记来源，当前不能自动关联其日志。</p><label className="field">事件发生时间<input type="datetime-local" required value={newEvent.occurred_at} onChange={e=>setNewEvent({...newEvent,occurred_at:e.target.value})}/></label><label className="field">事件描述与已知线索<textarea required minLength={3} maxLength={12000} rows={5} value={newEvent.description} onChange={e=>setNewEvent({...newEvent,description:e.target.value})} placeholder="记录发现方式、异常现象、受影响范围及已有证据"/></label><label className="check-line"><input type="checkbox" checked={newEvent.start_investigation} onChange={e=>setNewEvent({...newEvent,start_investigation:e.target.checked})}/>创建后自动查询关联设备日志并生成报告</label><div className="notice">按事件时间和已知 IP 查询设备日志；远程上机、文件取证和外部沙箱上传按事件另行操作。</div><div className="form-footer"><button type="button" onClick={()=>setEventModal(false)}>{ui("取消")}</button><button className="primary" type="submit" disabled={!!busy}>{busy?'正在创建…':'创建事件'}</button></div></div></form></div>}
 {modal&&<div className="modal" onClick={()=>setModal(false)}><form className="dialog scene-ai-modal" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();action('登记主机',async()=>{await req('/hosts',host);setHost({...host,password:''});setModal(false)})}}><div className="head"><div><h2>登记调查主机</h2><p>填写详情，或与 Atlas 协作完成配置</p></div><button type="button" onClick={()=>setModal(false)}>×</button></div><div id="ir-ai-workbench"/><div id="ir-host-fields"><div className="grid"><label className="field">主机名称<input required value={host.name} onChange={e=>setHost({...host,name:e.target.value})}/></label><label className="field">{ui("目标 IP")}<input required value={host.address} onChange={e=>setHost({...host,address:e.target.value})}/></label></div><div className="grid"><label className="field">连接方式<select value={host.protocol} onChange={e=>setHost({...host,protocol:e.target.value,port:e.target.value==='ssh'?22:5986})}><option value="ssh">Linux SSH</option><option value="winrm">Windows WinRM HTTPS</option></select></label><label className="field">端口<input type="number" min="1" max="65535" required value={host.port} onChange={e=>setHost({...host,port:Number(e.target.value)})}/></label></div><label className="field">调查账号<input required value={host.username} onChange={e=>setHost({...host,username:e.target.value})} autoComplete="off"/></label><label className="field">登录密码<input type="password" required value={host.password} onChange={e=>setHost({...host,password:e.target.value})} autoComplete="new-password"/></label>{host.protocol==='ssh'?<label className="field">可信 OpenSSH 主机公钥<textarea required rows={3} value={host.host_key} onChange={e=>setHost({...host,host_key:e.target.value})} placeholder="ssh-ed25519 AAAA…（从服务器管理员取得，不是登录私钥）"/></label>:<div className="notice">WinRM 使用 5986 / HTTPS、NTLM 认证，服务器证书需要有效并被平台信任；证书必须覆盖目标 IP。</div>}<button className="primary" disabled={!!busy}>保存主机</button><p className="note">凭据由平台 Secret Manager 管理；不会返回到页面。</p></div></form></div>}
 </div>
}
