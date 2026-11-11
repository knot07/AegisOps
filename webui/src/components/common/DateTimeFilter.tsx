import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './date-time-filter.css';

const pad=(n:number)=>String(n).padStart(2,'0');
const localDay=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
function parse(value:string){const d=value?new Date(value):new Date();return Number.isFinite(d.getTime())?d:new Date();}

export default function DateTimeFilter({ value, onChange, label, describedBy }: {value:string;onChange:(value:string)=>void;label:string;describedBy?:string}) {
 const {i18n}=useTranslation();const zh=i18n.language.startsWith('zh');const locale=zh?'zh-CN':'en-US';
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(()=>parse(value)),[month,setMonth]=useState(()=>parse(value));
 const trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);const id=useId();
 const [position,setPosition]=useState<CSSProperties>({visibility:'hidden'});
 const text=(cn:string,en:string)=>zh?cn:en;
 const close=()=>{setOpen(false);trigger.current?.focus();};
 useLayoutEffect(()=>{if(!open)return;const place=()=>{const a=trigger.current?.getBoundingClientRect();if(!a)return;const width=Math.min(310,window.innerWidth-24),height=panel.current?.offsetHeight||405;const below=window.innerHeight-a.bottom-12;const top=below>=height?a.bottom+7:Math.max(12,a.top-height-7);setPosition({width,left:Math.min(Math.max(12,a.left),window.innerWidth-width-12),top,maxHeight:window.innerHeight-24});};place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);return()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};},[open]);
 useEffect(()=>{if(!open)return;const focusFrame=requestAnimationFrame(()=>panel.current?.querySelector<HTMLButtonElement>('[aria-selected=true]')?.focus());const outside=(e:PointerEvent)=>{if(!panel.current?.contains(e.target as Node)&&!trigger.current?.contains(e.target as Node))setOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{cancelAnimationFrame(focusFrame);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
 const first=new Date(month.getFullYear(),month.getMonth(),1),offset=(first.getDay()+6)%7;
 const days=Array.from({length:42},(_,i)=>new Date(month.getFullYear(),month.getMonth(),i-offset+1));
 function choose(d:Date){const next=new Date(d.getFullYear(),d.getMonth(),d.getDate(),draft.getHours(),draft.getMinutes());setDraft(next);setMonth(new Date(next.getFullYear(),next.getMonth(),1));}
 function moveMonth(n:number){setMonth(new Date(month.getFullYear(),month.getMonth()+n,1));}
 return <div className="aegis-date-filter">
  <button ref={trigger} type="button" className={`aegis-date-trigger ${value?'has-value':''}`} aria-label={label} aria-describedby={describedBy} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>{if(open){close();return;}const d=parse(value);setDraft(d);setMonth(new Date(d.getFullYear(),d.getMonth(),1));setPosition({visibility:'hidden'});setOpen(true);}}><CalendarDays size={15}/><span>{value?value.replace('T',' '):label}</span></button>
  {open&&createPortal(<div ref={panel} id={id} role="dialog" aria-label={label} className="aegis-date-panel" style={position} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const items=Array.from(panel.current!.querySelectorAll<HTMLElement>('button,input,select'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
   <header><div><CalendarDays size={15}/><strong>{label}</strong></div><button type="button" aria-label={text('关闭日历','Close calendar')} onClick={close}><X size={16}/></button></header>
   <div className="aegis-calendar-month"><button type="button" aria-label={text('上个月','Previous month')} onClick={()=>moveMonth(-1)}><ChevronLeft size={16}/></button><span aria-live="polite">{month.toLocaleDateString(locale,{year:'numeric',month:'long'})}</span><button type="button" aria-label={text('下个月','Next month')} onClick={()=>moveMonth(1)}><ChevronRight size={16}/></button></div>
   <div className="aegis-calendar-week" aria-hidden="true">{(zh?['一','二','三','四','五','六','日']:['Mo','Tu','We','Th','Fr','Sa','Su']).map(w=><span key={w}>{w}</span>)}</div>
   <div className="aegis-calendar-grid" role="grid" aria-label={text('选择日期','Choose date')}>
    {days.map(d=>{const day=localDay(d),selected=day===localDay(draft);return <button key={day} type="button" role="gridcell" aria-label={day} aria-selected={selected} aria-current={day===localDay(new Date())?'date':undefined} tabIndex={selected?0:-1} data-outside={d.getMonth()!==month.getMonth()} onClick={()=>choose(d)} onKeyDown={e=>{const delta=({'ArrowLeft':-1,'ArrowRight':1,'ArrowUp':-7,'ArrowDown':7} as Record<string,number>)[e.key];if(delta){e.preventDefault();const next=new Date(d.getFullYear(),d.getMonth(),d.getDate()+delta);choose(next);requestAnimationFrame(()=>panel.current?.querySelector<HTMLButtonElement>('[aria-selected=true]')?.focus());}}}>{d.getDate()}</button>;})}
   </div>
   <div className="aegis-calendar-time"><span><Clock3 size={14}/>{text('时间','Time')}</span><input type="number" min={0} max={23} aria-label={text('小时','Hour')} value={pad(draft.getHours())} onChange={e=>{if(e.target.value==='')return;const n=Number(e.target.value);if(n<0||n>23)return;const d=new Date(draft);d.setHours(n);setDraft(d);}}/><b>:</b><input type="number" min={0} max={59} aria-label={text('分钟','Minute')} value={pad(draft.getMinutes())} onChange={e=>{if(e.target.value==='')return;const n=Number(e.target.value);if(n<0||n>59)return;const d=new Date(draft);d.setMinutes(n);setDraft(d);}}/></div>
   <footer><button type="button" onClick={()=>{onChange('');close();}}>{text('清空','Clear')}</button><button type="button" onClick={()=>{const d=new Date();choose(d);}}>{text('今天','Today')}</button><button type="button" className="aegis-calendar-confirm" onClick={()=>{onChange(`${localDay(draft)}T${pad(draft.getHours())}:${pad(draft.getMinutes())}`);close();}}>{text('确定','Apply')}</button></footer>
  </div>,document.body)}
 </div>;
}
