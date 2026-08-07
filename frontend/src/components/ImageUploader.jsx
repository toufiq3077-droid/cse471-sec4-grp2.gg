import React, { useRef } from "react";
import { getImageUrl } from "../api/imageUrl";

// existingImages: [{url, publicId}] already saved on the crop (edit mode)
// newFiles: File[] picked but not yet uploaded
const ImageUploader = ({
  existingImages = [],
  newFiles = [],
  onAddFiles,
  onRemoveNewFile,
  onRemoveExistingImage,
  maxImages = 6,
}) => {
  const inputRef = useRef(null);
  const totalCount = existingImages.length + newFiles.length;

  const handleFiles = (fileList) => {
    const files = Array.from(fileList);
    const room = maxImages - totalCount;
    if (room <= 0) return;
    onAddFiles(files.slice(0, room));
  };

  return (
    <div>
      <label className="label">Product Images (up to {maxImages})</label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {existingImages.map((img) => (
          <div key={img.publicId} className="relative group aspect-square rounded-lg overflow-hidden border border-leaf-100">
            <img src={getImageUrl(img.url)} alt="crop" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExistingImage(img.publicId)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        {newFiles.map((file, idx) => (
          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-leaf-200 border-dashed">
            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveNewFile(idx)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        {totalCount < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-leaf-200 text-leaf-400 hover:border-leaf-400 hover:text-leaf-600 flex flex-col items-center justify-center text-sm transition-colors"
          >
            <span className="text-2xl leading-none">+</span>
            Add photo
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-leaf-400">{totalCount}/{maxImages} images selected. JPG, PNG or WEBP, max 5MB each.</p>
    </div>
  );
};

export default ImageUploader;
