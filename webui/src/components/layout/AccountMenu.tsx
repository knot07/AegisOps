import type { LucideIcon } from 'lucide-react';

/** Legacy extension entries are rendered in the system configuration group. */
export interface AccountMenuExtraItem {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
  badge?: string;
}
