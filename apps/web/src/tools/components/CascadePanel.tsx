import {
  serializeCascade,
  visibleBlocks,
  type CascadeBlock,
  type CascadeSelections,
  type SymptomCascade,
} from '../config/symptomCascades';
import { EscapeHatch } from './EscapeHatch';
import { WhyButton } from './WhyButton';

// ─── Cascade panel ───────────────────────────────────────────────────────────
// Renders one SymptomCascade: the presenting complaint's blocks appear one
// after another as they are answered (inline — never a wizard), each a row of
// ≥44px tap chips. Selections + custom note serialize to clinical shorthand
// and are handed up on every change.

export interface CascadePanelValue {
  selections: CascadeSelections;
  customNote: string;
}

export const EMPTY_CASCADE_VALUE: CascadePanelValue = { selections: {}, customNote: '' };

function BlockRow({ block, chosen, onSelect }: {
  block: CascadeBlock;
  chosen: string[];
  onSelect: (optionId: string) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-gray-700 mb-1.5">
        {block.question}
        {block.why && <span className="ml-1.5"><WhyButton why={block.why} /></span>}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {block.options.map(o => {
          const on = chosen.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id)}
              className={`min-h-[44px] px-3.5 rounded-2xl text-sm border transition-colors text-left ${
                on
                  ? 'bg-teal-600 border-teal-600 text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50'
              }`}
            >
              {on ? '✓ ' : ''}{o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CascadePanel({ cascade, value, isFemale, onChange }: {
  cascade: SymptomCascade;
  value: CascadePanelValue;
  isFemale: boolean;
  /** Emits the raw selections (persisted) and the serialized shorthand text. */
  onChange: (value: CascadePanelValue, serializedText: string) => void;
}) {
  const blocks = visibleBlocks(cascade, value.selections, isFemale);
  // Progressive disclosure without a wizard: show every answered block plus
  // the first unanswered one, so the cascade grows inline as it is answered.
  const firstUnanswered = blocks.findIndex(b => !(value.selections[b.id]?.length));
  const shown = firstUnanswered === -1 ? blocks : blocks.slice(0, firstUnanswered + 1);

  function emit(next: CascadePanelValue) {
    onChange(next, serializeCascade(cascade, next.selections, next.customNote));
  }

  function select(block: CascadeBlock, optionId: string) {
    const prev = value.selections[block.id] ?? [];
    let next: string[];
    if (block.kind === 'single') {
      next = prev.includes(optionId) ? [] : [optionId];
    } else {
      next = prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId];
    }
    emit({ ...value, selections: { ...value.selections, [block.id]: next } });
  }

  return (
    <div className="space-y-4">
      {shown.map(b => (
        <BlockRow
          key={b.id}
          block={b}
          chosen={value.selections[b.id] ?? []}
          onSelect={id => select(b, id)}
        />
      ))}
      {firstUnanswered !== -1 && shown.length < blocks.length && (
        <p className="text-[11px] text-gray-300">More questions follow as you answer…</p>
      )}
      <EscapeHatch
        value={value.customNote}
        onChange={v => emit({ ...value, customNote: v })}
        placeholder="Unusual features the chips didn’t capture…"
      />
    </div>
  );
}
