import { MessageSquareText, Stethoscope } from 'lucide-react';
import type { DiscriminatingFeature } from '../toolsApi';
import { SectionHead } from './ui';

// ─── CONFIRM STREAM — the tap stream ─────────────────────────────────────────
// LOWEST-LEVEL INPUT → HIGHEST-LEVEL OUTPUT: once the leading diagnosis has
// appeared, this is how the intern moves it — a dense, calm list of closed
// history + exam questions (pre-sorted, most-discriminating first), each a
// one-tap Yes/No or MCQ. No typing required; typing is the accelerator, this
// is the default.

/** Stable, dependency-free hash of a feature prompt — the key into
 *  Patient.featureAnswers and the upsertSerialized per-feature key, so
 *  re-answering a tap replaces the same line in the record instead of
 *  duplicating it. */
export function hashFeature(prompt: string): string {
  let h = 0;
  for (let i = 0; i < prompt.length; i++) {
    h = (Math.imul(31, h) + prompt.charCodeAt(i)) | 0;
  }
  return `f${(h >>> 0).toString(36)}`;
}

function FeatureRow({ feature, answer, onAnswer }: {
  feature: DiscriminatingFeature;
  answer?: string;
  onAnswer: (value: string) => void;
}) {
  const Icon = feature.kind === 'exam' ? Stethoscope : MessageSquareText;
  const choices: { label: string; value: string }[] =
    feature.options && feature.options.length > 0
      ? feature.options.map(o => ({ label: o, value: o }))
      : [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }];

  return (
    <div className="flex flex-col gap-2 py-3.5 first:pt-1 last:pb-1">
      <div className="flex items-center gap-1.5 text-xs text-ink-soft">
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="uppercase tracking-wide font-medium">{feature.kind}</span>
        {feature.priority === 'now' && <span className="text-danger font-semibold">· now</span>}
      </div>
      <p className="text-[15px] text-ink font-medium leading-snug">{feature.prompt}</p>
      <div className="flex flex-wrap gap-1.5">
        {choices.map(choice => {
          const selected = answer === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onAnswer(choice.value)}
              aria-pressed={selected}
              className={`min-h-[44px] px-4 rounded-pill text-sm font-medium border transition-colors focus:outline-none focus-visible:shadow-focus ${
                selected
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-surface border-line text-ink-soft hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ConfirmStream({ features, answers, onAnswer }: {
  features: DiscriminatingFeature[];
  /** hashFeature(prompt) → 'yes' | 'no' | chosen MCQ option. */
  answers: Record<string, string>;
  onAnswer: (feature: DiscriminatingFeature, value: string) => void;
}) {
  if (features.length === 0) return null;

  return (
    <div className="rounded-card border border-line bg-surface shadow-card p-4 sm:p-5">
      <SectionHead>Confirm the diagnosis — tap what you find</SectionHead>
      <div className="divide-y divide-line">
        {features.map((f, i) => (
          <FeatureRow
            key={`${hashFeature(f.prompt)}-${i}`}
            feature={f}
            answer={answers[hashFeature(f.prompt)]}
            onAnswer={value => onAnswer(f, value)}
          />
        ))}
      </div>
    </div>
  );
}
