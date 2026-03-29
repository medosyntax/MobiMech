import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { Search, Plus, X, Loader2 } from 'lucide-react';

export default function Bookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');

  // Create booking modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [bookingForm, setBookingForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    vehicle_make: '', vehicle_model: '', vehicle_year: '', vehicle_color: '', vehicle_license_plate: '',
    scheduled_date: '', scheduled_time: '',
    location_address: '', location_city: '', location_province: '', location_postal_code: '',
    notes: '', booking_type: 'service', diagnostic_notes: '',
  });

  const fetchBookings = () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    if (search) params.search = search;

    api.getBookings(params)
      .then((data) => {
        setBookings(data.bookings);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, dateFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const openCreate = () => {
    setShowCreate(true);
    if (services.length === 0) {
      api.getServices().then(setServices).catch(() => {});
    }
  };

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    const f = bookingForm;
    if (!f.customer_name || !f.customer_email || !f.customer_phone) {
      toast.error('Customer name, email, and phone are required');
      return;
    }
    if (!f.vehicle_make || !f.vehicle_model || !f.vehicle_year) {
      toast.error('Vehicle make, model, and year are required');
      return;
    }
    if (!f.scheduled_date || !f.scheduled_time) {
      toast.error('Date and time are required');
      return;
    }
    if (!f.location_address) {
      toast.error('Service location is required');
      return;
    }
    if (f.booking_type === 'service' && selectedServices.length === 0) {
      toast.error('Select at least one service');
      return;
    }
    if (f.booking_type === 'diagnostic' && !f.diagnostic_notes.trim()) {
      toast.error('Please describe the issue for a diagnostic');
      return;
    }

    setCreating(true);
    try {
      const payload = { ...f };
      if (f.booking_type === 'service') {
        payload.service_ids = selectedServices;
      }
      await api.createAdminBooking(payload);
      toast.success('Booking created');
      setShowCreate(false);
      setBookingForm({
        customer_name: '', customer_email: '', customer_phone: '',
        vehicle_make: '', vehicle_model: '', vehicle_year: '', vehicle_color: '', vehicle_license_plate: '',
        scheduled_date: '', scheduled_time: '',
        location_address: '', location_city: '', location_province: '', location_postal_code: '',
        notes: '', booking_type: 'service', diagnostic_notes: '',
      });
      setSelectedServices([]);
      setServiceSearch('');
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const timeSlots = [];
  for (let h = 8; h <= 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  const filteredModalServices = services.filter((s) =>
    !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const bf = bookingForm;
  const setBf = (key, val) => setBookingForm({ ...bookingForm, [key]: val });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Bookings</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} total</span>
          <button onClick={openCreate} className="btn-primary btn-sm flex items-center gap-1">
            <Plus className="h-4 w-4" /> Create Booking
          </button>
        </div>
      </div>

      {/* Create Booking Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy-700">Create Booking</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            {/* Booking Type */}
            <div className="mb-4">
              <label className="label">Booking Type</label>
              <div className="flex gap-3">
                <button onClick={() => setBf('booking_type', 'service')} className={`px-4 py-2 rounded-lg text-sm font-medium ${bf.booking_type === 'service' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Service</button>
                <button onClick={() => setBf('booking_type', 'diagnostic')} className={`px-4 py-2 rounded-lg text-sm font-medium ${bf.booking_type === 'diagnostic' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Diagnostic</button>
              </div>
            </div>

            {/* Customer Info */}
            <h3 className="font-semibold text-navy-700 text-sm mb-2">Customer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div><label className="label">Name *</label><input value={bf.customer_name} onChange={(e) => setBf('customer_name', e.target.value)} placeholder="Full name" className="input-field" /></div>
              <div><label className="label">Email *</label><input type="email" value={bf.customer_email} onChange={(e) => setBf('customer_email', e.target.value)} placeholder="email@example.com" className="input-field" /></div>
              <div><label className="label">Phone *</label><input type="tel" value={bf.customer_phone} onChange={(e) => setBf('customer_phone', e.target.value)} placeholder="(416) 123-4567" className="input-field" /></div>
            </div>

            {/* Vehicle Info */}
            <h3 className="font-semibold text-navy-700 text-sm mb-2">Vehicle</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div><label className="label">Make *</label><input value={bf.vehicle_make} onChange={(e) => setBf('vehicle_make', e.target.value)} placeholder="Toyota" className="input-field" /></div>
              <div><label className="label">Model *</label><input value={bf.vehicle_model} onChange={(e) => setBf('vehicle_model', e.target.value)} placeholder="Camry" className="input-field" /></div>
              <div><label className="label">Year *</label><input type="number" value={bf.vehicle_year} onChange={(e) => setBf('vehicle_year', e.target.value)} placeholder="2022" className="input-field" /></div>
              <div><label className="label">Color</label><input value={bf.vehicle_color} onChange={(e) => setBf('vehicle_color', e.target.value)} placeholder="Silver" className="input-field" /></div>
            </div>

            {/* Services or Diagnostic */}
            {bf.booking_type === 'service' ? (
              <div className="mb-4">
                <h3 className="font-semibold text-navy-700 text-sm mb-2">Services *</h3>
                <input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search services..." className="input-field mb-2" />
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {filteredModalServices.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedServices.includes(s.id)} onChange={() => toggleService(s.id)} className="rounded text-brand-500" />
                      <span className="flex-1">{s.name} <span className="text-gray-400">({s.category})</span></span>
                      <span className="font-medium text-brand-600">${s.base_price}</span>
                    </label>
                  ))}
                </div>
                {selectedServices.length > 0 && (
                  <p className="text-sm text-brand-600 font-medium mt-2">
                    {selectedServices.length} selected — ${services.filter((s) => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.base_price, 0).toFixed(2)}
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="font-semibold text-navy-700 text-sm mb-2">Issue Description *</h3>
                <textarea value={bf.diagnostic_notes} onChange={(e) => setBf('diagnostic_notes', e.target.value)} rows={3} placeholder="Describe what's wrong with the vehicle..." className="input-field" />
                <p className="text-xs text-purple-600 mt-1">Diagnostic fee: $95</p>
              </div>
            )}

            {/* Schedule & Location */}
            <h3 className="font-semibold text-navy-700 text-sm mb-2">Schedule & Location</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div><label className="label">Date *</label><input type="date" min={today} value={bf.scheduled_date} onChange={(e) => setBf('scheduled_date', e.target.value)} className="input-field" /></div>
              <div>
                <label className="label">Time *</label>
                <select value={bf.scheduled_time} onChange={(e) => setBf('scheduled_time', e.target.value)} className="input-field">
                  <option value="">Select</option>
                  {timeSlots.map((t) => {
                    const [h, m] = t.split(':');
                    const hour = parseInt(h);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const h12 = hour % 12 || 12;
                    return <option key={t} value={t}>{h12}:{m} {ampm}</option>;
                  })}
                </select>
              </div>
              <div className="col-span-2"><label className="label">Address *</label><input value={bf.location_address} onChange={(e) => setBf('location_address', e.target.value)} placeholder="123 Queen St W" className="input-field" /></div>
              <div><label className="label">City</label><input value={bf.location_city} onChange={(e) => setBf('location_city', e.target.value)} placeholder="Toronto" className="input-field" /></div>
              <div><label className="label">Province</label><input value={bf.location_province} onChange={(e) => setBf('location_province', e.target.value)} placeholder="ON" className="input-field" /></div>
              <div><label className="label">Postal Code</label><input value={bf.location_postal_code} onChange={(e) => setBf('location_postal_code', e.target.value)} placeholder="M5H 2N2" className="input-field" /></div>
              <div><label className="label">Notes</label><input value={bf.notes} onChange={(e) => setBf('notes', e.target.value)} placeholder="Optional notes" className="input-field" /></div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="btn-outline btn-sm">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary btn-sm flex items-center gap-2">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reference, name, or email..."
                className="input-field pl-10"
              />
            </div>
            <button type="submit" className="btn-primary btn-sm">Search</button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="input-field w-auto"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No bookings found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Reference</th>
                <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-600">Vehicle</th>
                <th className="px-4 py-3 font-medium text-gray-600">Services</th>
                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/admin/bookings/${b.id}`} className="font-medium text-brand-600 hover:underline">
                      {b.reference_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/customers/${b.customer_id}`} className="font-medium text-brand-600 hover:underline">{b.customer_name}</Link>
                    <div className="text-gray-400 text-xs">{b.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.vehicle_year} {b.vehicle_make} {b.vehicle_model}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                    {b.service_names}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {b.scheduled_date}<br />
                    <span className="text-xs text-gray-400">{b.scheduled_time}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-right font-medium">
                    {b.estimated_cost ? `$${b.estimated_cost.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-outline btn-sm">
            Previous
          </button>
          <span className="px-4 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={bookings.length < 20} className="btn-outline btn-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
