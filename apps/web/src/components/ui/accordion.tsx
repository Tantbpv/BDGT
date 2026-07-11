'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Props {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Accordion({ label, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-border rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between px-3 py-2 text-sm transition-colors"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="flex flex-col gap-4 px-3 pb-3">{children}</div>}
    </div>
  );
}
