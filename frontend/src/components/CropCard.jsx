import React from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../api/imageUrl";

const statusStyles = {
  Active: "bg-leaf-100 text-leaf-700",
  "Out of Stock": "bg-amber-100 text-amber-700",
  Inactive: "bg-gray-100 text-gray-500",
};

const CropCard = ({ crop, onDelete }) => {
  const cover = crop.images?.[0]?.url;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-40 bg-leaf-50 flex items-center justify-center overflow-hidden">
        {cover ? (
          <img src={getImageUrl(cover)} alt={crop.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-leaf-300 text-sm">No image</span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-lg text-leaf-900">{crop.name}</h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${statusStyles[crop.status]}`}>
            {crop.status}
          </span>
        </div>

        <p className="text-sm text-leaf-500">
          {crop.category} · {crop.season}
        </p>

        <div className="flex items-center justify-between mt-1">
          <span className="font-semibold text-leaf-800">
            ৳{crop.pricePerUnit}
            <span className="text-xs text-leaf-400"> / {crop.unit}</span>
          </span>
          <span className="text-sm text-leaf-500">
            Stock: {crop.stockQuantity} {crop.unit}
          </span>
        </div>

        <div className="mt-auto pt-3 flex items-center gap-2">
          <Link to={`/crops/${crop._id}/edit`} className="btn-secondary flex-1 justify-center">
            Edit
          </Link>
          <button onClick={() => onDelete(crop._id)} className="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropCard;
