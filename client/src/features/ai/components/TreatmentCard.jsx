function TreatmentItem({ title, value, accentClassName }) {
  return (
    <div className={`rounded-2xl border p-4 ${accentClassName}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-700 md:text-base">{value}</p>
    </div>
  );
}

export default function TreatmentCard({ treatment }) {
  if (!treatment) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-6 border-b border-slate-100 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
          Treatment Plan
        </p>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          Automated treatment and fertilizer recommendation
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TreatmentItem
          title="Organic Solution"
          value={treatment.organic}
          accentClassName="border-emerald-100 bg-emerald-50"
        />
        <TreatmentItem
          title="Chemical Solution"
          value={treatment.chemical}
          accentClassName="border-amber-100 bg-amber-50"
        />
        <TreatmentItem
          title="Recommended Fertilizer"
          value={treatment.fertilizer}
          accentClassName="border-sky-100 bg-sky-50"
        />
        <TreatmentItem
          title="Prevention Tips"
          value={treatment.prevention}
          accentClassName="border-violet-100 bg-violet-50"
        />
        <TreatmentItem
          title="Irrigation Advice"
          value={treatment.irrigation}
          accentClassName="border-cyan-100 bg-cyan-50"
        />
        <TreatmentItem
          title="Harvest Safety Notes"
          value={treatment.harvestSafety}
          accentClassName="border-rose-100 bg-rose-50"
        />
      </div>
    </section>
  );
}
