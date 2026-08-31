import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader, Truck, LocateFixed, ArrowLeft } from 'lucide-react';
import { orderApi } from '../../services/orderApi';
import { riderApi } from '../../services/riderApi';
import LiveTrackingView from '../../components/tracking/LiveTrackingView';
import AddressPickerMap from '../../components/common/AddressPickerMap';

export default function RiderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [riderPoint, setRiderPoint] = useState(null);

  useEffect(() => {
    orderApi
      .get(id)
      .then((res) => setOrder(res.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartDelivery = async () => {
    if (!riderPoint || riderPoint.lat == null || riderPoint.lng == null) {
      toast.error('Please point your current location on the map first.');
      return;
    }
    setStarting(true);
    try {
      await riderApi.updateStatus(id, 'shipped', {
        lat: Number(riderPoint.lat),
        lng: Number(riderPoint.lng),
        label: riderPoint.label || '',
      });
      toast.success('Delivery started — tracking is live!');
      const res = await orderApi.get(id);
      setOrder(res.order);
    } catch (err) {
      toast.error(err.message || 'Failed to start delivery');
    } finally {
      setStarting(false);
    }
  };

  const handleDeliver = async () => {
    await riderApi.updateStatus(id, 'delivered');
    toast.success('Order marked as delivered!');
    navigate('/rider');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-rose-600 font-semibold">Order not found</p>
        <button
          onClick={() => navigate('/rider')}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (order.status === 'shipped' || order.status === 'delivered') {
    return (
      <LiveTrackingView
        orderId={id}
        backTo="/rider"
        onAction={handleDeliver}
        actionLabel="Mark as Delivered"
        actionClass="bg-emerald-600 hover:bg-emerald-700"
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/rider')}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-sm font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Start Delivery</h1>
            <p className="text-slate-500 text-sm">Order #{order.orderNumber}</p>
          </div>
        </div>

        <p className="text-slate-600 text-sm mt-4 mb-5">
          Point your current location on the map or use my location so we can build your route:
          <span className="font-semibold text-slate-800"> you → farm pickup → buyer&apos;s address</span>,
          including the distance and estimated delivery time.
        </p>

        <AddressPickerMap
          value={riderPoint}
          onChange={setRiderPoint}
          height="360px"
        />

        <button
          onClick={handleStartDelivery}
          disabled={starting || !riderPoint}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md shadow-amber-200 transition text-sm"
        >
          {starting ? <Loader className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {starting ? 'Starting...' : 'Start Delivery & Track Live'}
        </button>
      </div>
    </div>
  );
}
