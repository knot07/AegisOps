import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import { expect,it } from 'vitest';
import palettes from './theme-palettes.json';
function luminance(hex:string){const c=hex.slice(1).match(/../g)!.map(s=>parseInt(s,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
it.each(palettes)('$name keeps text and primary actions readable in both modes',skin=>{
 for(const mode of ['light','dark'] as const){const p=skin[mode];
  for(const text of ['text','secondary','muted'] as const)for(const bg of ['canvas','sidebar','surface','raised','selected'] as const)expect(contrast(p[text],p[bg]),`${skin.id}/${mode} ${text} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  for(const bg of ['buttonFrom','buttonTo'] as const)expect(contrast(p.buttonText,p[bg]),`${skin.id}/${mode} button`).toBeGreaterThanOrEqual(4.5);
  for(const bg of ['surface','selected'] as const)expect(contrast(p.accent,p[bg]),`${skin.id}/${mode} accent`).toBeGreaterThanOrEqual(4.5);
 }
});
it('ships exactly the advertised palette values and scopes overrides to an explicit skin',()=>{
 const css=postcss.parse(readFileSync(resolve(__dirname,'theme-palettes.css'),'utf8'));
 for(const skin of palettes.filter(s=>s.id!=='sage'))for(const mode of ['light','dark'] as const){const marker=`html[data-theme-skin="${skin.id}"]${mode==='dark'?'.dark':':not(.dark)'}`;const rule=css.nodes.find(n=>n.type==='rule'&&n.selector.startsWith(marker));expect(rule).toBeTruthy();if(rule?.type==='rule'){const vars:Record<string,string>={};rule.walkDecls(d=>{vars[d.prop]=d.value});for(const [name,value]of Object.entries(skin[mode]))expect(vars['--skin-'+name]).toBe(value);}}
 for(const file of ['theme-palettes.css','theme-skins.css'])postcss.parse(readFileSync(resolve(__dirname,file),'utf8')).walkRules(rule=>{expect(rule.selector.startsWith('html[data-theme-skin]')||rule.selector.startsWith('html[data-theme-skin=')).toBe(true);expect(rule.selector).not.toContain('tdp_ai');});
});
