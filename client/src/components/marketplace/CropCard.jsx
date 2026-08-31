import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Package } from 'lucide-react';
import { categoryLabels } from '../../services/cropApi';

export default function CropCard({ crop }) {
  const inStock = crop.status === 'available' && crop.quantity > 0;

  return (
    <Link
      to={`/marketplace/${crop._id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden group flex flex-col"
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {crop.photos?.[0] ? (
          <img
            src={crop.photos[0]}
            alt={crop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Package className="w-12 h-12" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-emerald-700 text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
          {categoryLabels[crop.category] || crop.category}
        </span>
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-slate-900 text-lg leading-snug">{crop.name}</h3>

        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-emerald-700">৳{crop.price}</span>
          <span className="text-sm text-slate-500">/ {crop.unit}</span>
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="truncate">{crop.farmerName || 'Farmer'}</span>
        </p>

        <div className="mt-auto pt-2 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {crop.location?.district || 'Bangladesh'}
          </span>
          <span className={inStock ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
            {inStock ? `${crop.quantity} ${crop.unit} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}
