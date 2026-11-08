import {useState, type CSSProperties} from 'react';
import {BookOpen, Workflow, Wrench, Package, Globe, Search, Terminal, FileText, Database, ShieldCheck, ScanLine, Network, Mail, Code, FolderSearch, GitBranch, Clock, Brain, Cpu, Server, Radio, Lock, KeyRound, Download, Upload, Fingerprint} from 'lucide-react';
import {AgentIdentity, agentDesign} from './VisualIdentity';

const vendorDesigns=[
 {key:'greynoise',match:/greynoise/,asset:'greynoise.png',accent:'#b56d32',soft:'#fff5e9'},
 {key:'crowdstrike',match:/crowdstrike/,asset:'crowdstrike.ico',accent:'#cf3a37',soft:'#fff0ee'},
 {key:'virustotal',match:/virustotal|virus-total|(?:^|[^a-z])vt(?:[^a-z]|$)/,asset:'virustotal.svg',accent:'#394eff',soft:'#eff1ff'},
 {key:'cloudflare',match:/cloudflare|cloud-flare/,asset:'cloudflare.svg',accent:'#e88623',soft:'#fff5e8'},
 {key:'splunk',match:/splunk/,asset:'splunk.svg',accent:'#4d8d36',soft:'#f1f8eb'},
 {key:'cisco',match:/cisco/,asset:'cisco.svg',accent:'#2184bd',soft:'#edf7fd'},
 {key:'okta',match:/okta/,asset:'okta.svg',accent:'#2563b8',soft:'#eef4ff'},
 {key:'snyk',match:/snyk/,asset:'snyk.svg',accent:'#6551a6',soft:'#f4f0fc'},
 {key:'hashicorp',match:/hashicorp|hashi-corp/,asset:'hashicorp.svg',accent:'#5964a6',soft:'#f0f2fc'},
 {key:'terraform',match:/terraform/,asset:'terraform.svg',accent:'#7652b7',soft:'#f4f0fc'},
 {key:'github',match:/github/,asset:'github.svg',accent:'#53616c',soft:'#f1f4f7'},
 {key:'gitlab',match:/gitlab/,asset:'gitlab.svg',accent:'#d56d32',soft:'#fff3eb'},
 {key:'docker',match:/docker/,asset:'docker.svg',accent:'#258ac4',soft:'#edf8fe'},
 {key:'kubernetes',match:/kubernetes|k8s/,asset:'kubernetes.svg',accent:'#3975ca',soft:'#eef4ff'},
 {key:'elastic',match:/elastic(?:search)?|elastic-siem/,asset:'elastic.svg',accent:'#288b9a',soft:'#edf8f8'},
 {key:'googlecloud',match:/google-cloud|google-iap|gcp/,asset:'googlecloud.svg',accent:'#4285c5',soft:'#eef5fe'},
 {key:'google',match:/google|chronicle|gsuite|g-suite/,asset:'google.svg',accent:'#4285c5',soft:'#eef5fe'},
 {key:'amazonwebservices',match:/(?:^|[^a-z])aws(?:[^a-z]|$)|amazon-web|amazon-guardduty/,asset:'amazonwebservices.svg',accent:'#c88a25',soft:'#fff7e9'},
 {key:'microsoftazure',match:/azure/,asset:'microsoftazure.svg',accent:'#2489c6',soft:'#edf7fd'},
 {key:'microsoft',match:/microsoft|office365|office-365|outlook|windows|powershell|sysmon|active-directory|entra-id/,asset:'microsoft.svg',accent:'#437ab1',soft:'#eff5fb'},
 {key:'android',match:/android/,asset:'android.svg',accent:'#5e9e42',soft:'#f1f8eb'},
 {key:'apple',match:/(?:^|[^a-z])ios(?:[^a-z]|$)|macos|apple/,asset:'apple.svg',accent:'#697580',soft:'#f1f4f7'},
 {key:'wireshark',match:/wireshark/,asset:'wireshark.svg',accent:'#2775ab',soft:'#edf5fc'},
 {key:'burpsuite',match:/burpsuite|burp-suite|portswigger/,asset:'burpsuite.svg',accent:'#d87635',soft:'#fff3e9'},
 {key:'paloaltonetworks',match:/paloalto|palo-alto|cortex-xdr/,asset:'paloaltonetworks.svg',accent:'#ce7338',soft:'#fff3eb'},
 {key:'fortinet',match:/fortinet|fortigate/,asset:'fortinet.svg',accent:'#c84a4a',soft:'#fff0f0'},
 {key:'nginx',match:/nginx/,asset:'nginx.svg',accent:'#39964b',soft:'#eef8ef'},
 {key:'jenkins',match:/jenkins/,asset:'jenkins.svg',accent:'#b65c55',soft:'#fcf1ef'},
 {key:'urlscan',match:/urlscan/,asset:'urlscan.png',accent:'#367cae',soft:'#edf6fc'},
 {key:'fofa',match:/fofa|白帽汇/,asset:'fofa-hd.svg',accent:'#008d9d',soft:'#edf9f9'},
 {key:'qianxin',match:/qianxin|qi-anxin|奇安信|skyeye|天眼|神州网信|secgate/,asset:'qianxin.png',accent:'#3565ae',soft:'#eef3fb'},
 {key:'threatbook',match:/threatbook|微步|(?:^|[^a-z])tdp(?:[^a-z]|$)|onesec|onesig|onedns|onesandbox|ngsoc|ngtip/,asset:'threatbook-hd.svg',accent:'#cf5549',soft:'#fcf0ed'},
 {key:'sangfor',match:/sangfor|深信服/,asset:'sangfor-hd.png',accent:'#2d789b',soft:'#edf5f9'},
 {key:'qingteng',match:/qingteng|青藤/,asset:'qingteng.png',accent:'#168b9e',soft:'#edf8f9'},
 {key:'360',match:/(?:^|[^0-9])360(?:[^0-9]|$)|奇虎/,asset:'360-hd.svg',accent:'#459748',soft:'#eff8ee'},
 {key:'huaweicloud',match:/huawei|华为/,asset:'huaweicloud.png',accent:'#c64750',soft:'#fcf0f1'},
 {key:'huorong',match:/huorong|火绒/,asset:'huorong-hd.png',accent:'#c47a2b',soft:'#fcf5e9'},
 {key:'nsfocus',match:/nsfocus|绿盟/,asset:'nsfocus.png',accent:'#65963e',soft:'#f3f8ed'},
 {key:'chaitin',match:/chaitin|长亭/,asset:'chaitin-hd.png',accent:'#4a873c',soft:'#f0f7ec'},
];
export function resourceVendor(name:string,label=''){
 const direct=vendorDesigns.find(v=>v.match.test(name.toLowerCase()));
 if(direct)return direct;
 if(/onboard|device-integration|接入引导/.test(name.toLowerCase()))return undefined;
 const matches=vendorDesigns.filter(v=>v.match.test(label.toLowerCase()));
 return matches.length===1?matches[0]:undefined;
}

const motifs=[
 {match:/browser|web[-_ ]?use|浏览器/,Icon:Globe,hue:210},
 {match:/phish|email|mail|钓鱼|邮件/,Icon:Mail,hue:329},
 {match:/vuln|cve|漏洞/,Icon:ShieldCheck,hue:354},
 {match:/forensic|evidence|取证/,Icon:Fingerprint,hue:268},
 {match:/incident|response|应急/,Icon:Radio,hue:24},
 {match:/threat|intel|情报/,Icon:Radio,hue:40},
 {match:/ndr|traffic|packet|流量/,Icon:Network,hue:188},
 {match:/scan|recon|扫描|测绘/,Icon:ScanLine,hue:202},
 {match:/asset|host|server|资产|主机/,Icon:Server,hue:160},
 {match:/device|tdp|skyeye|onesec|onesig|qingteng|sangfor|设备/,Icon:Cpu,hue:146},
 {match:/search|query|find|搜索|查询/,Icon:Search,hue:215},
 {match:/sql|database|数据库/,Icon:Database,hue:181},
 {match:/shell|bash|exec|terminal|命令/,Icon:Terminal,hue:153},
 {match:/file|read|write|文件|文档/,Icon:FileText,hue:38},
 {match:/git|branch|repo|代码库/,Icon:GitBranch,hue:16},
 {match:/code|python|javascript|脚本|代码/,Icon:Code,hue:242},
 {match:/time|schedule|cron|定时/,Icon:Clock,hue:221},
 {match:/download|fetch|下载/,Icon:Download,hue:194},
 {match:/upload|export|上传|导出/,Icon:Upload,hue:168},
 {match:/key|secret|credential|凭据|密钥/,Icon:KeyRound,hue:45},
 {match:/security|permission|policy|权限|安全/,Icon:Lock,hue:135},
 {match:/agent|model|llm|智能体|模型/,Icon:Brain,hue:267},
 {match:/workflow|pipeline|工作流/,Icon:Workflow,hue:252},
 {match:/skill|技能/,Icon:BookOpen,hue:172},
];
export function resourceDesign(kind:string,name:string,label=''){
 if(kind.toLowerCase()==='agent' && !resourceVendor(name,label)) {const d=agentDesign(name,label);return {Icon:d.Icon,accent:d.accent,soft:d.soft,key:d.key};}
 const vendor=resourceVendor(name,label);
 if(vendor)return {Icon:Cpu,...vendor};
 const hash=Math.abs([...`${kind}:${name}`].reduce((a,c)=>Math.imul(a,31)+c.charCodeAt(0)|0,0));
 const motif=motifs.find(m=>m.match.test(name.toLowerCase()))||motifs.find(m=>m.match.test(label.toLowerCase()));
 const Icon=motif?.Icon||[BookOpen,Workflow,Wrench,Package,Globe,FolderSearch,Code,Database][hash%8];
 const hue=(motif?.hue||hash%360)+(hash%17-8);
 return {Icon,accent:`hsl(${hue} 35% 43%)`,soft:`hsl(${hue} 58% 96%)`,key:kind+'-'+name};
}
export function resourceStyle(kind:string,name:string,label=''):CSSProperties{const d=resourceDesign(kind,name,label);return {'--resource-accent':d.accent,'--resource-soft':d.soft} as CSSProperties;}
export default function ResourceIdentity({kind,name,label='',compact=false}:{kind:string;name:string;label?:string;compact?:boolean}){
 const [failedAsset,setFailedAsset]=useState('');
 const vendor=resourceVendor(name,label);
 if(kind.toLowerCase()==='agent' && !vendor)return <AgentIdentity name={name} label={label}/>;
 const {Icon}=resourceDesign(kind,name,label),Badge=/workflow/.test(kind)?Workflow:/skill/.test(kind)?BookOpen:/tool|api|mcp/.test(kind)?Wrench:Package;
 return <span aria-hidden="true" data-vendor={vendor?.key} data-resource-identity={`${kind}:${name}`} className={`aegis-resource-identity ${compact?'is-compact':''}`} style={resourceStyle(kind,name,label)}>
  <>{vendor && failedAsset!==vendor.asset ? <img className="aegis-resource-vendor-logo" src={`/vendor-logos/${vendor.asset}`} alt={vendor.key} onError={()=>setFailedAsset(vendor.asset)} /> : <Icon className="aegis-resource-symbol" strokeWidth={1.65}/>}</><span className="aegis-resource-badge"><Badge strokeWidth={2}/></span>
 </span>;
}
