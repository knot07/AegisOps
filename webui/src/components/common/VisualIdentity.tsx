import {useState, type CSSProperties} from 'react';
import {Link2, Cherry, Cpu, Radar, ServerCog, Fingerprint, Stethoscope, Radio, Network, MailWarning, ScanSearch, Orbit, ShieldAlert, Workflow} from 'lucide-react';

type Brand={id:string;name:string;accent:string;soft:string;asset?:string};
const brands:Record<string,Brand>={
 deepseek:{id:'deepseek',name:'DeepSeek',accent:'#4267c7',soft:'#edf2ff',asset:'deepseek-color'},
 openai:{id:'openai',name:'OpenAI',accent:'#25846e',soft:'#edf7f3',asset:'openai'},
 google:{id:'google',name:'Google Gemini',accent:'#4478c8',soft:'#eff4fe',asset:'google-color'},
 anthropic:{id:'anthropic',name:'Anthropic',accent:'#ad7354',soft:'#fcf2e9',asset:'anthropic'},
 grok:{id:'grok',name:'xAI',accent:'#526075',soft:'#f0f3f8',asset:'grok'},
 cohere:{id:'cohere',name:'Cohere',accent:'#51876e',soft:'#eff7ef',asset:'cohere-color'},
 azure:{id:'azure',name:'Microsoft Azure',accent:'#258ec0',soft:'#ebf7fd',asset:'azure-color'},
 qwen:{id:'qwen',name:'通义千问',accent:'#7754c6',soft:'#f3effc',asset:'qwen-color'},
 moonshot:{id:'moonshot',name:'Moonshot / Kimi',accent:'#546bb3',soft:'#f0f3fd',asset:'moonshot'},
 zhipu:{id:'zhipu',name:'智谱 GLM',accent:'#496ec2',soft:'#eff3fe',asset:'zhipu-color'},
 minimax:{id:'minimax',name:'MiniMax',accent:'#c16780',soft:'#fcf0f3',asset:'minimax-color'},
 stepfun:{id:'stepfun',name:'阶跃星辰',accent:'#497bd0',soft:'#eff5ff',asset:'stepfun-color'},
 threatbook:{id:'threatbook',name:'ThreatBook',accent:'#c86353',soft:'#fcf0ec',asset:'threatbook'},
 cherry:{id:'cherry',name:'Cherry',accent:'#bf5772',soft:'#fbf0f3'},
 ollama:{id:'ollama',name:'Ollama',accent:'#62726e',soft:'#f1f6f3',asset:'ollama'},
 compatible:{id:'compatible',name:'OpenAI Compatible',accent:'#8462bf',soft:'#f4f0fc'},
 custom:{id:'custom',name:'自定义模型服务',accent:'#738b53',soft:'#f3f7ed'},
};
export function modelBrand(value:string):Brand{
 const s=value.toLowerCase();
 if(/deepseek/.test(s))return brands.deepseek;
 if(/qwen|alibaba|dashscope|百炼|通义/.test(s))return brands.qwen;
 if(/glm|zhipu|智谱/.test(s))return brands.zhipu;
 if(/minimax/.test(s))return brands.minimax;
 if(/stepfun|step-|阶跃/.test(s))return brands.stepfun;
 if(/threatbook|微步/.test(s))return brands.threatbook;
 if(/compatible/.test(s))return brands.compatible;
 if(/azure/.test(s))return brands.azure;
 if(/anthropic|claude/.test(s))return brands.anthropic;
 if(/google|gemini/.test(s))return brands.google;
 if(/moonshot|kimi|月之/.test(s))return brands.moonshot;
 if(/cohere|command-r/.test(s))return brands.cohere;
 if(/grok|xai/.test(s))return brands.grok;
 if(/cherry/.test(s))return brands.cherry;
 if(/ollama/.test(s))return brands.ollama;
 if(/openai|gpt-|o[134]-/.test(s))return brands.openai;
 return brands.custom;
}
export function brandStyle(value:string):CSSProperties{const b=modelBrand(value);return {'--brand-accent':b.accent,'--brand-soft':b.soft} as CSSProperties;}
export function ModelBrandIcon({value,className=''}:{value:string;className?:string}){
 const b=modelBrand(value),[failed,setFailed]=useState(false),Fallback=b.id==='compatible'?Link2:b.id==='cherry'?Cherry:Cpu;
 return <span title={b.name} data-model-brand={b.id} className={`aegis-model-brand-icon ${className}`} style={brandStyle(value)}>
  {b.asset&&!failed?<img key={b.asset} src={`/model-logos/${b.asset}.svg`} alt={b.name} onError={()=>setFailed(true)}/>:<Fallback aria-hidden="true"/>}
 </span>;
}

const agentDesigns=[
 {key:'asset',match:/asset|资产|测绘/,Icon:Radar,accent:'#357eaf',soft:'#eaf5fc'},
 {key:'device',match:/inspect|inspection|设备|巡检/,Icon:ServerCog,accent:'#4f8b73',soft:'#edf8f2'},
 {key:'evidence',match:/forensic|evidence|取证/,Icon:Fingerprint,accent:'#8a62b5',soft:'#f5effc'},
 {key:'triage',match:/triage|quick|快速排查/,Icon:Stethoscope,accent:'#c18b39',soft:'#fcf5e8'},
 {key:'news',match:/hot|热点/,Icon:Radio,accent:'#bf6b56',soft:'#fcf0eb'},
 {key:'ndr',match:/ndr|network|流量/,Icon:Network,accent:'#428ea0',soft:'#eaf7f9'},
 {key:'phishing',match:/phish|钓鱼|邮件/,Icon:MailWarning,accent:'#ba6f97',soft:'#fcf0f7'},
 {key:'review',match:/tdp|monitor|只读|研判/,Icon:ScanSearch,accent:'#617fc3',soft:'#eff3ff'},
 {key:'intel',match:/threat|威胁情报/,Icon:Orbit,accent:'#987342',soft:'#faf4e9'},
 {key:'vuln',match:/vuln|漏洞/,Icon:ShieldAlert,accent:'#b76570',soft:'#fceff1'},
];
export function agentDesign(name:string,label=''){
 if(/^(rex|atlas)$/i.test(name))return {key:'atlas',Icon:Workflow,accent:'#527f4c',soft:'#f1f7eb'};
 const found=agentDesigns.find(d=>d.match.test(label.toLowerCase())) || agentDesigns.find(d=>d.match.test(name.toLowerCase()));
 if(found)return found;
 const hash=[...name].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,0);const base=agentDesigns[Math.abs(hash)%agentDesigns.length];
 return {...base,key:'custom-'+name,Icon:Workflow};
}
export function agentStyle(name:string,label=''):CSSProperties{const d=agentDesign(name,label);return {'--agent-accent':d.accent,'--agent-soft':d.soft} as CSSProperties;}
export function AgentIdentity({name,label=''}:{name:string;label?:string}){
 const d=agentDesign(name,label),Icon=d.Icon;
 return <span className={`aegis-agent-identity ${d.key==='atlas'?'is-atlas':''}`} data-agent-identity={d.key} style={agentStyle(name,label)}>
  {d.key==='atlas'?<img src="/favicon.svg" alt="Atlas"/>:<><Icon aria-hidden="true" strokeWidth={1.65}/><i aria-hidden="true"/></>}
 </span>;
}
