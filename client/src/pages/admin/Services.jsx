import { useState, useEffect } from 'react';
import { api } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, Loader2 } from 'lucide-react';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: '', description: '', category: '', base_price: '', duration_minutes: '60' };
  const [form, setForm] = useState(emptyForm);

  const categories = [...new Set(services.map((s) => s.category))].sort();

  const fetchServices = () => {
    setLoading(true);
    api.getAllServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      description: s.description || '',
      category: s.category,
      base_price: String(s.base_price),
      duration_minutes: String(s.duration_minutes),
    });
    setShowForm(true);
  };

  const startNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.category || !form.base_price) {
      toast.error('Name, category, and price are required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        base_price: parseFloat(form.base_price),
        duration_minutes: parseInt(form.duration_minutes) || 60,
      };
      if (editId) {
        await api.updateService(editId, data);
        toast.success('Service updated');
      } else {
        await api.createService(data);
        toast.success('Service created');
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      fetchServices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.updateService(s.id, { active: s.active ? 0 : 1 });
      toast.success(s.active ? 'Service deactivated' : 'Service activated');
      fetchServices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div></div>;

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = services.filter((s) => s.category === cat);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Services</h1>
        <button onClick={startNew} className="btn-primary btn-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy-700">{editId ? 'Edit Service' : 'Add Service'}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Oil Change" /></div>
              <div><label className="label">Category *</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" placeholder="e.g. Engine, Brakes, Tires" list="cats" />
                <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Price ($) *</label><input type="number" step="0.01" min="0" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="input-field" /></div>
                <div><label className="label">Duration (min)</label><input type="number" min="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="input-field" /></div>
              </div>
              <button onClick={save} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Update Service' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold text-navy-700 mb-3">{category}</h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-medium text-gray-600">Service</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600">Description</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600 text-right">Price</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600 text-right">Duration</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600 text-center">Status</th>
                  <th className="px-4 py-2.5 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className={`border-t ${!s.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[250px] truncate">{s.description}</td>
                    <td className="px-4 py-3 text-right font-medium">${s.base_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{s.duration_minutes} min</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(s)} className={`badge cursor-pointer ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(s)} className="text-brand-500 hover:text-brand-700"><Pencil className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
