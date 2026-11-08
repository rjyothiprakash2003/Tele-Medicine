'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/consult/chat', label: 'AI Chat' },
  { href: '/consult/video', label: 'AI Video' },
  { href: '/assessment', label: 'Assessment' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-900/10 bg-ink-50/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white shadow-soft">
            T+
          </span>
          <span className="font-display text-lg tracking-tight text-ink-900 group-hover:text-brand-800">
            TELEMEDICINE AI
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm text-ink-700 transition hover:text-brand-800',
                pathname.startsWith(l.href) && 'font-semibold text-brand-800',
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/consult/chat"
            className="rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-brand-800"
          >
            Start AI Consultation
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg border border-brand-900/10 px-3 py-2 text-sm md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>
      {open && (
        <div className="border-t border-brand-900/10 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
