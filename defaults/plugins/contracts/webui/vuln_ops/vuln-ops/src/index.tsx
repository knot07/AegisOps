import React, {useEffect,useRef} from 'react';
export default function Page(){
 const frame=useRef<HTMLIFrameElement>(null);
 const initial=useRef(new URLSearchParams(location.search).get('view')||'overview');
 useEffect(()=>{
  const message=(event:MessageEvent)=>{
   if(event.origin!==location.origin||event.source!==frame.current?.contentWindow||event.data?.type!=='aegis:vuln-view')return;
   const view=event.data.view;if(!['overview','ledger','remediation','assets','users','audit'].includes(view))return;
   const url=new URL(location.href);url.searchParams.set('view',view);
   history.replaceState(history.state,'',url);window.dispatchEvent(new PopStateEvent('popstate',{state:history.state}));
  };
  window.addEventListener('message',message);return()=>window.removeEventListener('message',message);
 },[]);
 return <iframe ref={frame} title="漏洞运营场景" src={'/api/scenes/vulnops/?view='+encodeURIComponent(initial.current)+'&vulnerability='+encodeURIComponent(new URLSearchParams(location.search).get('vulnerability')||'')} style={{display:'block',width:'100%',height:'calc(100dvh - 16px)',border:0,background:'transparent'}}/>;
}
