import React from 'react';

// ─── Shared UI components ────────────────────────────────────────────────────

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-500 mb-1">{children}</label>;
}

export function TextInput({
  value, onChange, placeholder, className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 ${className}`}
    />
  );
}

export function TextArea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
    />
  );
}

export function AiBtn({
  onClick, loading, label = 'Generate',
}: {
  onClick: () => void; loading: boolean; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : '✨'}
      {label}
    </button>
  );
}

export function DocOutput({ text, onCopy }: { text: string; onCopy: () => void }) {
  return (
    <div className="mt-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex justify-end px-3 py-1.5 border-b border-gray-200">
        <button onClick={onCopy} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
          Copy
        </button>
      </div>
      <pre className="text-xs text-gray-700 p-4 whitespace-pre-wrap leading-relaxed overflow-auto max-h-72">
        {text}
      </pre>
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
      ⚠️ {text}
    </p>
  );
}

export function SectionHead({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{children}</h3>;
}

export function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}
