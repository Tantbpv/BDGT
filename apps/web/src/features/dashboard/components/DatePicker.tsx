import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';

type DatePickerProps = Omit<ComponentProps<'input'>, 'type'>;

export function DatePicker(props: DatePickerProps) {
  return <Input type="date" {...props} />;
}
