import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Box, Loader, Pencil, Plus, Trash2 } from 'lucide-react';
import { farmResourceApi } from '../../services/farmResourceApi';

const CATEGORIES = ['Seeds', 'Fertilizer', 'Pesticide', 'Other'];
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ name: '', category: 'Seeds', quantity: '', purchaseDate: today() });

export default function FarmResourcesPage() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadResources = async () => {
    try {
      const data = await farmResourceApi.list();
      setResources(data.resources || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load farm resources.');
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      await loadResources();
      setLoading(false);
    };
    loadPage();
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || form.quantity === '' || !form.purchaseDate) {
      toast.error('Complete all resource fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim(), quantity: Number(form.quantity) };
      const data = editingId ? await farmResourceApi.update(editingId, payload) : await farmResourceApi.create(payload);
      toast.success(data.message);
      resetForm();
      await loadResources();
    } catch (error) {
      toast.error(error.message || 'Failed to save farm resource.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (resource) => {
    setEditingId(resource._id);
    setForm({ name: resource.name, category: resource.category, quantity: resource.quantity, purchaseDate: new Date(resource.purchaseDate).toISOString().slice(0, 10) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete "${resource.name}"? This cannot be undone.`)) return;
    try {
      await farmResourceApi.remove(resource._id);
      setResources((current) => current.filter((item) => item._id !== resource._id));
      if (editingId === resource._id) resetForm();
      toast.success('Farm resource deleted.');
    } catch (error) {
      toast.error(error.message || 'Failed to delete farm resource.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8"><h1 className="text-3xl font-black text-slate-900">Farm Resource Manager</h1><p className="text-slate-500 text-sm mt-1">Track your seeds, fertilizers, pesticides, and other farming supplies.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Box className="w-5 h-5" /></div><h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit resource' : 'Add resource'}</h2></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Resource Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength="150" required placeholder="e.g. Tomato seeds" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="block text-sm font-semibold text-slate-700">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className="block text-sm font-semibold text-slate-700">Quantity<input type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required placeholder="e.g. 10" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <label className="block text-sm font-semibold text-slate-700">Purchase Date<input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></label>
            <div className="flex gap-3 pt-1"><button disabled={saving} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" /> {saving ? 'Saving...' : editingId ? 'Update resource' : 'Add resource'}</button>{editingId && <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>}</div>
          </form>
        </section>
        <section className="lg:col-span-3"><h2 className="text-lg font-bold text-slate-900 mb-4">Saved resources</h2>{loading ? <div className="flex justify-center py-20"><Loader className="w-8 h-8 text-emerald-600 animate-spin" /></div> : resources.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-slate-200"><Box className="w-9 h-9 text-emerald-300 mx-auto mb-3" /><p className="font-semibold text-slate-700">No resources yet</p><p className="text-sm text-slate-500 mt-1">Add a resource to start tracking farm supplies.</p></div> : <div className="space-y-4">{resources.map((resource) => <article key={resource._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{resource.name}</p><p className="text-xs text-slate-500 mt-1">Purchased {new Date(resource.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p></div><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{resource.category}</span></div><p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-700">Quantity:</span> {resource.quantity}</p><div className="flex gap-2 mt-4"><button onClick={() => startEdit(resource)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><Pencil className="w-3.5 h-3.5" /> Edit</button><button onClick={() => handleDelete(resource)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200"><Trash2 className="w-3.5 h-3.5" /> Delete</button></div></article>)}</div>}</section>
      </div>
    </div>
  );
}
