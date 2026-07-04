import React from 'react';

interface Analytics {
  total: number;
  completed: number;
  active: number;
  byDepartment: Record<string, number>;
}

interface Props {
  analytics: Analytics;
}

const DEPT_LABELS: Record<string, string> = {
  medicine: 'General Medicine', surgery: 'Surgery', og: 'O&G',
  paeds: 'Paeds', icu: 'ICU', emergency: 'Emergency', psych: 'Psych',
  ortho: 'Ortho', unknown: 'Unknown',
};

export function AnalyticsDashboard({ analytics }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Total Sessions" value={analytics.total} color="blue" />
        <Stat label="Completed" value={analytics.completed} color="green" />
        <Stat label="Active" value={analytics.active} color="yellow" />
      </div>

      {Object.keys(analytics.byDepartment).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">By Department</h3>
          <div className="space-y-3">
            {Object.entries(analytics.byDepartment)
              .sort(([, a], [, b]) => b - a)
              .map(([dept, count]) => (
                <div key={dept} className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm w-32 shrink-0">{DEPT_LABELS[dept] ?? dept}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full"
                      style={{ width: `${Math.max(4, (count / analytics.total) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-sm w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'yellow' }) {
  const colors = {
    blue: 'text-teal-700',
    green: 'text-emerald-700',
    yellow: 'text-yellow-600',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </div>
  );
}
