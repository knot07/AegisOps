import { useEffect } from 'react';

// CSS-generated fallback icons keep React-owned button children intact.
export default function WorkspaceActionTheme() {
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      frame = 0;
      document.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
        // The review workspaces keep their own design system.
        if (button.closest('[data-contract-workspace="tdp_ai"], [data-contract-workspace="ai-demo"], [data-aegis-scene]')) return;
        const classes = button.className;
        if (typeof classes !== 'string' || !/(?:bg-red-600|bg-gray-900|bg-slate-900|yushu-primary|ui-btn-primary|bg-\[#(?:253126|253429|1c2520)\])/i.test(classes)) return;
        const text = button.textContent?.trim() || '';
        const danger = /删除|移除|卸载|清空|吊销|撤销|delete|remove|uninstall|revoke|clear all/i.test(text) || Boolean(button.querySelector('svg.lucide-trash-2,svg.lucide-trash'));
        const tone = danger ? 'danger' : 'primary';
        if (button.dataset.aegisActionTone !== tone) button.dataset.aegisActionTone = tone;
        const icon = /创建|新增|添加|登记|create|add|new /i.test(text) ? 'plus' : /下载|导出|download|export/i.test(text) ? 'download' : /刷新|同步|重试|retry|refresh|sync/i.test(text) ? 'refresh' : /启动|运行|执行|start|run/i.test(text) ? 'play' : /安装|install/i.test(text) ? 'download' : 'check';
        if (!button.querySelector('svg,img') && !danger && text) {
          if (button.dataset.aegisActionIcon !== icon) button.dataset.aegisActionIcon = icon;
        } else if (button.dataset.aegisActionIcon) delete button.dataset.aegisActionIcon;
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(refresh); };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {subtree: true, childList: true, characterData: true});
    refresh();
    return () => { observer.disconnect(); if(frame) cancelAnimationFrame(frame); };
  }, []);
  return null;
}
