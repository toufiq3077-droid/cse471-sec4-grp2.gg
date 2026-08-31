import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import UploadBox from '../components/UploadBox';
import PredictionCard from '../components/PredictionCard';
import TreatmentCard from '../components/TreatmentCard';
import LoadingAnimation from '../components/LoadingAnimation';
import { diagnoseDisease } from '../services/aiApi';

export default function DiseaseDiagnosis() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function handleFileSelect(selectedFile) {
    setErrorMessage('');
    setDiagnosis(null);
    setFile(selectedFile);
  }

  function handleClear() {
    setFile(null);
    setPreviewUrl('');
    setDiagnosis(null);
    setErrorMessage('');
  }

  function getErrorMessage(error) {
    if (!error) {
      return 'Something went wrong while analyzing the leaf image.';
    }

    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (error.response?.status === 400) {
      return error.response.data?.message || 'Please upload a valid leaf image.';
    }

    if (error.code === 'ERR_NETWORK') {
      return 'No internet connection. Please check your network and try again.';
    }

    if (error.code === 'ECONNABORTED') {
      return 'The diagnosis request timed out. Please try again.';
    }

    return error.response?.data?.message || error.message || 'Server error occurred.';
  }

  async function handleAnalyze() {
    if (!file) {
      const message = 'Please upload a leaf image first.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const response = await diagnoseDisease(file);
      const data = response?.data || response;
      setDiagnosis(data);
      toast.success('Disease diagnosis completed successfully.');
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eefbf4_100%)] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            AI Leaf Disease Diagnostics
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                Diagnose leaf disease and get an instant treatment plan.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Upload a single leaf image and Gemini will return the disease, confidence, symptoms, severity, and a complete treatment, fertilizer, and irrigation recommendation.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              JPEG, PNG, WEBP · Max 5MB
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <UploadBox
              file={file}
              previewUrl={previewUrl}
              onFileSelect={handleFileSelect}
              onClear={handleClear}
              disabled={isAnalyzing}
              error={errorMessage && !diagnosis ? errorMessage : ''}
            />

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isAnalyzing ? 'Analyzing image...' : 'Analyze leaf image'}
            </button>

            {isAnalyzing ? <LoadingAnimation /> : null}
          </div>

          <div className="space-y-6">
            {diagnosis ? (
              <>
                <PredictionCard diagnosis={diagnosis} />
                <TreatmentCard treatment={diagnosis.treatment} />
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
                <p className="text-lg font-bold text-slate-900">Diagnosis results will appear here</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  After analysis, you will see the disease name, confidence, symptoms, severity, and treatment guidance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
