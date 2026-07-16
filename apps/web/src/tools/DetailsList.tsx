import { useEffect, useRef, useState } from 'react';
import type { AssistField } from './toolsApi';
import { Card } from './components/ui';

// Apple-Settings-style details list: one clean row per field — small label,
// big value, tap anywhere on the row to edit in place. Replaces the wall of
// always-visible form inputs.
export function DetailsList({ fields, onEdit }: {
  fields: AssistField[];
  onEdit: (key: string, value: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Card elevation="e1" className="divide-y divide-line overflow-hidden">
      {fields.map(f => (
        <Row
          key={f.key}
          field={f}
          editing={editing === f.key}
          onStart={() => setEditing(f.key)}
          onDone={() => setEditing(null)}
          onEdit={v => onEdit(f.key, v)}
        />
      ))}
    </Card>
  );
}

function Row({ field, editing, onStart, onDone, onEdit }: {
  field: AssistField;
  editing: boolean;
  onStart: () => void;
  onDone: () => void;
  onEdit: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(field.value);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Glow softly when the value changes from outside the row (AI fill / scan),
  // but not while the intern is typing in it.
  useEffect(() => {
    if (field.value !== prevValue.current) {
      prevValue.current = field.value;
      if (!editing && field.value) {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 1700);
        return () => clearTimeout(t);
      }
    }
  }, [field.value, editing]);

  const kind = field.kind ?? 'text';

  return (
    <div
      role={editing ? undefined : 'button'}
      tabIndex={editing ? -1 : 0}
      className={`px-5 py-3.5 flex gap-4 cursor-pointer transition-colors ${editing ? 'bg-brand-50/40' : 'hover:bg-surface-alt/70 focus-visible:bg-surface-alt/70 focus-visible:shadow-focus'} ${kind === 'textarea' ? 'items-start' : 'items-center'} ${flash ? 'animate-field-fill' : ''}`}
      onClick={() => { if (!editing) onStart(); }}
      onKeyDown={e => { if (!editing && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onStart(); } }}
    >
      <div className={`w-36 sm:w-44 shrink-0 text-sm text-ink-mute ${kind === 'textarea' ? 'pt-1' : ''}`}>
        {field.label}
      </div>

      {editing ? (
        kind === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={field.value}
            onChange={e => { onEdit(e.target.value); onDone(); }}
            onBlur={onDone}
            className="flex-1 bg-transparent text-base text-ink focus:outline-none"
          >
            <option value="">—</option>
            {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : kind === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={field.value}
            rows={3}
            onChange={e => onEdit(e.target.value)}
            onBlur={onDone}
            onKeyDown={e => { if (e.key === 'Escape') onDone(); }}
            placeholder={field.placeholder}
            className="flex-1 bg-transparent text-base text-ink placeholder:text-ink-mute leading-relaxed focus:outline-none resize-none"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={field.value}
            onChange={e => onEdit(e.target.value)}
            onBlur={onDone}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onDone(); }}
            placeholder={field.placeholder}
            className="flex-1 bg-transparent text-base text-ink placeholder:text-ink-mute focus:outline-none"
          />
        )
      ) : (
        <div className={`flex-1 text-base leading-relaxed whitespace-pre-wrap ${field.value ? 'text-ink' : 'text-ink-mute'}`}>
          {field.value || (field.placeholder ?? 'Tap to add')}
        </div>
      )}
    </div>
  );
}
