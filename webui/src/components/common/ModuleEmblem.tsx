import { useId, type ReactNode, type CSSProperties } from 'react';
import './module-emblem.css';

// Original, filled geometric marks for the platform's navigation modules.
const designs: Record<string, { color: string; light: string; art: ReactNode }> = {
  workflow: { color: '#7050C8', light: '#A58AF1', art: <><path d="M9 7h15v15H9zM36 26h15v15H36zM9 41h15v15H9z"/><path d="M24 12h9a10 10 0 0 1 10 10v4h-6v-4a4 4 0 0 0-4-4h-9zM37 35H30a10 10 0 0 0-10 10v2h6v-2a4 4 0 0 1 4-4h7z"/><path fill="white" fillOpacity=".6" d="M12 10h5v3h-5zM39 29h5v3h-5zM12 44h5v3h-5z"/></> },
  agent: { color: '#287C9B', light: '#66BFCD', art: <><path d="m32 4 23 13v28L32 58 9 45V17zm0 8L16 21v20l16 9 16-9V21z" fillRule="evenodd"/><path d="m32 18 11 6v14l-11 6-11-6V24z"/><path d="m32 23 6 4v8l-6 4-6-4v-8z" fill="white" fillOpacity=".9"/><path d="M29 4h6v11h-6zM29 47h6v11h-6z"/></> },
  skill: { color: '#D58B27', light: '#F0C76C', art: <><path d="M8 12h20v8H16v12h12v8H8zM36 12h20v28H36v-8h12V20H36z"/><path d="m32 5 8 15-8 15-8-15zM21 44h22l-11 15z"/><path d="m30 14 4 6-4 6z" fill="white" fillOpacity=".7"/></> },
  task: { color: '#268B7C', light: '#62C7A8', art: <><path d="M12 6h29l11 11v39H12zm8 8v34h24V21H33v-7z" fillRule="evenodd"/><path d="m5 32 6-6 12 12 23-23 6 6-29 29z"/><path d="m33 6 19 19V17L41 6z" fill="white" fillOpacity=".45"/></> },
  workspace: { color: '#3F84CE', light: '#85B7F5', art: <><path d="m7 18 25-13 25 13-25 14zm0 9 25 13 25-13v10L32 50 7 37zm0 19 25 13 25-13v9L32 68 7 55z" transform="translate(0 -3) scale(1 .92)"/><path d="m21 18 11-6 11 6-11 6z" fill="white" fillOpacity=".75"/></> },
  knowledge: { color: '#4C78C4', light: '#88B2F0', art: <><path d="M6 12h20l6 6 6-6h20v36H39l-7 8-7-8H6zm7 8v20h15V25l-5-5zm38 0H41l-5 5v15h15z" fillRule="evenodd"/><path d="M29 19h6v30h-6z"/></> },
  memory: { color: '#AC5DB0', light: '#DB96D1', art: <><path d="M12 22A20 20 0 1 1 48 36l-9 12H26l-3-8H12zm10 0v9h8l3 8h2l7-9a12 12 0 1 0-20-8z" fillRule="evenodd"/><path d="M25 52h16v6H25zM28 22h10v9H28z"/></> },
  model: { color: '#5966C7', light: '#9B9DEC', art: <><path d="m32 3 26 15v29L32 62 6 47V18zm0 9L14 23v19l18 10 18-10V23z" fillRule="evenodd"/><path d="m32 18 13 8v15l-13 8-13-8V26zm0 8-6 4v7l6 4 6-4v-7z" fillRule="evenodd"/><path d="M7 19 32 33l25-14v7L32 40 7 26z" fillOpacity=".6"/></> },
  device: { color: '#168C94', light: '#65C7C4', art: <><path d="M9 6h46v17H9zm7 6v5h32v-5zM9 28h46v17H9zm7 6v5h32v-5z" fillRule="evenodd"/><path d="M28 45h8v8h17v6H11v-6h17z"/><path d="M41 12h7v5h-7zM41 34h7v5h-7z" fill="white"/></> },
  channel: { color: '#B76386', light: '#E7A0B7', art: <><path d="M5 16h24v19H15L5 44zm8 7v5h9v-5zM35 28h24v19H49L39 57V47h-4zm7 7v5h10v-5z" fillRule="evenodd"/><path d="M34 6a24 24 0 0 1 24 18h-7A17 17 0 0 0 34 13zM34 17a13 13 0 0 1 13 7h-8a5 5 0 0 0-5-1z"/></> },
  hub: { color: '#C77637', light: '#EBC18B', art: <><path d="m32 3 23 13v26L32 55 9 42V16zm0 9L17 21v16l15 9 15-9V21z" fillRule="evenodd"/><path d="m32 20 10 6v12l-10 6-10-6V26zM2 43l9-5 8 5v10l-8 5-9-5zm43 0 8-5 9 5v10l-9 5-8-5z"/></> },
  tools: { color: '#4484B7', light: '#87B9E4', art: <><path d="m13 8 10 2 2 10-9 10L4 18zm18 23 9-9 19 19-9 9zM40 7l17 3-1 17-11-4-22 30-10 6-6-6 6-10 30-22z"/><path d="m42 12 9 2-1 8-5-3-4 4-3-3 5-5z" fill="white" fillOpacity=".75"/></> },
  preferences: { color: '#73865A', light: '#B4C58D', art: <><path d="M8 13h48v6H8zm0 16h48v6H8zm0 16h48v6H8z"/><path d="M18 7h12v18H18zm19 16h12v18H37zM16 39h12v18H16z"/><path d="M22 11h4v10h-4zM41 27h4v10h-4zM20 43h4v10h-4z" fill="white" fillOpacity=".8"/></> },
  accounts: { color: '#7961B5', light: '#B69ADF', art: <><path d="M32 5 54 14v17c0 15-22 28-22 28S10 46 10 31V14zm0 9-14 6v11c0 8 14 18 14 18s14-10 14-18V20z" fillRule="evenodd"/><circle cx="32" cy="26" r="7"/><path d="M22 42c0-13 20-13 20 0z"/></> },
  logs: { color: '#507F98', light: '#95BFCD', art: <><path d="M10 5h33l11 11v43H10zm8 8v38h28V22H36v-9z" fillRule="evenodd"/><path d="M3 31h14l5-10 8 20 6-12h18v6H40L29 55l-8-20-1 2H3z"/></> },
  archive: { color: '#8B7B62', light: '#CCB999', art: <><path d="M5 9h54v13H5zm6 18h42v30H11zm8 7v16h26V34z" fillRule="evenodd"/><path d="M24 28h16v9H24zM13 13h38v4H13z"/></> },
  scenes: { color: '#4C9874', light: '#9CCE9D', art: <><path d="m32 4 25 14v28L32 60 7 46V18zm0 9L15 23v18l17 10 17-10V23z" fillRule="evenodd"/><path d="M21 23h9v9h-9zm13 0h9v9h-9zM21 36h9v9h-9zm13 0h9v9h-9z"/></> },
  atlas: { color: '#347C55', light: '#98C975', art: <><path d="M5 55 25 10a8 8 0 0 1 14 0l20 45H44L32 27 20 55Z"/><path d="m26 40-5 12h22l-5-12Z" fill="#a8de63"/><circle cx="53" cy="12" r="5" fill="#58c6b0"/></> },
  home: { color: '#478D75', light: '#91C5A3', art: <><path d="M4 29 32 4l28 25-6 7-22-20-22 20z"/><path d="M12 34 32 17l20 17v25H37V42H27v17H12z"/><path d="m16 36 16-13v7L16 43z" fill="white" fillOpacity=".5"/></> },
  chat: { color: '#418CA0', light: '#88C6CF', art: <><path d="M5 8h54v36H29L11 59V44H5zm8 8v20h6v7l8-7h24V16z" fillRule="evenodd"/><path d="m32 18 3 7 8 3-8 3-3 7-3-7-8-3 8-3z"/></> },
  logout: { color: '#A2706D', light: '#D7A79B', art: <><path d="M8 5h28v14h-7v-7H16v40h13v-7h7v14H8zM29 28h18L37 18h10l15 14-15 14H37l10-10H29z"/></> },
  review: { color: '#307DC2', light: '#79BCE6', art: <><path d="M31 4a27 27 0 1 0 29 29H48a15 15 0 1 1-17-17Z"/><path d="M36 4v25h25C59 16 49 6 36 4Z" fill="#39bada"/><path d="m31 32 18-17 5 5-18 18Z" fill="#173e80"/><circle cx="31" cy="33" r="6" fill="white"/></> },
  vulnops: { color: '#C57333', light: '#EAC26F', art: <><path d="M14 9C27-1 46 3 54 16l-9 7C39 13 27 11 19 18l6 5H5V3Z"/><path d="M50 55C37 65 18 61 10 48l9-7c6 10 18 12 26 5l-6-5h20v20Z" fill="#df9c28"/><path d="m32 20 12 12-12 12-12-12Z" fill="#9c561c"/><path d="m32 27 5 5-5 5-5-5Z" fill="#fff"/></> },
  incident: { color: '#CD5363', light: '#F2A078', art: <><path d="M33 2C47 12 58 23 55 39 52 53 40 62 27 59 10 57 3 43 9 30c1 12 7 17 13 17C15 32 33 25 33 2Z"/><path d="m36 20-17 21h12l-4 19 22-30H36l6-10Z" fill="#ffcf79"/></> },

};

export function sceneEmblemKind(id: string): string {
  return ({agent:'atlas',tdp_ai:'review',vuln_ops:'vulnops',incident_response:'incident'} as Record<string,string>)[id] || 'scenes';
}

export default function ModuleEmblem({ kind, size = 'page' }: { kind: string; size?: 'page' | 'nav' | 'hero' }) {
  const id = useId().replace(/:/g, '');
  const d = designs[kind] || designs.scenes;
  return <span className={`aegis-module-emblem aegis-emblem-${size}`} data-module-emblem={kind} style={{ '--emblem-color': d.color } as CSSProperties} aria-hidden="true">
    <svg viewBox="0 0 64 64" fill={`url(#${id})`} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id={id} x1="8" y1="55" x2="52" y2="6" gradientUnits="userSpaceOnUse"><stop stopColor={d.color}/><stop offset="1" stopColor={d.light}/></linearGradient></defs>
      {d.art}
    </svg>
  </span>;
}
