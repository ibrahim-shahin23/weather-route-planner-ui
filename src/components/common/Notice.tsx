import type { ReactNode } from 'react';

export function Notice({ tone, children }: { tone: 'error' | 'warn' | 'info'; children: ReactNode }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
