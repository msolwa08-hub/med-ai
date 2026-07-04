import { useEffect, useRef, useState } from 'react';
import type { AssistField } from './toolsApi';

// Apple-Settings-style details list: one clean row per field — small label,
// big value, tap anywhere on the row to edit in place. Replaces the wall of
// always-visible form inputs.
export function DetailsList({ fields, onEdit }: {
  fields: AssistField[];
  onEdit: (key: string, value: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
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
    </div>
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

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const kind = field.kind ?? 'text';

  return (
    <div
      className={`px-5 py-3.5 flex gap-4 cursor-pointer transition-colors ${editing ? 'bg-teal-50/40' : 'hover:bg-gray-50/70'} ${kind === 'textarea' ? 'items-start' : 'items-center'}`}
      onClick={() => { if (!editing) onStart(); }}
    >
      <div className={`w-36 sm:w-44 shrink-0 text-[13px] text-gray-500 ${kind === 'textarea' ? 'pt-1' : ''}`}>
        {field.label}
      </div>

      {editing ? (
        kind === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={field.value}
            onChange={e => { onEdit(e.target.value); onDone(); }}
            onBlur={onDone}
            className="flex-1 bg-transparent text-[15px] text-gray-900 focus:outline-none"
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
            className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder-gray-300 leading-relaxed focus:outline-none resize-none"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={field.value}
            onChange={e => onEdit(e.target.value)}
            onBlur={onDone}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onDone(); }}
            placeholder={field.placeholder}
            className="flex-1 bg-transparent text-[15px] text-gray-900 placeholder-gray-300 focus:outline-none"
          />
        )
      ) : (
        <div className={`flex-1 text-[15px] leading-relaxed whitespace-pre-wrap ${field.value ? 'text-gray-900' : 'text-gray-300'}`}>
          {field.value || (field.placeholder ?? 'Tap to add')}
        </div>
      )}
    </div>
  );
}
