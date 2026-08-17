function severityTone(severity) {
  const label = String(severity || '').toLowerCase();

  if (label.includes('high') || label.includes('critical') || label.includes('severe')) {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }

  if (label.includes('medium') || label.includes('moderate')) {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }

  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

export default function PredictionCard({ diagnosis }) {
  if (!diagnosis) {
    return null;
  }

  const severityClassName = severityTone(diagnosis.severity);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
            Diagnosis Result
          </p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {diagnosis.diseaseName || 'Unknown disease'}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            {diagnosis.description}
          </p>
        </div>
        <div className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${severityClassName}`}>
          {diagnosis.severity || 'Unknown severity'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Confidence
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {diagnosis.confidence}
            <span className="text-base font-bold text-slate-500">%</span>
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Symptoms
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700 md:text-base">
            {diagnosis.symptoms}
          </p>
        </div>
      </div>
    </section>
  );
}
