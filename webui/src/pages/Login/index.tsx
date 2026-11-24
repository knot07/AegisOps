import { useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { LoaderCircle, LockKeyhole, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import PasswordInput from '@/components/common/PasswordInput';
import AuthLayout from '@/components/layout/AuthLayout';
import { useProductName } from '@/contexts/ProductNameContext';

const tiltQuery = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { login } = useAuth();
  const { productName } = useProductName();
  const card = useRef<HTMLFormElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetTilt = () => ['x','y','rx','ry'].forEach(key => card.current?.style.removeProperty(`--login-${key}`));
  const tilt = (event: PointerEvent<HTMLElement>) => {
    const form = card.current;
    if (!form || event.pointerType !== 'mouse' || !window.matchMedia(tiltQuery).matches || submitting) return;
    const rect = form.getBoundingClientRect();
    const x = Math.max(0,Math.min(1,(event.clientX - rect.left) / rect.width));
    const y = Math.max(0,Math.min(1,(event.clientY - rect.top) / rect.height));
    form.style.setProperty('--login-x', `${x * 100}%`);
    form.style.setProperty('--login-y', `${y * 100}%`);
    form.style.setProperty('--login-rx', `${(0.5 - y) * 6}deg`);
    form.style.setProperty('--login-ry', `${(x - 0.5) * 8}deg`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || success) return;
    setSubmitting(true);
    setError(null);
    resetTilt();
    try {
      await login(username, password, async () => {
        if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        setSuccess(true);
        await new Promise<void>(resolve => window.setTimeout(resolve, 620));
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || err?.message || t('login.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout loginMotion loginSuccess={success} onLoginPointerMove={tilt} onLoginPointerLeave={resetTilt}>
      <form ref={card} onSubmit={onSubmit} className="login-motion-card" aria-labelledby="login-heading">
        <div className="login-motion-header">
          <h1 id="login-heading">{t('login.welcome')}</h1>
          <p>{t('login.description', { productName })}</p>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="login-username">{t('fields.username')}</label>
          <div className="login-field"><UserRound className="login-field-icon" size={15} aria-hidden="true" />
            <input id="login-username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="px-3 py-2" placeholder={t('fields.usernamePlaceholder')} autoComplete="username" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="login-password">{t('fields.password')}</label>
          <div className="login-field"><LockKeyhole className="login-field-icon" size={15} aria-hidden="true" />
            <PasswordInput id="login-password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={t('fields.passwordPlaceholder')} autoComplete="current-password" required />
          </div>
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200">{error}</div>}
        {success ? <div className="login-result" role="status" aria-label={t('login.success')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" pathLength="1" /><path d="m7 12 3 3 7-7" pathLength="1" /></svg>
        </div> : <button type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle size={17} className="login-motion-spinner" aria-hidden="true" /> : <LockKeyhole size={16} aria-hidden="true" />}
          {submitting ? t('actions.loggingIn') : t('actions.login')}
        </button>}
      </form>
    </AuthLayout>
  );
}
