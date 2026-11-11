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
 if(!document.getElementById('atlas-entry-style')){const style=document.createElement('style');style.id='atlas-entry-style';style.textContent=`.native-scene-launch{padding:16px 28px 0}.native-scene-launch .atlas-workbench-entry{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:9px 16px;border:1px solid #9bc967;border-radius:9px;background:linear-gradient(120deg,#b6e583,#9dd464);color:#314e20;font:600 13px/1.4 'Segoe UI','Microsoft YaHei',sans-serif;box-shadow:0 3px 9px #648c351a;cursor:pointer;transition:background .18s,box-shadow .18s,transform .18s}.native-scene-launch .atlas-workbench-entry:hover{background:linear-gradient(120deg,#a8dc71,#90c956);box-shadow:0 4px 12px #648c3529;transform:translateY(-1px)}.native-scene-launch .atlas-workbench-entry:active{transform:translateY(0)}.native-scene-launch .atlas-workbench-entry:focus-visible{outline:3px solid #99c96766;outline-offset:3px}`;document.head.append(style);}
 container.replaceChildren();container.className='native-scene-launch';
 const toolbar=document.createElement('div');toolbar.style.cssText='display:flex;align-items:center;gap:10px;padding:0 0 20px;';
 const launch=document.createElement('button');launch.type='button';launch.className='atlas-workbench-entry';launch.textContent='✧ Atlas 工作台';
 const manual=document.createElement('button');manual.type='button';manual.textContent='手动填写';toolbar.append(launch);container.append(toolbar);
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
