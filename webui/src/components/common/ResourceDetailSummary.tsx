import ResourceIdentity from './ResourceIdentity';
export default function ResourceDetailSummary({kind,name,title,badges=[],metrics=[]}:{
 kind:string;name:string;title:string;badges?:string[];metrics?:{label:string;value:string|number}[];
}){
 return <section className="aegis-detail-summary" data-detail-summary={kind}>
  <div className="aegis-detail-summary-heading"><ResourceIdentity kind={kind} name={name} label={title}/><div className="min-w-0 flex-1"><p className="aegis-detail-eyebrow">{kind==='agent'?'AGENT PROFILE':kind==='skill'?'SKILL PROFILE':'TOOL PROFILE'}</p><h3>{title}</h3></div></div>
  {badges.length>0&&<div className="aegis-detail-tags">{badges.filter(Boolean).map((badge,index)=><span key={index}>{badge}</span>)}</div>}
  {metrics.length>0&&<dl className="aegis-detail-metrics">{metrics.map(metric=><div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>}
 </section>;
}
