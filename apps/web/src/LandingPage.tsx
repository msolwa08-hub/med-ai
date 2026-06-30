import React from 'react';

interface Props {
  onNavigate: (route: 'chat' | 'doctor' | 'tools') => void;
}

export default function LandingPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/medai-icon.svg" alt="MedAI" className="w-14 h-14" />
          <h1 className="text-4xl font-bold text-white tracking-tight">MedAI</h1>
        </div>
        <p className="text-blue-300 text-lg">AI-powered clinical tools for South African healthcare</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Card
          icon="💬"
          title="Patient Chat"
          description="AI-guided medical history taking for patients. Share your link before your appointment."
          color="blue"
          onClick={() => onNavigate('chat')}
        />
        <Card
          icon="🩺"
          title="Doctor Cockpit"
          description="View completed patient histories, analytics, and consult workspace."
          color="emerald"
          onClick={() => onNavigate('doctor')}
        />
        <Card
          icon="🏥"
          title="Intern Tools"
          description="Ward round tools, clinical calculators, AI documents, and department-specific workflows."
          color="violet"
          onClick={() => onNavigate('tools')}
        />
      </div>

      <p className="mt-12 text-slate-500 text-sm text-center max-w-md">
        For healthcare professionals. All AI-generated content requires clinical verification.
      </p>
    </div>
  );
}

function Card({
  icon, title, description, color, onClick,
}: {
  icon: string;
  title: string;
  description: string;
  color: 'blue' | 'emerald' | 'violet';
  onClick: () => void;
}) {
  const colors = {
    blue: 'bg-blue-900/40 border-blue-700/50 hover:border-blue-500 hover:bg-blue-900/60',
    emerald: 'bg-emerald-900/40 border-emerald-700/50 hover:border-emerald-500 hover:bg-emerald-900/60',
    violet: 'bg-violet-900/40 border-violet-700/50 hover:border-violet-500 hover:bg-violet-900/60',
  };
  return (
    <button
      onClick={onClick}
      className={`${colors[color]} border rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer group`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-white text-xl font-semibold mb-2">{title}</h2>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      <div className="mt-4 text-slate-500 text-sm group-hover:text-slate-300 transition-colors">
        Open →
      </div>
    </button>
  );
}
