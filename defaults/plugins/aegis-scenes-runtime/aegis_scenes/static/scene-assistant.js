/* Scene bridge: the shell renders its real EntitySheet + SessionChat. */
(()=>{
const origin=location.origin,host=window.parent!==window?window.parent:window;
function request(opts,callback){
 const id=crypto.randomUUID();let received=false;
 const listener=event=>{if(event.origin!==origin||event.source!==host||event.data?.type!=='aegis:scene-assistant-result'||event.data.id!==id)return;received=true;window.removeEventListener('message',listener);callback?.(event.data)};
 window.addEventListener('message',listener);
 const context=typeof opts.context==='function'?opts.context():opts.context||{};
 host.postMessage({type:'aegis:scene-assistant-open',id,kind:opts.kind||'alert',context},origin);
 return ()=>{if(!received)window.removeEventListener('message',listener)};
}
function mount(container,opts={}){
 container.replaceChildren();container.className='native-scene-launch';
 const toolbar=document.createElement('div');toolbar.style.cssText='display:flex;align-items:center;gap:10px;padding:0 0 20px;';
 const launch=document.createElement('button');launch.type='button';launch.textContent='✧ Atlas 工作台';
 const manual=document.createElement('button');manual.type='button';manual.textContent='手动填写';toolbar.append(launch,manual);container.append(toolbar);
 const surface=container.closest('.backdrop')||container.closest('.modal')||container.closest('.scene-ai-modal');
 const show=()=>{if(surface)surface.style.display='';if(opts.manual)opts.manual.hidden=false;opts.onMode?.(false)};
 const open=()=>{if(surface)surface.style.display='none';request(opts,result=>{
  show();if(result.action==='apply'&&result.draft)opts.onApply?.(result.draft);
  if(result.action==='close'){
   const close=surface?.querySelector('[data-action="close"],.dialog>.head>button,.modal-head .close-btn');close?.click();
  }
 })};
 launch.onclick=open;manual.onclick=show;
 if(opts.manual)opts.manual.hidden=false;
 open();return {mode:ai=>ai?open():show()};
}
function open(opts={}){return request(opts)}
window.AegisSceneAI={mount,open,native:true};
})();
