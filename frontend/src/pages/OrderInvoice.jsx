import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { getImageUrl } from "../api/imageUrl";

const OrderInvoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Order not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePayment = async () => {
    setPaymentMessage("");
    setPaymentProcessing(true);

    try {
      const { data } = await api.post(`/orders/${id}/pay`);
      setOrder(data.data);
      setPaymentMessage("Payment completed successfully.");
    } catch (err) {
      setPaymentMessage(err.response?.data?.message || "Payment failed.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8">Loading invoice…</div>;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Link to="/" className="btn-secondary mt-4 inline-block">
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="card p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-leaf-900">Order Invoice</h1>
            <p className="text-sm text-leaf-500">Order #{order._id}</p>
          </div>
          <div className="rounded-lg bg-leaf-50 px-4 py-2 text-sm text-leaf-600">
            {order.paymentMethod} · {order.paymentStatus}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <h2 className="font-semibold text-leaf-900">Buyer</h2>
            <p className="text-sm text-leaf-600">{order.buyerName}</p>
            <p className="text-sm text-leaf-600">{order.buyerEmail}</p>
            <p className="text-sm text-leaf-600">{order.buyerPhone}</p>
          </div>
          <div className="card p-4">
            <h2 className="font-semibold text-leaf-900">Shipping</h2>
            <p className="text-sm text-leaf-600">{order.shippingAddress.street}</p>
            <p className="text-sm text-leaf-600">{order.shippingAddress.city}, {order.shippingAddress.district}</p>
            <p className="text-sm text-leaf-600">{order.shippingAddress.postalCode}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-leaf-900">Items</h2>
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div key={item.crop} className="flex items-center justify-between gap-4 p-4 bg-leaf-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-lg border border-leaf-200 flex items-center justify-center text-xs text-leaf-400">No image</div>
                  )}
                  <div>
                    <p className="font-medium text-leaf-900">{item.name}</p>
                    <p className="text-sm text-leaf-600">{item.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-leaf-700">Qty: {item.quantity}</p>
                  <p className="font-semibold text-leaf-900">৳{item.quantity * item.pricePerUnit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.paymentMethod === "Digital Payment" && order.paymentStatus === "Pending" && (
          <div className="card rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
            <p>
              This order is waiting for digital payment confirmation. Click the button below to complete the simulated payment gateway.
            </p>
            <button
              type="button"
              onClick={handlePayment}
              disabled={paymentProcessing}
              className="btn-primary mt-4"
            >
              {paymentProcessing ? "Processing payment..." : "Pay Now"}
            </button>
          </div>
        )}

        {paymentMessage && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            {paymentMessage}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-leaf-200 pt-4 text-lg font-semibold">
          <span>{order.paymentStatus === "Paid" ? "Total Paid" : "Total Due"}</span>
          <span>৳{order.totalAmount.toFixed(2)}</span>
        </div>

        <Link to="/" className="btn-primary w-full text-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderInvoice;
