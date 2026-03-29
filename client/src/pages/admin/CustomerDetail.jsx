import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, MapPin, Car, Loader2, Save } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.getCustomer(id)
      .then((data) => {
        setCustomer(data);
        setForm({ name: data.name, email: data.email, phone: data.phone, address: data.address || '', city: data.city || '', province: data.province || '', postal_code: data.postal_code || '', notes: data.notes || '' });
      })
      .catch((err) => { toast.error(err.message); navigate('/admin/customers'); })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateCustomer(id, form);
      toast.success('Customer updated');
      setEditing(false);
      // Refresh
      const data = await api.getCustomer(id);
      setCustomer(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div></div>;
  if (!customer) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/customers')} className="text-gray-500 hover:text-navy-700"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-navy-700">{customer.name}</h1>
          <p className="text-sm text-gray-500">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
        <button onClick={() => setEditing(!editing)} className="ml-auto btn-outline btn-sm">
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Contact Information</h2>
            {editing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
                <div><label className="label">Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
                <div><label className="label">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
                <div><label className="label">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" /></div>
                <div><label className="label">City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" /></div>
                <div><label className="label">Province</label><input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="input-field" /></div>
                <div><label className="label">Postal Code</label><input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="input-field" /></div>
                <div className="sm:col-span-2"><label className="label">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="input-field" /></div>
                <div className="sm:col-span-2">
                  <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-500" />{customer.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-500" />{customer.phone}</div>
                {customer.address && <div className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4 text-brand-500" />{customer.address}{customer.city ? `, ${customer.city}` : ''}{customer.province ? `, ${customer.province}` : ''} {customer.postal_code}</div>}
                {customer.notes && <div className="sm:col-span-2 p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Notes</p><p>{customer.notes}</p></div>}
              </div>
            )}
          </div>

          {/* Vehicles */}
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Vehicles ({customer.vehicles.length})</h2>
            <div className="space-y-3">
              {customer.vehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Car className="h-5 w-5 text-brand-500" />
                  <div>
                    <p className="font-medium text-sm">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-gray-400">
                      {[v.color, v.license_plate && `Plate: ${v.license_plate}`, v.mileage && `${v.mileage.toLocaleString()} km`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking history */}
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Booking History ({customer.bookings.length})</h2>
            {customer.bookings.length === 0 ? (
              <p className="text-gray-500 text-sm">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {customer.bookings.map((b) => (
                  <Link key={b.id} to={`/admin/bookings/${b.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    <div>
                      <span className="font-medium text-brand-600">{b.reference_number}</span>
                      <span className="text-gray-400 ml-2">{b.service_names}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{b.scheduled_date}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar summary */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total Bookings</span><span className="font-medium">{customer.bookings.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Vehicles</span><span className="font-medium">{customer.vehicles.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Invoices</span><span className="font-medium">{customer.invoices.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Spent</span>
                <span className="font-bold text-brand-600">${customer.invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {customer.invoices.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-navy-700 mb-4">Invoices</h2>
              <div className="space-y-2">
                {customer.invoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{inv.invoice_number}</p>
                      <p className="text-gray-400 text-xs">{inv.due_date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${inv.total.toFixed(2)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
