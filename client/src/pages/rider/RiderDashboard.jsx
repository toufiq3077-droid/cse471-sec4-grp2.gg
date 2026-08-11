import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Truck, Loader, Package, MapPin, Phone, User, RefreshCw, PackageCheck } from 'lucide-react';
import { riderApi } from '../../services/riderApi';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OrderCard({ order, onAction, actionLabel, actionClass, busy }) {
  const statusStyle = STATUS_STYLES[order.status] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">#{order.orderNumber}</p>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle}`}>
              {order.status}
            </span>
          </div>

          <div className="mt-2 space-y-1.5 text-sm">
            <p className="flex items-center gap-1.5 text-slate-700">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium">{order.buyerName || 'Buyer'}</span>
              {order.buyerPhone && (
                <span className="text-slate-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {order.buyerPhone}
                </span>
              )}
            </p>
            <p className="flex items-start gap-1.5 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {[order.shippingAddress?.street, order.shippingAddress?.city, order.shippingAddress?.district]
                  .filter(Boolean)
                  .join(', ') || 'No delivery address'}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {formatDate(order.createdAt)} {formatTime(order.createdAt)} • {order.itemCount} item(s)
            </p>
            <p className="text-xs text-slate-400 truncate">
              {order.items.map((item) => `${item.name} (x${item.quantity})`).join(', ')}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end shrink-0 gap-2">
          <p className="text-lg font-extrabold text-emerald-700">৳{order.total}</p>
          <Link
            to={`/orders/${order._id}`}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            View Invoice →
          </Link>
        </div>
      </div>

      {onAction && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => onAction(order)}
            disabled={busy}
            className={`inline-flex items-center gap-2 text-white font-semibold py-2.5 px-5 rounded-xl transition text-sm shadow-sm disabled:opacity-60 ${actionClass}`}
          >
            {busy ? <Loader className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function RiderDashboard() {
  const [available, setAvailable] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [availRes, deliveriesRes] = await Promise.all([
        riderApi.getAvailable(),
        riderApi.getDeliveries(),
      ]);
      setAvailable(availRes.orders || []);
      setDeliveries(deliveriesRes.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runAction = async (order, action, successMsg) => {
    setBusyId(order._id);
    try {
      await action(order._id);
      toast.success(successMsg);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const activeDeliveries = deliveries.filter((o) => ['processing', 'shipped'].includes(o.status));
  const completedDeliveries = deliveries.filter((o) => o.status === 'delivered');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-600 text-white rounded-2xl flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Rider Dashboard</h1>
            <p className="text-slate-500 text-sm">Accept deliveries and update their status in real time.</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
          <p className="text-rose-600 font-semibold">{error}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Available Orders */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Available Orders
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {available.length}
                </span>
              </h2>
            </div>

            {available.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No orders available</h3>
                <p className="text-slate-500 text-sm">New orders ready for pickup will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {available.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onAction={(o) => runAction(o, (id) => riderApi.accept(id), 'Order accepted for delivery')}
                    actionLabel="Accept Delivery"
                    actionClass="bg-emerald-600 hover:bg-emerald-700"
                    busy={busyId === order._id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Active Deliveries */}
          <section>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-blue-600" />
              Active Deliveries
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {activeDeliveries.length}
              </span>
            </h2>

            {activeDeliveries.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No active deliveries</h3>
                <p className="text-slate-500 text-sm">Accept an order above to start delivering.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onAction={(o) =>
                      runAction(
                        o,
                        (id) => riderApi.updateStatus(id, order.status === 'processing' ? 'shipped' : 'delivered'),
                        order.status === 'processing' ? 'Order marked as shipped' : 'Order marked as delivered'
                      )
                    }
                    actionLabel={order.status === 'processing' ? 'Start Delivery (Shipped)' : 'Mark as Delivered'}
                    actionClass={
                      order.status === 'processing' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                    }
                    busy={busyId === order._id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Completed Deliveries */}
          {completedDeliveries.length > 0 && (
            <section>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                <PackageCheck className="w-5 h-5 text-green-600" />
                Completed Deliveries
                <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  {completedDeliveries.length}
                </span>
              </h2>
              <div className="space-y-4">
                {completedDeliveries.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
