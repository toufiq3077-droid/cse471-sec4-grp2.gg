import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import HistoryTable from '../components/HistoryTable';
import TreatmentCard from '../components/TreatmentCard';
import LoadingAnimation from '../components/LoadingAnimation';
import { fetchDiagnosisHistory } from '../services/aiApi';

function DetailPanel({ record, onClose }) {
  if (!record) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
            Diagnosis Details
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            {record.diseaseName}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {record.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
        >
          Close
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {record.imageUrl ? (
            <img src={record.imageUrl} alt={record.diseaseName} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Confidence
              </p>
              <p className="mt-3 text-2xl font-black text-slate-900">{record.confidence}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Severity
              </p>
              <p className="mt-3 text-base font-semibold text-slate-900">{record.severity}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Symptoms
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">{record.symptoms}</p>
          </div>
          <TreatmentCard
            treatment={{
              organic: record.organicTreatment,
              chemical: record.chemicalTreatment,
              fertilizer: record.fertilizer,
              prevention: record.prevention,
              irrigation: record.irrigationAdvice,
              harvestSafety: record.harvestSafety,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DiagnosisHistory() {
  const [history, setHistory] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetchDiagnosisHistory();
        const records = response?.data || response;

        if (isMounted) {
          setHistory(Array.isArray(records) ? records : []);
          setErrorMessage('');
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to load diagnosis history.';

        if (isMounted) {
          setErrorMessage(message);
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eefbf4_100%)] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Diagnosis History
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Review previous AI disease scans.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Track leaf diagnoses, confidence scores, and treatment recommendations for the current farmer account.
          </p>
        </header>

        {isLoading ? (
          <LoadingAnimation />
        ) : errorMessage && !history.length ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
            <p className="text-lg font-bold">Unable to load history</p>
            <p className="mt-2 text-sm">{errorMessage}</p>
          </div>
        ) : (
          <HistoryTable records={history} onViewDetails={setSelectedRecord} />
        )}

        {selectedRecord ? <DetailPanel record={selectedRecord} onClose={() => setSelectedRecord(null)} /> : null}
      </div>
    </div>
  );
}
