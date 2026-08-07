import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/orders/mine");
        setOrders(data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-leaf-900">My Orders</h1>
        <p className="text-sm text-leaf-500">Your past orders placed while logged in.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <p className="text-leaf-500">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-leaf-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/" className="btn-primary">Browse the marketplace</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/order/${order._id}`}
              className="card p-5 flex flex-wrap items-center justify-between gap-3 hover:border-leaf-300 transition-colors"
            >
              <div>
                <p className="font-medium text-leaf-900">Order #{order._id.slice(-8)}</p>
                <p className="text-sm text-leaf-500">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.orderItems.length} item(s)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm rounded-full bg-leaf-50 px-3 py-1 text-leaf-700">
                  {order.status}
                </span>
                <span className="text-sm text-leaf-600">{order.paymentMethod} · {order.paymentStatus}</span>
                <span className="font-semibold text-leaf-900">৳{order.totalAmount.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
