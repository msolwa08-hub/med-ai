import React from 'react';
import { Sparkles, Loader2, Copy as CopyIcon, Check, AlertTriangle, type LucideIcon } from 'lucide-react';

// ─── Calm Clinical primitives ────────────────────────────────────────────────
// One Button, one Card, one Field system, one Spinner — all on the design
// tokens (surface / line / ink / brand). Legacy exports keep their signatures so
// the restyle is drop-in; new primitives (Button, Card, Spinner) are preferred
// going forward.

export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-white shadow-card',
  secondary: 'bg-surface border border-line-strong text-ink hover:bg-surface-alt',
  ghost: 'text-ink-soft hover:bg-surface-alt hover:text-ink',
  danger: 'bg-danger hover:bg-danger/90 text-white shadow-card',
};
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-[38px] px-3 text-sm gap-1.5 rounded-lg',
  md: 'min-h-[44px] px-4 text-sm gap-2 rounded-md',
};

export function Button({
  children, onClick, variant = 'primary', size = 'md', loading, disabled, icon: Icon, className = '', type = 'button',
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-45 disabled:pointer-events-none focus:outline-none focus-visible:shadow-focus ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
    >
      {loading ? <Spinner className="w-4 h-4" /> : Icon ? <Icon className="w-4 h-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

// Elevation is carried by LIGHT (tinted layered shadows), not by hard borders.
// 'e1' resting card · 'e2' raised/interactive · 'hero' the diagnosis moment ·
// 'flat' inset panels with no lift.
type CardElevation = 'flat' | 'e1' | 'e2' | 'hero';
const CARD_ELEV: Record<CardElevation, string> = {
  flat: 'shadow-none',
  e1: 'shadow-card',
  e2: 'shadow-card-hover',
  hero: 'shadow-elevated',
};
export function Card({
  children, className = '', as: Tag = 'div', elevation = 'e1',
}: { children: React.ReactNode; className?: string; as?: 'div' | 'section'; elevation?: CardElevation }) {
  return <Tag className={`rounded-card border border-line bg-surface ${CARD_ELEV[elevation]} ${className}`}>{children}</Tag>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-ink-soft mb-1.5">{children}</label>;
}

const FIELD = 'w-full bg-surface border border-line-strong rounded-md px-3.5 py-2.5 text-base text-ink placeholder:text-ink-mute transition-shadow focus:outline-none focus:border-brand-500 focus:shadow-focus';

export function TextInput({
  value, onChange, placeholder, className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${FIELD} ${className}`} />
  );
}

export function TextArea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${FIELD} resize-none`} />
  );
}

// Legacy primary CTA — now a Button(primary) with the sparkle mark.
export function AiBtn({
  onClick, loading, label = 'Generate',
}: {
  onClick: () => void; loading: boolean; label?: string;
}) {
  return (
    <Button onClick={onClick} loading={loading} icon={Sparkles}>
      {label}
    </Button>
  );
}

// The AI is instructed to emit plain text, but a stray **bold** or - bullet
// still occasionally slips through — and these notes get copied by hand onto a
// paper chart, where a literal asterisk is noise the clerk must delete. Strip
// markdown as a client-side backstop so what's shown IS what's written down.
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1$2')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\*\s*$/gm, '')
    .replace(/[ \t]+$/gm, '')
    .trimEnd();
}

export function DocOutput({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const clean = stripMarkdown(text);
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="mt-3 bg-surface-alt rounded-xl border border-line overflow-hidden">
      <div className="flex justify-end px-3 py-1.5 border-b border-line">
        <button
          onClick={() => { copy(clean); setCopied(true); setTimeout(() => setCopied(false), 1400); onCopy?.(); }}
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-band-confirmed" /> : <CopyIcon className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="text-sm text-ink p-4 whitespace-pre-wrap leading-relaxed overflow-auto max-h-[28rem] font-mono">
        {clean}
      </pre>
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs text-warn bg-warn/[0.08] border border-warn/20 rounded-lg px-3 py-2">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span>{text}</span>
    </p>
  );
}

export function SectionHead({ children }: { children: React.ReactNode }) {
  return <h3 className="text-2xs font-semibold text-ink-mute uppercase tracking-[0.08em] mb-3">{children}</h3>;
}

export function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}
