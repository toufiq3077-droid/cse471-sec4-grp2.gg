import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Checkout = () => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user, isBuyer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    buyerName: isBuyer ? user.name : "",
    buyerEmail: isBuyer ? user.email : "",
    buyerPhone: isBuyer ? user.phone : "",
    street: isBuyer ? user.address?.street || "" : "",
    city: isBuyer ? user.address?.city || "" : "",
    district: isBuyer ? user.address?.district || "" : "",
    postalCode: isBuyer ? user.address?.postalCode || "" : "",
    paymentMethod: "Cash on Delivery",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/orders", {
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail,
        buyerPhone: form.buyerPhone,
        shippingAddress: {
          street: form.street,
          city: form.city,
          district: form.district,
          postalCode: form.postalCode,
        },
        paymentMethod: form.paymentMethod,
        orderItems: cartItems.map((item) => ({ crop: item.crop, quantity: item.quantity })),
      });

      clearCart();
      navigate(`/order/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h1 className="font-display text-2xl font-semibold text-leaf-900">Checkout</h1>
            <p className="text-sm text-leaf-500 mt-1">Complete your order with buyer details and payment method.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          {isBuyer && (
            <div className="bg-leaf-50 text-leaf-700 text-sm px-3 py-2 rounded-lg">
              Ordering as {user.name} — this order will be saved to your account under "My Orders".
            </div>
          )}

          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-leaf-900">Buyer Information</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input required className="input-field" value={form.buyerName} onChange={update("buyerName")} />
              </div>
              <div>
                <label className="label">Email</label>
                <input required type="email" className="input-field" value={form.buyerEmail} onChange={update("buyerEmail")} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input required className="input-field" value={form.buyerPhone} onChange={update("buyerPhone")} />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input-field" value={form.paymentMethod} onChange={update("paymentMethod")}>
                  <option>Cash on Delivery</option>
                  <option>Digital Payment</option>
                </select>
              </div>
            </div>
            {form.paymentMethod === "Digital Payment" && (
              <div className="bg-leaf-50 border border-leaf-200 rounded-lg p-4 text-sm text-leaf-700">
                This order uses the digital payment gateway simulation. You can complete payment after the order is created on the invoice page.
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Placing order..." : "Place Order"}
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-leaf-900">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.crop} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-leaf-800">{item.name}</p>
                    <p className="text-sm text-leaf-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-leaf-900">৳{item.quantity * item.pricePerUnit}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-leaf-200 mt-4 pt-4 text-sm text-leaf-600 flex items-center justify-between">
              <span>Total</span>
              <span>৳{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
