import React from 'react';
import { localDate, validDate } from './model';

export default function WebDateInput({ value, onChange, foreground, background, border, dark }: { value: Date; onChange: (date: Date) => void; foreground: string; background: string; border: string; dark: boolean }) {
  return <input type="date" aria-label="Velg innleveringsfrist" value={localDate(value)} onChange={event => {
    if (validDate(event.target.value)) onChange(new Date(event.target.value + 'T12:00:00'));
  }} style={{ padding: 14, minHeight: 50, boxSizing: 'border-box', width: '100%', fontSize: 16, color: foreground, background, border: `1px solid ${border}`, borderRadius: 10, colorScheme: dark ? 'dark' : 'light' }} />;
}
