import wardFragment from './ward.html?raw';

// The inpatient tool is a self-contained early-warning-score + ward-round
// instrument. Like the clerk it is mounted as an isolated document so it carries
// its own theming and no dependencies on the app shell. Patients can be
// "transmitted" from the clerk via a localStorage handoff, or started here.
const srcDoc =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<style>html,body{margin:0;background:transparent}</style></head><body>' +
  wardFragment +
  '</body></html>';

export default function WardApp({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0e1718' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          borderBottom: '1px solid rgba(148,163,163,0.18)',
          background: '#0e1718',
          color: '#e9f0ef',
          flex: 'none',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#5eead4',
            background: 'rgba(45,212,191,0.12)',
            border: '1px solid rgba(45,212,191,0.25)',
            borderRadius: 8,
            padding: '5px 11px',
            cursor: 'pointer',
          }}
        >
          ← MedAI
        </button>
        <span style={{ fontSize: 12, letterSpacing: '0.02em', color: '#8ba3a3' }}>
          Inpatient · ward · beta
        </span>
      </div>
      <iframe
        title="MedAI inpatient ward"
        srcDoc={srcDoc}
        style={{ flex: 1, width: '100%', border: 0, display: 'block' }}
      />
    </div>
  );
}
