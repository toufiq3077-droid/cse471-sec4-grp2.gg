import React from 'react';
import { useParams } from 'react-router-dom';
import LiveTrackingView from '../../components/tracking/LiveTrackingView';

export default function BuyerTrackingPage() {
  const { id } = useParams();
  return <LiveTrackingView orderId={id} backTo={`/orders/${id}`} />;
}
