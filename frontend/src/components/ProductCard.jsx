import React from "react";
import { getImageUrl } from "../api/imageUrl";

const ProductCard = ({ crop, onAddToCart }) => {
  const cover = crop.images?.[0]?.url;
  const isSoldOut = crop.status === "Out of Stock" || crop.stockQuantity === 0;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-48 bg-leaf-50 flex items-center justify-center overflow-hidden">
        {cover ? (
          <img src={getImageUrl(cover)} alt={crop.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-leaf-300 text-sm">No image</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-display font-semibold text-lg text-leaf-900">{crop.name}</h3>
          <p className="text-sm text-leaf-500">{crop.farmer?.farmName || crop.farmer?.name}</p>
        </div>
        <div className="grid gap-2 text-sm text-leaf-600">
          <span className="font-medium text-leaf-800">৳{crop.pricePerUnit} / {crop.unit}</span>
          <span>Season: {crop.season}</span>
          <span>Stock: {crop.stockQuantity}</span>
        </div>
        <button
          disabled={isSoldOut}
          onClick={() => onAddToCart(crop)}
          className={`btn-primary w-full ${isSoldOut ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSoldOut ? "Sold Out" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
