// ─── Pill cue ────────────────────────────────────────────────────────────────
// Visual medication-recall chip. Patients rarely know drug names but always
// know "the blue tablet" — showing the colour cue next to the question lets
// the intern ask the way the patient answers.

const DOT_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  red: 'bg-red-600',
  'red/brown': 'bg-red-800',
  brown: 'bg-amber-800',
  yellow: 'bg-yellow-400',
  white: 'bg-white border border-gray-300',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-400',
  purple: 'bg-purple-500',
  grey: 'bg-gray-400',
  gray: 'bg-gray-400',
};

export function PillCue({ color, label }: { color: string; label: string }) {
  const dot = DOT_COLORS[color.toLowerCase()] ?? 'bg-gray-300';
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5 align-middle"
      title={`Patient-recall cue: ${label}`}
    >
      <span className={`w-2.5 h-1.5 rounded-full shrink-0 ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
