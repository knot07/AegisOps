import { useOptionalAuth } from '@/contexts/authState';
import { IdentityAvatar } from './UtilityGlyph';

/** Shared across chat messages, streaming indicators and embedded assistants. */
export default function ChatAvatar({ user = false, compact = false, className = '' }: {
  user?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const auth = useOptionalAuth();
  return (
    <span
      data-chat-avatar={user ? 'user' : 'assistant'}
      aria-hidden="true"
      className={`aegis-chat-avatar inline-flex shrink-0 items-center justify-center ${compact ? 'h-7 w-7' : 'h-8 w-8'} ${className}`}
    >
      {user ? <IdentityAvatar admin={auth?.user?.role === 'admin'} /> : (
        <img src="/favicon.svg" alt="" className="h-full w-full object-contain" />
      )}
    </span>
  );
}
