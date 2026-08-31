import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, ImagePlus, Loader, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cropJournalApi } from '../../services/cropJournalApi';
import { compressImage } from '../../utils/imageUtils';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ crop: '', date: today(), growthStage: '', note: '', image: '' });

export default function CropJournalPage() {
  const [entries, setEntries] = useState([]);
  const [filterCrop, setFilterCrop] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const inputRef = useRef(null);

  const loadEntries = async (crop = filterCrop) => {
    try {
      const data = await cropJournalApi.list(crop);
      setEntries(data.entries || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load journal entries.');
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      try {
        const journalData = await cropJournalApi.list();
        setEntries(journalData.entries || []);
      } catch (error) {
        toast.error(error.message || 'Failed to load crop journal.');
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, []);

  const handleFilterChange = async (event) => {
    const crop = event.target.value;
    setFilterCrop(crop);
    await loadEntries(crop);
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProcessingImage(true);
    try {
      const image = await compressImage(file);
      setForm((current) => ({ ...current, image }));
    } catch (error) {
      toast.error(error.message || 'Failed to process image.');
    } finally {
      setProcessingImage(false);
      event.target.value = '';
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.crop || !form.date || !form.growthStage.trim() || !form.note.trim()) {
      toast.error('Enter a crop/product name and complete all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, growthStage: form.growthStage.trim(), note: form.note.trim() };
      const data = editingId ? await cropJournalApi.update(editingId, payload) : await cropJournalApi.create(payload);
      toast.success(data.message);
      resetForm();
      await loadEntries();
    } catch (error) {
      toast.error(error.message || 'Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setForm({ crop: entry.crop, date: new Date(entry.date).toISOString().slice(0, 10), growthStage: entry.growthStage, note: entry.note, image: entry.image || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete this ${entry.growthStage} journal entry? This cannot be undone.`)) return;
    try {
      await cropJournalApi.remove(entry._id);
      setEntries((current) => current.filter((item) => item._id !== entry._id));
      if (editingId === entry._id) resetForm();
      toast.success('Journal entry deleted.');
    } catch (error) {
      toast.error(error.message || 'Failed to delete journal entry.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Crop Farming Journal</h1>
        <p className="text-slate-500 text-sm mt-1">Record crop observations, growth stages, and field notes in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><BookOpen className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit entry' : 'New observation'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Crop/Product Name
                <input value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} maxLength="150" required placeholder="e.g. Tomato" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Observation date
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Growth stage
                <input value={form.growthStage} onChange={(e) => setForm({ ...form, growthStage: e.target.value })} maxLength="100" required placeholder="e.g. Flowering" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Farming notes
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength="5000" required rows="4" placeholder="Record growth, irrigation, pests, or other observations..." className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <div>
                <span className="block text-sm font-semibold text-slate-700 mb-1.5">Optional image</span>
                {form.image ? <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-slate-200"><img src={form.image} alt="Journal preview" className="w-full h-full object-cover" /><button type="button" onClick={() => setForm({ ...form, image: '' })} className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white"><X className="w-3.5 h-3.5" /></button></div> : <button type="button" disabled={processingImage} onClick={() => inputRef.current?.click()} className="w-full border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-xl py-4 text-sm text-emerald-700 flex justify-center gap-2 items-center"><>{processingImage ? <Loader className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}</> {processingImage ? 'Processing image...' : 'Upload image'}</button>}
                <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleImage} />
              </div>
              <div className="flex gap-3 pt-1"><button disabled={saving || processingImage} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" /> {saving ? 'Saving...' : editingId ? 'Update entry' : 'Add entry'}</button>{editingId && <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>}</div>
          </form>
        </section>

        <section className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"><h2 className="text-lg font-bold text-slate-900">Journal entries</h2><input value={filterCrop} onChange={handleFilterChange} placeholder="Filter by crop/product" className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          {loading ? <div className="flex justify-center py-20"><Loader className="w-8 h-8 text-emerald-600 animate-spin" /></div> : entries.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-slate-200"><BookOpen className="w-9 h-9 text-emerald-300 mx-auto mb-3" /><p className="font-semibold text-slate-700">No journal entries yet</p><p className="text-sm text-slate-500 mt-1">Add an observation to start your crop record.</p></div> : <div className="space-y-4">{entries.map((entry) => <article key={entry._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-slate-900">{entry.crop || 'Crop'}</p><p className="text-xs text-slate-500 mt-0.5">{new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p></div><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{entry.growthStage}</span></div><p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{entry.note}</p><div className="flex gap-2 mt-4"><button onClick={() => startEdit(entry)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"><Pencil className="w-3.5 h-3.5" /> Edit</button><button onClick={() => handleDelete(entry)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200"><Trash2 className="w-3.5 h-3.5" /> Delete</button></div></div>{entry.image && <img src={entry.image} alt={`${entry.crop || 'Crop'} observation`} className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 object-cover rounded-xl border border-slate-200" />}</article>)}</div>}
        </section>
      </div>
    </div>
  );
}
