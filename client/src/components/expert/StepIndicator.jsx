function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex flex-col items-center ${i < steps.length - 1 ? "mr-0" : ""}`}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i < current ? "bg-green-600 text-white" : i === current ? "bg-green-600 text-white ring-4 ring-green-100" : "bg-gray-200 text-gray-400"
              }`}
            >
              {i < current ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${i === current ? "text-green-700" : "text-gray-400"}`}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-16 mx-2 mb-5 transition-colors duration-300 ${i < current ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
export default StepIndicator;