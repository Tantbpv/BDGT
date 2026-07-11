'use client';

import { endOfMonth, startOfMonth, toISODateString } from '@repo/utils/date';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { DatePicker } from './DatePicker';

interface DateRange {
  from: string;
  to: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type Preset = 'day' | 'week' | 'month' | 'ytd' | 'custom';

function getPresetRange(preset: Exclude<Preset, 'custom'>): DateRange {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  if (preset === 'day') {
    return {
      from: new Date(y, m, d, 0, 0, 0, 0).toISOString(),
      to: new Date(y, m, d, 23, 59, 59, 999).toISOString(),
    };
  }

  if (preset === 'week') {
    const dayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(y, m, d - dayOfWeek, 0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { from: monday.toISOString(), to: sunday.toISOString() };
  }

  if (preset === 'ytd') {
    return {
      from: new Date(y, 0, 1, 0, 0, 0, 0).toISOString(),
      to: new Date(y, m, d, 23, 59, 59, 999).toISOString(),
    };
  }

  return {
    from: startOfMonth().toISOString(),
    to: endOfMonth().toISOString(),
  };
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'ytd', label: 'YTD' },
  { id: 'custom', label: 'Custom' },
];

export function DateRangeFilter({ onChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<Preset>('month');
  const [customDates, setCustomDates] = useState({ from: '', to: '' });

  function handlePreset(preset: Preset) {
    setActivePreset(preset);
    if (preset !== 'custom') {
      onChange(getPresetRange(preset));
    }
  }

  function handleCustomChange(field: 'from' | 'to', dateStr: string) {
    const updated = { ...customDates, [field]: dateStr };
    setCustomDates(updated);
    if (updated.from && updated.to) {
      onChange({
        from: new Date(updated.from).toISOString(),
        to: new Date(`${updated.to}T23:59:59.999`).toISOString(),
      });
    }
  }

  const today = toISODateString(new Date());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            variant={activePreset === p.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePreset(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {activePreset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            aria-label="From"
            value={customDates.from}
            max={customDates.to || today}
            onChange={(e) => handleCustomChange('from', e.target.value)}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <DatePicker
            aria-label="To"
            value={customDates.to}
            min={customDates.from || undefined}
            max={today}
            onChange={(e) => handleCustomChange('to', e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
