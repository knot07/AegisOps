import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';
import { expect, it } from 'vitest';
const css = postcss.parse(readFileSync(resolve(__dirname, 'dark-theme.css'), 'utf8'));
const palette: Record<string, string> = {};
css.nodes[0];
css.walkRules(rule => { if (rule.selector === 'html.dark,html.dark .aegisops-shell') rule.walkDecls(decl => { palette[decl.prop] = decl.value; }); });
function value(token: string): string { const s = palette[token]; return s.startsWith('var(') ? value(s.slice(4, -1)) : s; }
function luminance(hex: string) { const c = hex.replace('#','').match(/../g)!.map(s => parseInt(s,16)/255).map(v => v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4); return c[0]*.2126+c[1]*.7152+c[2]*.0722; }
function contrast(a: string,b: string) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
it('keeps body, secondary, metadata and link text readable on all neutral surface levels', () => {
 for(const fg of ['--night-text','--night-secondary','--night-muted','--night-link'])
  for(const bg of ['--night-canvas','--night-sidebar','--night-surface','--night-raised'])
   expect(contrast(value(fg),value(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
});
it('keeps functional statuses and primary action text readable in dark mode', () => {
 for(const status of ['success','warning','danger','info']) expect(contrast(value(`--status-${status}`),value(`--status-${status}Bg`))).toBeGreaterThanOrEqual(4.5);
 expect(contrast(value('--action-onPrimary'),value('--action-primary'))).toBeGreaterThanOrEqual(4.5);
});
it('scopes every dark rule so the light theme is preserved', () => {
 css.walkRules(rule => { expect(rule.selector.startsWith('html.dark'), rule.selector).toBe(true); });
});
