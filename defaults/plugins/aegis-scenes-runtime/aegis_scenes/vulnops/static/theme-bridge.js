/* Same-origin scenes follow the host appearance before first paint and on every change. */
(() => {
 const root=document.documentElement,query=window.matchMedia('(prefers-color-scheme: dark)'),skins=['sage','blue','teal','violet','sand'];
 let host=null;
 try { if(window.parent!==window)host=window.parent.document.documentElement; } catch (_) {}
 const stored=key=>{try{return localStorage.getItem(key)}catch(_){return null}};
 const apply=()=>{
  const mode=stored('aegisops_theme_mode'),dark=host?host.classList.contains('dark'):mode==='dark'||mode!=='light'&&query.matches;
  const skin=host?host.dataset.themeSkin:stored('aegisops_theme_skin');
  root.classList.toggle('dark',dark);root.style.colorScheme=dark?'dark':'light';root.dataset.themeSkin=skins.includes(skin)?skin:'sage';
 };
 apply();
 if(host){const observer=new MutationObserver(apply);observer.observe(host,{attributes:true,attributeFilter:['class','data-theme-skin']});window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});}
 else {query.addEventListener('change',apply);window.addEventListener('storage',apply);}
})();
