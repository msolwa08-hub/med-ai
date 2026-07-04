import React from 'react';

interface Props {
  onNavigate: (route: 'chat' | 'doctor' | 'tools') => void;
}

export default function LandingPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex flex-col items-center justify-center p-6">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/medai-icon.svg" alt="MedAI" className="w-14 h-14" />
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">MedAI</h1>
        </div>
        <p className="text-teal-700 text-lg">AI-powered clinical tools for South African healthcare</p>
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

      <p className="mt-12 text-gray-400 text-sm text-center max-w-md">
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
    blue: 'bg-white border-teal-200 hover:border-teal-400 hover:bg-teal-50/60 shadow-sm',
    emerald: 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/60 shadow-sm',
    violet: 'bg-white border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50/60 shadow-sm',
  };
  return (
    <button
      onClick={onClick}
      className={`${colors[color]} border rounded-2xl p-6 text-left transition-all duration-200 cursor-pointer group`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-gray-900 text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      <div className="mt-4 text-gray-400 text-sm group-hover:text-gray-600 transition-colors">
        Open →
      </div>
    </button>
  );
}
