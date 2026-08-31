import React, { useRef, useState } from 'react';
import { ImagePlus, Loader, X, AlertCircle } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';

const MAX_PHOTOS = 5;

export default function PhotoUploader({ photos, onChange }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  const addFiles = async (files) => {
    const remaining = MAX_PHOTOS - photos.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) return;

    setProcessing(true);
    try {
      const compressed = [];
      for (const file of selected) {
        const dataUrl = await compressImage(file);
        compressed.push(dataUrl);
      }
      onChange([...photos, ...compressed]);
    } catch (error) {
      alert(error.message || 'Failed to process image');
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase text-slate-600">Photos ({photos.length}/{MAX_PHOTOS})</span>
        {photos.length >= MAX_PHOTOS && (
          <span className="text-xs text-rose-500 font-medium">Maximum {MAX_PHOTOS} photos</span>
        )}
      </div>

      <div
        onClick={() => photos.length < MAX_PHOTOS && !processing && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
          photos.length >= MAX_PHOTOS || processing
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
            : 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          {processing ? (
            <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
          ) : (
            <ImagePlus className="w-8 h-8 text-emerald-400" />
          )}
          <p className="text-sm text-slate-600">
            {processing ? 'Compressing image...' : 'Click to upload crop photos'}
          </p>
          <p className="text-xs text-slate-400">JPG / PNG / WEBP, auto-compressed</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
              <img src={photo} alt={`Crop ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 transition"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {!photo.startsWith('data:') && (
                <span className="absolute bottom-1.5 left-1.5 bg-white/90 text-amber-600 rounded-full p-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
