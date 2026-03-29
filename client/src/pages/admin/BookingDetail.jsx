import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, MapPin, Car, Clock, User, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';

const statusOptions = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [assignedMechanic, setAssignedMechanic] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [denying, setDenying] = useState(false);

  const fetchBooking = () => {
    setLoading(true);
    api.getBooking(id)
      .then((data) => {
        setBooking(data);
        setEditStatus(data.status);
        setAdminNotes(data.admin_notes || '');
        setAssignedMechanic(data.assigned_mechanic || '');
      })
      .catch((err) => {
        toast.error(err.message);
        navigate('/admin/bookings');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const updateBooking = async () => {
    setUpdating(true);
    try {
      await api.updateBooking(id, {
        status: editStatus,
        admin_notes: adminNotes,
        assigned_mechanic: assignedMechanic,
      });
      toast.success('Booking updated');
      fetchBooking();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const createInvoice = async () => {
    setCreatingInvoice(true);
    try {
      await api.createInvoice({ booking_id: parseInt(id) });
      toast.success('Invoice created and emailed to customer');
      fetchBooking();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const acceptBooking = async () => {
    setAccepting(true);
    try {
      await api.updateBooking(id, { status: 'confirmed', admin_notes: adminNotes, assigned_mechanic: assignedMechanic });
      // Auto-create invoice on accept
      try {
        await api.createInvoice({ booking_id: parseInt(id) });
        toast.success('Booking accepted and invoice created');
      } catch {
        toast.success('Booking accepted');
      }
      fetchBooking();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAccepting(false);
    }
  };

  const denyBooking = async () => {
    if (!confirm('Are you sure you want to deny this booking?')) return;
    setDenying(true);
    try {
      await api.updateBooking(id, { status: 'cancelled', admin_notes: adminNotes });
      toast.success('Booking denied');
      fetchBooking();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDenying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/bookings')} className="text-gray-500 hover:text-navy-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-700">{booking.reference_number}</h1>
          <p className="text-sm text-gray-500">Created {new Date(booking.created_at).toLocaleString()}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={booking.status} />
          {booking.status === 'pending' && (
            <>
              <button onClick={acceptBooking} disabled={accepting} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Accept
              </button>
              <button onClick={denyBooking} disabled={denying} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50">
                {denying ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Deny
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Vehicle */}
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Customer & Vehicle</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-brand-500 shrink-0" />
                <div>
                  <p className="font-medium">{booking.customer_name}</p>
                  <Link to={`/admin/customers/${booking.customer_id}`} className="text-brand-500 text-xs hover:underline">View profile</Link>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-brand-500 shrink-0" />
                <p>{booking.customer_email}</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-brand-500 shrink-0" />
                <p>{booking.customer_phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-brand-500 shrink-0" />
                <div>
                  <p className="font-medium">{booking.vehicle_year} {booking.vehicle_make} {booking.vehicle_model}</p>
                  {booking.vehicle_color && <p className="text-gray-400">{booking.vehicle_color}</p>}
                  {booking.vehicle_license_plate && <p className="text-gray-400">Plate: {booking.vehicle_license_plate}</p>}
                  {booking.vehicle_mileage && <p className="text-gray-400">{booking.vehicle_mileage.toLocaleString()} km</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Location */}
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Schedule & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-brand-500 shrink-0" />
                <div>
                  <p className="font-medium">{new Date(booking.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-gray-400">{booking.scheduled_time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-500 shrink-0" />
                <div>
                  <p className="font-medium">{booking.location_address}</p>
                  {booking.location_city && <p className="text-gray-400">{booking.location_city}, {booking.location_province} {booking.location_postal_code}</p>}
                </div>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-500 text-xs uppercase font-medium mb-1">Customer Notes</p>
                <p>{booking.notes}</p>
              </div>
            )}
            {booking.booking_type === 'diagnostic' && booking.diagnostic_notes && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm">
                <p className="text-purple-600 text-xs uppercase font-medium mb-1">Diagnostic Issue Description</p>
                <p>{booking.diagnostic_notes}</p>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">
              {booking.booking_type === 'diagnostic' ? 'Diagnostic Booking' : 'Services'}
            </h2>
            {booking.booking_type === 'diagnostic' && booking.services.length === 0 ? (
              <div className="p-4 bg-purple-50 rounded-lg text-sm">
                <p className="font-medium text-purple-700">Vehicle Diagnostic — $95.00</p>
                <p className="text-purple-600 mt-1">Our mechanic will inspect the vehicle and diagnose the issue on-site.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {booking.services.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-gray-400 ml-2">({s.category})</span>
                    </div>
                    <span className="font-medium">${s.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Estimated Total</span>
                  <span className="text-brand-600">${booking.estimated_cost?.toFixed(2) || 'TBD'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Invoice */}
          {booking.invoice ? (
            <div className="card">
              <h2 className="font-semibold text-navy-700 mb-4">Invoice</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Invoice #</p><p className="font-medium">{booking.invoice.invoice_number}</p></div>
                <div><p className="text-gray-500">Status</p><StatusBadge status={booking.invoice.status} /></div>
                <div><p className="text-gray-500">Subtotal</p><p className="font-medium">${booking.invoice.subtotal.toFixed(2)}</p></div>
                <div><p className="text-gray-500">Tax</p><p className="font-medium">${booking.invoice.tax_amount.toFixed(2)}</p></div>
                <div><p className="text-gray-500">Total</p><p className="font-bold text-lg text-brand-600">${booking.invoice.total.toFixed(2)}</p></div>
                {booking.invoice.due_date && <div><p className="text-gray-500">Due Date</p><p className="font-medium">{booking.invoice.due_date}</p></div>}
              </div>
            </div>
          ) : (
            ['confirmed', 'in-progress', 'completed'].includes(booking.status) && (
              <div className="card text-center py-6">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No invoice generated yet</p>
                <button onClick={createInvoice} disabled={creatingInvoice} className="btn-primary btn-sm inline-flex items-center gap-2">
                  {creatingInvoice && <Loader2 className="h-4 w-4 animate-spin" />}
                  Generate Invoice
                </button>
              </div>
            )
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Update Booking</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input-field">
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Assigned Mechanic</label>
                <input value={assignedMechanic} onChange={(e) => setAssignedMechanic(e.target.value)} placeholder="Mechanic name" className="input-field" />
              </div>
              <div>
                <label className="label">Admin Notes</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="input-field" placeholder="Internal notes..." />
              </div>
              <button onClick={updateBooking} disabled={updating} className="btn-primary w-full flex items-center justify-center gap-2">
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h2 className="font-semibold text-navy-700 mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-gray-400">{new Date(booking.created_at).toLocaleString()}</p>
                </div>
              </div>
              {booking.started_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="font-medium">Work Started</p>
                    <p className="text-gray-400">{new Date(booking.started_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {booking.completed_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="font-medium">Completed</p>
                    <p className="text-gray-400">{new Date(booking.completed_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {booking.notifications?.map((n, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="font-medium">{n.type.replace(/_/g, ' ')}</p>
                    <p className="text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
