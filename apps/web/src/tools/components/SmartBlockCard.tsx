import {
  fieldVisible,
  serializeSmartBlock,
  type SmartBlock,
  type SmartBlockState,
  type SmartField,
} from '../config/smartBlocks';
import { EscapeHatch } from './EscapeHatch';
import { PillCue } from './PillCue';
import { WhyButton } from './WhyButton';

// ─── Smart block card ────────────────────────────────────────────────────────
// One condition-triggered smart block: STG-aligned structured fields with
// showIf logic and medication-recall cues. Every change hands up both the raw
// state (persisted per patient) and the serialized shorthand text that lands
// in the record's string fields.

export interface SmartBlockValue {
  state: SmartBlockState;
  customNote: string;
}

export const EMPTY_SMART_BLOCK_VALUE: SmartBlockValue = { state: {}, customNote: '' };

const inputCls =
  'bg-surface border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[44px]';

function FieldRow({ field, state, onSet }: {
  field: SmartField;
  state: SmartBlockState;
  onSet: (id: string, v: string | boolean) => void;
}) {
  const v = state[field.id];

  if (field.kind === 'toggle') {
    const on = v === true;
    const off = v === false;
    return (
      <div className="flex items-center justify-between gap-3 min-h-[44px]">
        <span className="text-sm text-ink-soft">
          {field.label}
          {field.cue && <span className="ml-1.5"><PillCue color={field.cue.color} label={field.cue.label} /></span>}
        </span>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onSet(field.id, on ? '' : true)}
            className={`min-h-[44px] px-4 rounded-l-xl text-sm border transition-colors ${
              on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface border-line text-ink-mute hover:bg-brand-50'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => onSet(field.id, off ? '' : false)}
            className={`min-h-[44px] px-4 rounded-r-xl text-sm border transition-colors ${
              off ? 'bg-gray-700 border-gray-700 text-white' : 'bg-surface border-line text-ink-mute hover:bg-surface-alt'
            }`}
          >
            No
          </button>
        </div>
      </div>
    );
  }

  if (field.kind === 'select') {
    return (
      <div>
        <p className="text-[13px] text-ink-soft mb-1.5">
          {field.label}
          {field.cue && <span className="ml-1.5"><PillCue color={field.cue.color} label={field.cue.label} /></span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(field.options ?? []).map(o => {
            const on = v === o;
            return (
              <button
                key={o}
                type="button"
                onClick={() => onSet(field.id, on ? '' : o)}
                className={`min-h-[44px] px-3.5 rounded-2xl text-sm border transition-colors ${
                  on
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-surface border-line text-ink-soft hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {on ? '✓ ' : ''}{o}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // number / date / text-short
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-ink-soft flex-1">
        {field.label}
        {field.cue && <span className="ml-1.5"><PillCue color={field.cue.color} label={field.cue.label} /></span>}
      </label>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'}
          inputMode={field.kind === 'number' ? 'decimal' : undefined}
          value={typeof v === 'string' ? v : ''}
          onChange={e => onSet(field.id, e.target.value)}
          className={`${inputCls} ${field.kind === 'number' ? 'w-24 text-right' : field.kind === 'date' ? 'w-40' : 'w-44'}`}
        />
        {field.unit && <span className="text-xs text-ink-mute">{field.unit}</span>}
      </div>
    </div>
  );
}

export function SmartBlockCard({ block, value, onChange }: {
  block: SmartBlock;
  value: SmartBlockValue;
  /** Emits raw state (persisted) + serialized shorthand for the record text. */
  onChange: (value: SmartBlockValue, serializedText: string) => void;
}) {
  function emit(next: SmartBlockValue) {
    onChange(next, serializeSmartBlock(block, next.state, next.customNote));
  }

  function set(id: string, v: string | boolean) {
    const state = { ...value.state };
    if (v === '') delete state[id];
    else state[id] = v;
    emit({ ...value, state });
  }

  return (
    <div className="bg-surface border border-brand-100 rounded-2xl p-5 space-y-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-brand-800">{block.title}</h4>
        <WhyButton why={block.why} />
      </div>
      {block.fields.filter(f => fieldVisible(f, value.state)).map(f => (
        <FieldRow key={f.id} field={f} state={value.state} onSet={set} />
      ))}
      <EscapeHatch
        value={value.customNote}
        onChange={v => emit({ ...value, customNote: v })}
        placeholder={`Anything else about ${block.title.toLowerCase()}…`}
      />
    </div>
  );
}
