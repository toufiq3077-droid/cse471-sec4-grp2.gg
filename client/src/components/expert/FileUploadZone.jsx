import FileUploadZone from "../../components/expert/FileUploadZone";

function FileUploadZone({ label, files, onAdd, onRemove, accept = ".pdf,.jpg,.jpeg,.png", maxFiles = 5 }) {
  const inputRef = useRef(null);
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div
        onClick={() => files.length < maxFiles && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
          files.length >= maxFiles ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-green-300 hover:border-green-500 hover:bg-green-50"
        }`}
      >
        <Upload size={28} className="mx-auto text-green-400 mb-2" />
        <p className="text-sm text-gray-500">Click to upload <span className="font-medium text-green-600">({maxFiles - files.length} remaining)</span></p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG accepted</p>
        <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={(e) => onAdd(Array.from(e.target.files))} />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2 border border-green-100">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText size={16} className="text-green-600" />
                <span className="truncate max-w-xs">{f.name || f.url?.split("/").pop() || "File"}</span>
                {f.uploading && <Loader size={12} className="animate-spin text-green-500" />}
                {f.error && <AlertCircle size={12} className="text-red-500" />}
                {f.url && <CheckCircle size={12} className="text-green-500" />}
              </div>
              <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default FileUploadZone;