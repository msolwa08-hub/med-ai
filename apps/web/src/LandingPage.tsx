export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #f0fdfa 0%, #ffffff 50%, #f0fdfa 100%)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-800">MedAI</span>
        </div>
        <span className="text-xs text-teal-600 font-medium bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
          Beta
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-12 max-w-lg">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-md"
            style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
          >
            <svg className="w-11 h-11 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3">MedAI Platform</h1>
          <p className="text-slate-500 text-base leading-relaxed">
            AI-powered clinical assistant for South African general practice.
            Structured patient histories, clinical summaries, and decision support.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">
          {/* Patient History */}
          <a
            href="/patient"
            className="group bg-white rounded-3xl border border-teal-100 shadow-sm p-6 flex flex-col hover:shadow-md hover:border-teal-200 transition-all duration-200"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-slate-800 mb-1.5">Patient History</h2>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">
              AI-assisted history-taking. Patients answer questions in natural language;
              a structured clinical summary is generated for the GP.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-700 transition">
              Open
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </a>

          {/* Doctor Cockpit */}
          <a
            href="/doctor"
            className="group bg-white rounded-3xl border border-teal-100 shadow-sm p-6 flex flex-col hover:shadow-md hover:border-teal-200 transition-all duration-200"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200"
              style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-slate-800 mb-1.5">Doctor Cockpit</h2>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">
              Review and approve AI-generated clinical summaries.
              Analytics, consultation notes, and clinical decision support.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-700 transition">
              Open
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </a>

          {/* Intern Tools */}
          <a
            href="/tools"
            className="group bg-white rounded-3xl border border-teal-100 shadow-sm p-6 flex flex-col hover:shadow-md hover:border-teal-200 transition-all duration-200"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-200"
              style={{ background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.415 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4.8 15.3" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-slate-800 mb-1.5">Intern Tools</h2>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">
              Personal AI medical aide. Literature search, drug references,
              clinical calculations, and differential diagnosis assistance.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-700 transition">
              Open
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            End-to-end encrypted
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            GP-supervised AI
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            POPIA compliant
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 px-6">
        <p className="text-xs text-slate-400">
          MedAI Beta · For authorized healthcare professionals only
        </p>
      </footer>
    </div>
  );
}
