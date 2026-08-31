import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';
import { cropApi } from '../../services/cropApi';
import { useAuth } from '../../context/AuthContext';
import ListingForm from '../../components/marketplace/ListingForm';

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    cropApi
      .get(id)
      .then((data) => {
        const fetched = data.crop;
        if (user && String(user._id) !== String(fetched.farmerId)) {
          toast.error('You are not allowed to edit this listing.');
          navigate('/my-listings');
          return;
        }
        setCrop(fetched);
      })
      .catch(() => {
        setNotFound(true);
        toast.error('Listing not found.');
      })
      .finally(() => setLoading(false));
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex justify-center">
        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (notFound || !crop) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 font-medium">This listing does not exist.</p>
      </div>
    );
  }

  return (
    <ListingForm
      initialValues={{
        name: crop.name,
        category: crop.category,
        price: crop.price,
        unit: crop.unit,
        quantity: crop.quantity,
        description: crop.description,
        photos: crop.photos || [],
      }}
      heading={`Edit: ${crop.name}`}
      subheading="Update the details of your crop listing"
      submitLabel="Update Listing"
      onSubmit={(payload) => cropApi.update(crop._id, payload)}
    />
  );
}
