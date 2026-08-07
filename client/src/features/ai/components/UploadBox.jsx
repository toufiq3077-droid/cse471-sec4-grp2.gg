import { useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateFile(file) {
  if (!file) {
    return 'Please choose an image file.';
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and WEBP images are supported.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'Image size must be 5MB or smaller.';
  }

  return '';
}

export default function UploadBox({
  file,
  previewUrl,
  onFileSelect,
  onClear,
  disabled = false,
  error = '',
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const activeError = error || localError;

  function openFilePicker() {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }

  function handleSelectedFile(selectedFile) {
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError('');
    onFileSelect(selectedFile);
  }

  function handleInputChange(event) {
    const selectedFile = event.target.files?.[0];
    handleSelectedFile(selectedFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const droppedFile = event.dataTransfer.files?.[0];
    handleSelectedFile(droppedFile);
  }

  return (
    <div
      onClick={openFilePicker}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 md:p-10 ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-100/80'
          : isDragging
            ? 'border-emerald-500 bg-emerald-50 shadow-[0_18px_50px_rgba(16,185,129,0.15)]'
            : 'border-slate-300 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] hover:border-emerald-400 hover:bg-emerald-50/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {previewUrl ? (
        <div className="flex w-full max-w-xl flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <img
              src={previewUrl}
              alt="Leaf preview"
              className="h-72 w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">
                {file?.name || 'Selected image'}
              </p>
              <p className="text-sm text-slate-500">Drop a different image to replace it.</p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
              disabled={disabled}
            >
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <div className="flex max-w-xl flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-700">
            ⬆
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Drop a leaf image here
            </h2>
            <p className="text-sm leading-6 text-slate-600 md:text-base">
              Upload one JPEG, PNG, or WEBP image up to 5MB. We will analyze the leaf and generate a full treatment plan.
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            disabled={disabled}
          >
            Choose image
          </button>
        </div>
      )}

      {activeError ? (
        <p className="absolute bottom-4 left-4 right-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {activeError}
        </p>
      ) : (
        <p className="absolute bottom-4 left-4 right-4 text-xs font-medium uppercase tracking-[0.28em] text-slate-400">
          Drag and drop or click to browse
        </p>
      )}
    </div>
  );
}
