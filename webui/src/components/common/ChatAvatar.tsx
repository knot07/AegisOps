import { UserRound } from 'lucide-react';

/** Shared across chat messages, streaming indicators and embedded assistants. */
export default function ChatAvatar({ user = false, compact = false, className = '' }: {
  user?: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (!user) return <span data-chat-avatar="assistant" aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center ${compact ? 'h-7 w-7' : 'h-8 w-8'} ${className}`}>
    <img src="/favicon.svg" alt="" className="h-full w-full object-contain" />
  </span>;
  return (
    <span
      data-chat-avatar={user ? 'user' : 'assistant'}
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border shadow-sm ${compact ? 'h-7 w-7' : 'h-8 w-8'} ${
        user
          ? 'border-[#dce5d4] bg-[#edf3e6] text-[#60724e] dark:border-[#4a5741] dark:bg-[#313d2b] dark:text-[#bed2aa]'
          : 'border-[#3d5949] bg-[#294e40] text-[#b4ec77] dark:border-[#607a52] dark:bg-[#33482d]'
      } ${className}`}
    >
      {user ? <UserRound className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={1.6} /> : (
        <svg viewBox="0 0 24 24" fill="none" className={compact ? 'h-4 w-4' : 'h-5 w-5'}>
          <path d="M5 18.5 11.1 5.8a1 1 0 0 1 1.8 0L19 18.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.2 14h7.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="19" cy="5" r="1.5" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}
