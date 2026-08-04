function formatDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function HistoryTable({ records = [], onViewDetails }) {
  if (!records.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
        <p className="text-lg font-bold text-slate-900">No diagnosis history yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Your saved leaf diagnoses will appear here after you analyze an image.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="hidden grid-cols-[88px_1.4fr_0.7fr_0.9fr_0.8fr] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 md:grid">
        <div>Image</div>
        <div>Disease</div>
        <div>Confidence</div>
        <div>Date</div>
        <div>Action</div>
      </div>

      <div className="divide-y divide-slate-100">
        {records.map((record) => (
          <div
            key={record._id}
            className="grid gap-4 px-6 py-5 md:grid-cols-[88px_1.4fr_0.7fr_0.9fr_0.8fr] md:items-center"
          >
            <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {record.imageUrl ? (
                <img
                  src={record.imageUrl}
                  alt={record.diseaseName || 'Leaf diagnosis'}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 md:text-base">
                {record.diseaseName}
              </p>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                {record.description}
              </p>
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {record.confidence}%
            </div>
            <div className="text-sm text-slate-600">{formatDate(record.createdAt)}</div>
            <div>
              <button
                type="button"
                onClick={() => onViewDetails?.(record)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
