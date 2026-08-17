import React, { useState } from 'react';
import { ArrowLeft, Save, Loader, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CATEGORIES, categoryLabels, units } from '../../services/cropApi';
import PhotoUploader from './PhotoUploader';

export default function ListingForm({ initialValues = {}, onSubmit, submitLabel, heading, subheading }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: initialValues.name || '',
    category: initialValues.category || 'vegetables',
    price: initialValues.price ?? '',
    unit: initialValues.unit || 'kg',
    quantity: initialValues.quantity ?? '',
    description: initialValues.description || '',
  });
  const [photos, setPhotos] = useState(initialValues.photos || []);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Crop name is required';
    if (form.price === '' || Number(form.price) < 0) next.price = 'Enter a valid price';
    if (form.quantity === '' || Number(form.quantity) < 0) next.quantity = 'Enter a valid quantity';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        unit: form.unit,
        quantity: Number(form.quantity),
        description: form.description.trim(),
        photos,
      });
      toast.success(submitLabel === 'Update Listing' ? 'Listing updated successfully!' : 'Listing created successfully!');
      navigate('/my-listings');
    } catch (error) {
      toast.error(error.message || 'Failed to save listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm ${
      errors[field] ? 'border-rose-400' : 'border-slate-200'
    }`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-sm font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 sm:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{heading}</h1>
              {subheading && <p className="text-emerald-100 text-sm">{subheading}</p>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Crop Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Organic BRRI Rice"
                className={inputClass('name')}
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Price (৳)</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 65"
                className={inputClass('price')}
              />
              {errors.price && <p className="text-rose-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Unit</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u === 'kg' ? 'Kilogram (kg)' : u.charAt(0).toUpperCase() + u.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Available Quantity</label>
              <input
                type="number"
                name="quantity"
                min="0"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g. 100"
                className={inputClass('quantity')}
              />
              {errors.quantity && <p className="text-rose-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Description</label>
            <textarea
              name="description"
              rows="4"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe quality, harvest date, organic certification, etc."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">Crop Photos</label>
            <PhotoUploader photos={photos} onChange={setPhotos} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-slate-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md shadow-emerald-200 transition flex items-center gap-2 text-sm"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
