import { useId, type ReactNode } from 'react';

export type UtilityKind = 'language' | 'theme' | 'sun' | 'moon' | 'system' | 'update' | 'bell' | 'collapse' | 'expand';
export default function UtilityGlyph({ kind }: { kind: UtilityKind }) {
 const icons = {
  theme: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.8a9.2 9.2 0 1 0 0 18.4h1.1a2 2 0 0 0 1.6-3.2c-.7-.9-.1-2.2 1-2.2H18a3.2 3.2 0 0 0 3.2-3.3A9.4 9.4 0 0 0 12 2.8Z" fill="currentColor" fillOpacity=".08"/>
    <circle cx="7.2" cy="10.2" r="1" fill="currentColor" stroke="none"/><circle cx="10.2" cy="6.8" r="1" fill="currentColor" stroke="none"/><circle cx="14.8" cy="7" r="1" fill="currentColor" stroke="none"/><circle cx="17.7" cy="10.6" r="1" fill="currentColor" stroke="none"/>
  </g>,
  language: <><path d="M3 5h11v3H3zM7 2h3v3H7zM6 8c1 5 4 8 8 10l-2 2C7 17 4 13 3 8zm5 0h3c-1 5-5 9-10 12l-2-2c5-3 8-6 9-10z"/><path d="m16 10 6 12h-3l-1-3h-5l-1 3H9l6-12zm-2 6h3l-1.5-3z" fillRule="evenodd"/></>,
  sun: <><path d="m12 5 5 3v7l-5 3-5-3V8zm0 3-2 1v4l2 2 2-2V9z" fillRule="evenodd"/><path d="M11 0h2v3h-2zM11 21h2v3h-2zM0 11h3v2H0zM21 11h3v2h-3zM3 2l3 3-2 2-3-3zM19 17l3 3-2 2-3-3zM18 5l3-3 2 2-3 3zM1 20l3-3 2 2-3 3z"/></>,
  moon: <path d="M14 1a10 10 0 1 0 9 14A10 10 0 0 1 14 1zm-4 4c0 7 3 11 9 12A7 7 0 1 1 10 5z" fillRule="evenodd"/>,
  system: <><path d="M1 3h22v15H1zm3 3v9h16V6z" fillRule="evenodd"/><path d="M10 18h4v3h5v2H5v-2h5zM6 11l3-3 3 3 4-4 2 2-6 6-3-3-1 1z"/></>,
  update: <><path d="m12 1 10 6v11l-10 6-10-6V7zm0 3L5 9v7l7 4 7-4V9z" fillRule="evenodd"/><path d="m12 6 6 6h-4v6h-4v-6H6z"/></>,
  bell: <><path d="M11 1h2v3c4 0 6 4 6 8v3l3 4H2l3-4v-3c0-4 2-8 6-8zm1 5c-3 0-4 3-4 6v4l-1 1h10l-1-1v-4c0-3-1-6-4-6z" fillRule="evenodd"/><path d="M9 21h6c-1 4-5 4-6 0z"/></>,
  collapse: <><path d="M2 3h20v18H2zm3 3v12h3V6zm6 0v12h8V6z" fillRule="evenodd"/><path d="m16 7-4 5 4 5v-4h2v-2h-2z"/></>,
  expand: <><path d="M2 3h20v18H2zm3 3v12h3V6zm6 0v12h8V6z" fillRule="evenodd"/><path d="m13 7 5 5-5 5v-4h-1v-2h1z"/></>,
 };
 const refined: Partial<Record<UtilityKind,ReactNode>> = {
  language: <g fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="3" width="12" height="13" rx="3" fill="currentColor" fillOpacity=".06"/>
    <path d="M9.5 16v2.5A2.5 2.5 0 0 0 12 21h7a2.5 2.5 0 0 0 2.5-2.5v-8A2.5 2.5 0 0 0 19 8h-2"/>
    <path d="M5.5 7h6M8.5 5.5V7m2 0c-.5 3-2 4.5-5 6m1-4c1 2 2 3 4.5 4M13 18l2.5-6 2.5 6m-4-1.5h3"/>
  </g>,
  sun: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity=".09"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>
    <path d="M10.5 9.7a2.7 2.7 0 0 1 3.8 3.8" strokeOpacity=".45"/>
  </g>,
  moon: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5a8.5 8.5 0 1 0 10.9 10.9Z" fill="currentColor" fillOpacity=".06"/><path d="M17 3v4M15 5h4" strokeOpacity=".65"/></g>,
  system: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="3.5" width="19" height="13" rx="3" fill="currentColor" fillOpacity=".05"/><path d="M9 21h6M12 17v4"/><circle cx="12" cy="10" r="3"/><path d="M12 7v6" strokeOpacity=".5"/></g>,
  update: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.3 9A8.5 8.5 0 1 1 17.4 5.5"/>
    <path d="M17.5 2.5v4.7h-4.7"/>
    <path d="M12 16V9m-3 3 3-3 3 3"/>
    <circle cx="12" cy="12" r="5.7" stroke="none" fill="currentColor" fillOpacity=".04"/>
  </g>,
  bell: <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 11.7V10a5.8 5.8 0 0 0-11.6 0v1.7c0 2.6-.8 3.6-1.5 4.6-.4.5 0 1.2.7 1.2h13.2c.7 0 1.1-.7.7-1.2-.7-1-1.5-2-1.5-4.6Z" fill="currentColor" fillOpacity=".055"/>
    <path d="M10 20a2.2 2.2 0 0 0 4 0M12 2v2"/>
    <path d="M15 7a4.1 4.1 0 0 1 1.1 3" strokeOpacity=".4"/>
  </g>,
 };
 return <span className="aegis-utility-glyph" data-utility-glyph={kind} aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none">{refined[kind] || icons[kind]}</svg></span>;
}

export function IdentityAvatar({ admin }: { admin: boolean }) {
 const id=useId().replace(/:/g,'');
 return <span className="aegis-identity-avatar" data-avatar-role={admin?'admin':'member'} aria-hidden="true"><svg viewBox="0 0 48 48" fill="none">
  <defs><linearGradient id={id} x1="8" y1="42" x2="40" y2="5" gradientUnits="userSpaceOnUse"><stop stopColor={admin?'#347C63':'#457D9B'}/><stop offset="1" stopColor={admin?'#9EBF75':'#8FC4D3'}/></linearGradient></defs>
  <path d="m24 2 19 10v21L24 46 5 33V12Z" fill={`url(#${id})`}/><path d="m24 6 15 8v16L24 41 9 30V14Z" fill="white" fillOpacity=".13"/>
  <path d="m24 12 6 4v7l-6 4-6-4v-7Z" fill="white" fillOpacity=".96"/><path d="M12 34c1-10 23-10 24 0l-12 8z" fill="white" fillOpacity=".9"/>
  {admin&&<><path d="m33 3 4 3 5-2-1 6-5 3-5-4z" fill="#E5BC63"/><path d="m35 6 2 1 2-1-1 3-2 1z" fill="#FFF5D1"/></>}
 </svg></span>;
}
