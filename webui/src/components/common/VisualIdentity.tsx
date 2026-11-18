import {useEffect,useState, type CSSProperties} from 'react';
import {Link2, Cherry, Cpu, Radar, ServerCog, Fingerprint, Stethoscope, Radio, Network, MailWarning, ScanSearch, Orbit, ShieldAlert, Workflow} from 'lucide-react';

type Brand={id:string;name:string;accent:string;soft:string;asset?:string};
const brands:Record<string,Brand>={"deepseek": {"id": "deepseek", "name": "DeepSeek", "accent": "#4267c7", "soft": "#edf2ff", "asset": "deepseek-color"}, "qwen": {"id": "qwen", "name": "通义千问", "accent": "#7754c6", "soft": "#f3effc", "asset": "qwen-color"}, "zhipu": {"id": "zhipu", "name": "智谱 GLM", "accent": "#496ec2", "soft": "#eff3fe", "asset": "zhipu-color"}, "minimax": {"id": "minimax", "name": "MiniMax", "accent": "#c16780", "soft": "#fcf0f3", "asset": "minimax-color"}, "stepfun": {"id": "stepfun", "name": "阶跃星辰", "accent": "#497bd0", "soft": "#eff5ff", "asset": "stepfun-color"}, "doubao": {"id": "doubao", "name": "字节豆包", "accent": "#4b82ce", "soft": "#edf4ff", "asset": "doubao-color"}, "wenxin": {"id": "wenxin", "name": "百度文心", "accent": "#426adb", "soft": "#edf1ff", "asset": "wenxin-color"}, "hunyuan": {"id": "hunyuan", "name": "腾讯混元", "accent": "#428bd4", "soft": "#edf6ff", "asset": "hunyuan-color"}, "spark": {"id": "spark", "name": "讯飞星火", "accent": "#3989c4", "soft": "#eef7fc", "asset": "spark-color"}, "yi": {"id": "yi", "name": "零一万物", "accent": "#548ac5", "soft": "#eef5fd", "asset": "yi-color"}, "baichuan": {"id": "baichuan", "name": "百川", "accent": "#c77d3b", "soft": "#fff4e8", "asset": "baichuan-color"}, "internlm": {"id": "internlm", "name": "书生浦语", "accent": "#5782cc", "soft": "#eef4ff", "asset": "internlm-color"}, "mistral": {"id": "mistral", "name": "Mistral", "accent": "#d17d31", "soft": "#fff2df", "asset": "mistral-color"}, "meta": {"id": "meta", "name": "Meta Llama", "accent": "#327ad3", "soft": "#edf4ff", "asset": "meta-color"}, "nvidia": {"id": "nvidia", "name": "NVIDIA", "accent": "#71a42e", "soft": "#f1f7e7", "asset": "nvidia-color"}, "perplexity": {"id": "perplexity", "name": "Perplexity", "accent": "#328a91", "soft": "#eaf7f7", "asset": "perplexity-color"}, "ai21": {"id": "ai21", "name": "AI21 Labs", "accent": "#91575d", "soft": "#faedef", "asset": "ai21-brand-color"}, "stability": {"id": "stability", "name": "Stability AI", "accent": "#7e55bf", "soft": "#f4effb", "asset": "stability-color"}, "xiaomi": {"id": "xiaomi", "name": "小米 MiMo", "accent": "#d17b32", "soft": "#fff3e8", "asset": "xiaomimimo"}, "longcat": {"id": "longcat", "name": "美团 LongCat", "accent": "#c29725", "soft": "#fff8df", "asset": "longcat-color"}, "huawei": {"id": "huawei", "name": "华为盘古", "accent": "#be5c5a", "soft": "#fcf0ef", "asset": "huawei-color"}, "anthropic": {"id": "anthropic", "name": "Anthropic Claude", "accent": "#ad7354", "soft": "#fcf2e9", "asset": "anthropic"}, "google": {"id": "google", "name": "Google Gemini", "accent": "#4478c8", "soft": "#eff4fe", "asset": "google-color"}, "moonshot": {"id": "moonshot", "name": "月之暗面 Kimi", "accent": "#546bb3", "soft": "#f0f3fd", "asset": "moonshot"}, "cohere": {"id": "cohere", "name": "Cohere", "accent": "#51876e", "soft": "#eff7ef", "asset": "cohere-color"}, "grok": {"id": "grok", "name": "xAI Grok", "accent": "#526075", "soft": "#f0f3f8", "asset": "grok"}, "openai": {"id": "openai", "name": "OpenAI", "accent": "#25846e", "soft": "#edf7f3", "asset": "openai"}, "azure": {"id": "azure", "name": "Microsoft Azure", "accent": "#258ec0", "soft": "#ebf7fd", "asset": "azure-color"}, "threatbook": {"id": "threatbook", "name": "微步 ThreatBook", "accent": "#c86353", "soft": "#fcf0ec", "asset": "threatbook"}, "ollama": {"id": "ollama", "name": "Ollama", "accent": "#62726e", "soft": "#f1f6f3", "asset": "ollama"}, "openrouter": {"id": "openrouter", "name": "OpenRouter", "accent": "#67658d", "soft": "#f2f1fa", "asset": "openrouter-color"}, "siliconcloud": {"id": "siliconcloud", "name": "硅基流动", "accent": "#745fc0", "soft": "#f3effb", "asset": "siliconcloud-color"}, "volcengine": {"id": "volcengine", "name": "火山引擎", "accent": "#4186c4", "soft": "#edf5fd", "asset": "volcengine-color"}, "gitee": {"id": "gitee", "name": "Gitee AI", "accent": "#bb575d", "soft": "#fbf0ef", "asset": "giteeai"}, "compatible": {"id": "compatible", "name": "兼容模型服务", "accent": "#8462bf", "soft": "#f4f0fc"}, "cherry": {"id": "cherry", "name": "Cherry", "accent": "#bf5772", "soft": "#fbf0f3"}, "custom": {"id": "custom", "name": "自定义模型服务", "accent": "#738b53", "soft": "#f3f7ed"}};
export function modelBrand(value:string):Brand{const s=value.toLowerCase();
 if(/deepseek/i.test(s))return brands.deepseek;
 if(/qwen|qwq|qvq|通义|百炼|dashscope/i.test(s))return brands.qwen;
 if(/glm|zhipu|智谱/i.test(s))return brands.zhipu;
 if(/minimax|abab|海螺/i.test(s))return brands.minimax;
 if(/stepfun|step[-_ ]|阶跃/i.test(s))return brands.stepfun;
 if(/doubao|豆包|seed[-_ ]/i.test(s))return brands.doubao;
 if(/ernie|wenxin|文心|千帆|qianfan/i.test(s))return brands.wenxin;
 if(/hunyuan|混元/i.test(s))return brands.hunyuan;
 if(/spark|星火|讯飞|iflytek/i.test(s))return brands.spark;
 if(/(^|[/ :])yi[-_ ]|零一万物|01ai/i.test(s))return brands.yi;
 if(/baichuan|百川/i.test(s))return brands.baichuan;
 if(/internlm|书生|浦语/i.test(s))return brands.internlm;
 if(/mistral|mixtral|codestral|ministral|devstral/i.test(s))return brands.mistral;
 if(/llama|meta[-_ ]/i.test(s))return brands.meta;
 if(/nemotron|nvidia/i.test(s))return brands.nvidia;
 if(/perplexity|sonar[-_ ]/i.test(s))return brands.perplexity;
 if(/ai21|jamba/i.test(s))return brands.ai21;
 if(/stability|stable[-_ ]/i.test(s))return brands.stability;
 if(/mimo|xiaomi|小米/i.test(s))return brands.xiaomi;
 if(/longcat|美团/i.test(s))return brands.longcat;
 if(/pangu|盘古|huawei/i.test(s))return brands.huawei;
 if(/anthropic|claude/i.test(s))return brands.anthropic;
 if(/google|gemini|gemma/i.test(s))return brands.google;
 if(/moonshot|kimi|月之暗面/i.test(s))return brands.moonshot;
 if(/cohere|command[-_ ]/i.test(s))return brands.cohere;
 if(/grok|xai/i.test(s))return brands.grok;
 if(/openai|gpt[-_ ]|(^|[/ :])o[1-9]([-_ :]|$)|chatgpt/i.test(s))return brands.openai;
 if(/azure/i.test(s))return brands.azure;
 if(/threatbook|微步/i.test(s))return brands.threatbook;
 if(/ollama/i.test(s))return brands.ollama;
 if(/openrouter/i.test(s))return brands.openrouter;
 if(/siliconflow|siliconcloud|硅基/i.test(s))return brands.siliconcloud;
 if(/volcengine|火山/i.test(s))return brands.volcengine;
 if(/gitee/i.test(s))return brands.gitee;
 if(/compatible/i.test(s))return brands.compatible;
 if(/cherry/i.test(s))return brands.cherry;
 return brands.custom;
}
export function brandStyle(value:string):CSSProperties{const b=modelBrand(value);return {'--brand-accent':b.accent,'--brand-soft':b.soft} as CSSProperties;}
export function ModelBrandIcon({value,className=''}:{value:string;className?:string}){
 const b=modelBrand(value),[failed,setFailed]=useState(false),Fallback=b.id==='compatible'?Link2:b.id==='cherry'?Cherry:Cpu;
 useEffect(()=>setFailed(false),[b.asset]);
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
