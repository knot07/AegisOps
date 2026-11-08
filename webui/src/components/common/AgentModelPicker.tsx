import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Check,ChevronDown} from 'lucide-react';
import {ModelBrandIcon,brandStyle} from './VisualIdentity';

type ModelOption={providerID:string;providerName:string;modelID:string;label:string};
export default function AgentModelPicker({value,onChange,models,defaultLabel,defaultModelID}:{
 value:string;onChange:(key:string)=>void;models:ModelOption[];defaultLabel:string;defaultModelID?:string;
}){
 const [open,setOpen]=useState(false),[active,setActive]=useState(0),[position,setPosition]=useState({top:0,left:0,width:0,maxHeight:280});
 const anchor=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null),id=useId();
 const choices=[{key:'',label:`系统默认 · ${defaultLabel}`,modelID:defaultModelID||'',providerName:'默认模型'},...models.map(m=>({...m,key:`${m.providerID}::${m.modelID}`}))];
 if(value&&!choices.some(m=>m.key===value))choices.push({key:value,label:`${value.split('::')[1]}（当前配置）`,modelID:value.split('::')[1],providerName:value.split('::')[0]});
 const selected=choices.find(m=>m.key===value)||choices[0];
 const choose=(key:string)=>{onChange(key);setOpen(false);anchor.current?.focus();};
 useEffect(()=>{
  if(!open)return;
  const place=()=>{const rect=anchor.current?.getBoundingClientRect();if(!rect)return;const below=window.innerHeight-rect.bottom-12;const height=Math.min(320,Math.max(below,rect.top-12));const upward=below<260&&rect.top>below;setPosition({left:Math.min(rect.left,window.innerWidth-rect.width-10),width:rect.width,top:upward?Math.max(8,rect.top-height-6):rect.bottom+6,maxHeight:height});};
  const outside=(event:PointerEvent)=>{const target=event.target as Node;if(!anchor.current?.contains(target)&&!menu.current?.contains(target))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);anchor.current?.focus();}};
  place();document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape,true);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[open]);
 useEffect(()=>{if(open)menu.current?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)?.scrollIntoView({block:'nearest'});},[active,open]);
 return <div className="min-w-0 flex-1">
  <button ref={anchor} type="button" role="combobox" aria-label="选择智能体模型" aria-expanded={open} aria-controls={id} aria-haspopup="listbox" aria-activedescendant={open?`${id}-${active}`:undefined}
   style={brandStyle(selected.modelID)} className="aegis-agent-model-trigger flex min-h-10 w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm"
   onClick={()=>{setActive(Math.max(0,choices.findIndex(m=>m.key===value)));setOpen(!open);}}
   onKeyDown={event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();if(!open){setOpen(true);setActive(Math.max(0,choices.findIndex(m=>m.key===value)));return;}setActive(i=>event.key==='Home'?0:event.key==='End'?choices.length-1:(i+(event.key==='ArrowUp'?-1:1)+choices.length)%choices.length);}else if(event.key==='Enter'&&open){event.preventDefault();choose(choices[active].key);}else if(event.key==='Tab')setOpen(false);}}>
   <ModelBrandIcon value={selected.modelID} className="is-composer-choice"/><span className="min-w-0 flex-1 truncate">{selected.label}</span><ChevronDown size={14}/>
  </button>
  {open&&createPortal(<div ref={menu} id={id} role="listbox" aria-label="智能体模型选项" className="aegis-agent-model-menu fixed z-[100] overflow-y-auto rounded-2xl border border-[#e2e8dc] bg-white p-2 shadow-xl" style={position}>
   {choices.map((choice,index)=><div key={choice.key}>
    {(index===0||choice.providerName!==choices[index-1].providerName)&&<div className="flex items-center gap-2 px-2 pt-2 pb-1 text-[11px] text-gray-400"><ModelBrandIcon value={choice.providerName} className="is-composer"/>{choice.providerName}</div>}
    <div id={`${id}-${index}`} role="option" aria-selected={value===choice.key} data-option-index={index} data-agent-model-choice={choice.modelID}
     style={brandStyle(choice.modelID)} className={`aegis-agent-model-option flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2.5 text-[13px] ${active===index?'is-active':''}`}
     onPointerMove={()=>setActive(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(choice.key)}>
     <ModelBrandIcon value={choice.modelID} className="is-composer-choice"/><span className="min-w-0 flex-1 truncate">{choice.label}</span>{choice.key===value&&<Check size={15} className="shrink-0 text-[#678d40]"/>}
    </div>
   </div>)}
  </div>,document.body)}
 </div>;
}
