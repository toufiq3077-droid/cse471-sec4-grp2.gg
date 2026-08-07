import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/axios";
import { getImageUrl } from "../api/imageUrl";

const Cart = () => {
  const { cartItems, updateQuantity, removeItem, totalAmount } = useCart();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-leaf-900">Shopping Cart</h1>
          <p className="text-sm text-leaf-500">Review your selected crops before checkout.</p>
        </div>
        <button
          onClick={() => navigate("/checkout")}
          disabled={cartItems.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Checkout
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-leaf-500 mb-4">Your cart is empty.</p>
          <Link to="/" className="btn-secondary">
            Browse Crops
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.crop} className="card p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                  ) : (
                    <div className="w-24 h-24 bg-leaf-50 rounded-lg flex items-center justify-center text-sm text-leaf-400">No image</div>
                  )}
                  <div>
                    <h2 className="font-semibold text-leaf-900">{item.name}</h2>
                    <p className="text-sm text-leaf-500">{item.unit}</p>
                    <p className="text-sm text-leaf-600">৳{item.pricePerUnit} each</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 items-start sm:items-end">
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-leaf-500">Qty:</label>
                    <input
                      type="number"
                      min="1"
                      max={item.stockQuantity}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.crop, e.target.value)}
                      className="input-field w-20"
                    />
                  </div>
                  <p className="text-sm text-leaf-700">Subtotal: ৳{item.quantity * item.pricePerUnit}</p>
                  <button onClick={() => removeItem(item.crop)} className="text-red-600 text-sm hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-leaf-900">Order Summary</h2>
              <p className="text-sm text-leaf-500">{cartItems.length} item(s)</p>
            </div>
            <div className="flex items-center justify-between text-sm text-leaf-600">
              <span>Subtotal</span>
              <span>৳{totalAmount.toFixed(2)}</span>
            </div>
            <div className="border-t border-leaf-200 pt-4 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>৳{totalAmount.toFixed(2)}</span>
            </div>
            <button onClick={() => navigate("/checkout")} className="btn-primary w-full">
              Checkout Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
