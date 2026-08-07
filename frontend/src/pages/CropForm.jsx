import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import ImageUploader from "../components/ImageUploader";

const categories = ["Vegetable", "Fruit", "Grain", "Spice", "Pulses", "Flower", "Other"];
const units = ["kg", "gram", "ton", "quintal", "piece", "dozen", "bundle"];
const seasons = ["Summer", "Winter", "Rainy", "Autumn", "Spring", "All Season"];

const emptyForm = {
  name: "",
  category: "Vegetable",
  description: "",
  stockQuantity: "",
  unit: "kg",
  season: "All Season",
  harvestDate: "",
  availableFrom: "",
  availableUntil: "",
  pricePerUnit: "",
  discountPercent: 0,
};

const CropForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await api.get(`/crops/${id}`);
        const crop = data.data;
        setForm({
          name: crop.name,
          category: crop.category,
          description: crop.description || "",
          stockQuantity: crop.stockQuantity,
          unit: crop.unit,
          season: crop.season,
          harvestDate: crop.harvestDate ? crop.harvestDate.slice(0, 10) : "",
          availableFrom: crop.availableFrom ? crop.availableFrom.slice(0, 10) : "",
          availableUntil: crop.availableUntil ? crop.availableUntil.slice(0, 10) : "",
          pricePerUnit: crop.pricePerUnit,
          discountPercent: crop.discountPercent || 0,
        });
        setExistingImages(crop.images || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load listing");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleRemoveExistingImage = async (publicId) => {
    if (!isEdit) return;
    if (!window.confirm("Remove this image?")) return;
    try {
      await api.delete(`/crops/${id}/images/${publicId}`);
      setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        payload.append(key, value);
      }
    });
    newFiles.forEach((file) => payload.append("images", file));

    try {
      if (isEdit) {
        await api.put(`/crops/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/crops", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      navigate("/my-listings");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="max-w-3xl mx-auto px-4 py-10 text-leaf-500">Loading listing...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-leaf-900 mb-1">
        {isEdit ? "Edit Crop Listing" : "Add New Crop Listing"}
      </h1>
      <p className="text-sm text-leaf-500 mb-6">
        Fill in stock, seasonal availability, pricing and photos for buyers to see.
      </p>

      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Crop Name</label>
            <input required className="input-field" value={form.name} onChange={update("name")} placeholder="e.g. Tomato" />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category} onChange={update("category")}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.description}
            onChange={update("description")}
            placeholder="Quality, growing method, anything buyers should know"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Stock Quantity</label>
            <input
              type="number"
              min="0"
              required
              className="input-field"
              value={form.stockQuantity}
              onChange={update("stockQuantity")}
            />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input-field" value={form.unit} onChange={update("unit")}>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Price / Unit (৳)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className="input-field"
              value={form.pricePerUnit}
              onChange={update("pricePerUnit")}
            />
          </div>
          <div>
            <label className="label">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              className="input-field"
              value={form.discountPercent}
              onChange={update("discountPercent")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Season</label>
            <select className="input-field" value={form.season} onChange={update("season")}>
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Harvest Date</label>
            <input type="date" className="input-field" value={form.harvestDate} onChange={update("harvestDate")} />
          </div>
          <div>
            <label className="label">Available From</label>
            <input type="date" className="input-field" value={form.availableFrom} onChange={update("availableFrom")} />
          </div>
          <div>
            <label className="label">Available Until</label>
            <input type="date" className="input-field" value={form.availableUntil} onChange={update("availableUntil")} />
          </div>
        </div>

        <ImageUploader
          existingImages={existingImages}
          newFiles={newFiles}
          onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
          onRemoveNewFile={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
          onRemoveExistingImage={handleRemoveExistingImage}
        />

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Publish Listing"}
          </button>
          <button type="button" onClick={() => navigate("/my-listings")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CropForm;
