import { useState, type PointerEventHandler, type ReactNode } from 'react';
import LoginSignalField from './LoginSignalField';
import { LoginClock, LoginNetwork } from './LoginMotion';
import './login-motion.css';
import { Globe, ShieldCheck, Workflow, ScanLine, ArrowUpRight, Pause, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useProductName } from '@/contexts/ProductNameContext';

const LANGUAGES = [{ code: 'en-US', label: 'EN' }, { code: 'zh-CN', label: '中' }] as const;

interface AuthLayoutProps {
  children: ReactNode;
  loginMotion?: boolean;
  loginSuccess?: boolean;
  onLoginPointerMove?: PointerEventHandler<HTMLElement>;
  onLoginPointerLeave?: PointerEventHandler<HTMLElement>;
}

export default function AuthLayout({ children, loginMotion, loginSuccess, onLoginPointerMove, onLoginPointerLeave }: AuthLayoutProps) {
  const { i18n, t } = useTranslation('nav');
  const { productName } = useProductName();
  const [paused, setPaused] = useState(false);
  const zh = i18n.language.startsWith('zh');
  const features = [
    { icon: ScanLine, title: zh ? '洞察威胁' : 'Understand threats', text: zh ? '让线索成为清晰的判断' : 'Turn signals into clear decisions' },
    { icon: Workflow, title: zh ? '编排行动' : 'Orchestrate action', text: zh ? '将专业能力连接为工作流' : 'Connect expertise into workflows' },
    { icon: ShieldCheck, title: zh ? '协同处置' : 'Respond together', text: zh ? '从对话出发，推动安全运营' : 'Move security operations forward' },
  ];
  const story = <div className="yushu-auth-copy"><span className="yushu-eyebrow">INTELLIGENCE INTO ACTION</span><h1>{zh ? <>安全运营，<br />尽在掌握。</> : <>Security operations.<br />In your hands.</>}</h1><p>{zh ? '以智能体连接工具、知识与流程，让每一次研判与行动都有迹可循。' : 'Connect agents, tools and knowledge. Bring clarity to every decision and action.'}</p></div>;
  return <div className={`yushu-auth${loginMotion ? ' auth-login-motion' : ''}`} data-login-success={loginSuccess || undefined} data-login-paused={loginMotion && paused || undefined}>
    {loginMotion && <div className="login-visuals" aria-hidden="true"><LoginSignalField paused={paused} /><LoginNetwork /></div>}
    {!loginMotion && <aside className="yushu-auth-story">
      <div className="yushu-auth-brand"><img src="/favicon.svg" alt="" /><div><strong>{productName}</strong><span>AEGISOPS / SECURITY INTELLIGENCE</span></div></div>
      <div className="yushu-auth-orbit" aria-hidden="true"><i /><i /><i /><span>AO</span><b /><b /></div>{story}
      <div className="yushu-auth-features">{features.map(({ icon: Icon, title, text }) => <div key={title}><Icon aria-hidden="true" /><strong>{title}</strong><p>{text}</p><ArrowUpRight className="yushu-feature-arrow" aria-hidden="true" /></div>)}</div>
      <footer>© {new Date().getFullYear()} AegisOps <span>御枢 · AI 安全运营平台</span></footer>
    </aside>}
    <main className="yushu-auth-main" onPointerMove={onLoginPointerMove} onPointerLeave={onLoginPointerLeave}>
      <div className="yushu-auth-options" role="group" aria-label={t('switchLanguage')}>
        <Globe className="h-4 w-4" aria-hidden />
        {LANGUAGES.map(({ code, label }) => <button key={code} type="button" onClick={() => i18n.changeLanguage(code)} aria-pressed={i18n.language.startsWith(code.slice(0, 2))}>{label}</button>)}
        <ThemeToggle />
        {loginMotion && <button type="button" className="login-scene-toggle" aria-pressed={paused}
          aria-label={zh ? '暂停背景动效' : 'Pause background motion'}
          title={paused ? (zh ? '播放背景动效' : 'Play background motion') : (zh ? '暂停背景动效' : 'Pause background motion')}
          onClick={() => setPaused(value => !value)}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}</button>}
      </div>
      <div className="yushu-auth-form">
        {loginMotion && <div className="login-motion-brand"><img src="/favicon.svg" alt="" />
          <strong>{productName}</strong><span>AEGISOPS / SECURITY OPERATIONS</span></div>}
        {children}
      </div>
      {loginMotion && <LoginClock />}
      <div className="yushu-auth-footnote">{zh ? '从一个清晰的判断，开始下一步行动。' : 'A clear decision. A confident next step.'}</div>
    </main>
  </div>;
}
