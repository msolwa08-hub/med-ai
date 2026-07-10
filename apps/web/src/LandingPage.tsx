import { MessageCircle, Stethoscope, ClipboardList, ArrowRight, type LucideIcon } from 'lucide-react';

interface Props {
  onNavigate: (route: 'chat' | 'doctor' | 'tools') => void;
}

export default function LandingPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
      {/* A soft brand wash behind the hero — depth without decoration. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[42vh] bg-gradient-to-b from-surface-brand to-transparent"
      />

      <div className="relative mb-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/medai-icon.svg" alt="" className="w-14 h-14" />
          <h1 className="text-4xl font-bold text-ink tracking-tight">MedAI</h1>
        </div>
        <p className="text-ink-soft text-lg">AI-powered clinical tools for South African healthcare</p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        <NavCard
          icon={MessageCircle}
          title="Patient Chat"
          description="AI-guided medical history taking for patients. Share your link before your appointment."
          onClick={() => onNavigate('chat')}
        />
        <NavCard
          icon={Stethoscope}
          title="Doctor Cockpit"
          description="View completed patient histories, analytics, and consult workspace."
          onClick={() => onNavigate('doctor')}
        />
        <NavCard
          icon={ClipboardList}
          title="Intern Tools"
          description="Ward round tools, clinical calculators, AI documents, and department-specific workflows."
          featured
          onClick={() => onNavigate('tools')}
        />
      </div>

      <p className="relative mt-12 text-ink-mute text-sm text-center max-w-md">
        For healthcare professionals. All AI-generated content requires clinical verification.
      </p>
    </div>
  );
}

function NavCard({
  icon: Icon, title, description, featured, onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  featured?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-card border bg-surface p-6 transition-all duration-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 focus:outline-none focus-visible:shadow-focus ${
        featured ? 'border-brand-200 hover:border-brand-300' : 'border-line hover:border-line-strong'
      }`}
    >
      <div
        className={`mb-4 grid place-items-center w-12 h-12 rounded-xl transition-colors ${
          featured ? 'bg-brand-600 text-white' : 'bg-surface-alt text-ink-soft group-hover:text-brand-700'
        }`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-ink text-xl font-semibold mb-2 tracking-tight">{title}</h2>
      <p className="text-ink-soft text-sm leading-relaxed">{description}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink-mute group-hover:text-brand-700 transition-colors">
        Open <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}
