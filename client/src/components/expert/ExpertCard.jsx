import {
  User,
  Star,
  DollarSign,
  Award,
  CheckCircle,
} from "lucide-react";

function ExpertCard({ expert, onSelect }) {
  return (
    <div
      onClick={() => onSelect(expert)}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-green-300 overflow-hidden group"
    >
      <div className="relative h-40 bg-gradient-to-br from-green-400 to-emerald-600">
        {expert.profileImage ? (
          <img src={expert.profileImage} alt={expert.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={64} className="text-white opacity-60" />
          </div>
        )}
        {expert.isVerified && (
          <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> Verified
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">{expert.name}</h3>
        <p className="text-sm text-green-600 font-medium mb-2">{expert.specialization}</p>

        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < Math.round(expert.rating || 0) ? "#f59e0b" : "none"} className="text-amber-400" />
          ))}
          <span className="text-xs text-gray-500 ml-1">({expert.reviewCount || 0})</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Award size={14} />
            <span>{expert.experience} yrs exp</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-green-700">
            <DollarSign size={14} />
            <span>{expert.fee}/session</span>
          </div>
        </div>

        <button className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
          View & Book
        </button>
      </div>
    </div>
  );
}
export default ExpertCard;