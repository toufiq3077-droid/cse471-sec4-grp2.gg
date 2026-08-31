export default function LoadingAnimation() {
  return (
    <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200 opacity-75" />
          <div className="absolute inset-2 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">Analyzing leaf image</p>
          <p className="mt-1 text-sm text-slate-500">
            Gemini is inspecting the leaf and preparing the disease diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
