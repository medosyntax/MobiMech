import { useState } from 'react';
import { api } from '../api';
import { Search, Loader2, MapPin, Calendar, Clock, Car, DollarSign } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

export default function TrackBooking() {
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const track = async (e) => {
    e.preventDefault();
    if (!ref || !email) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.trackBooking(ref, email);
      setBooking(data);
    } catch (err) {
      setBooking(null);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['pending', 'confirmed', 'in-progress', 'completed'];
  const stepLabels = ['Booking Request Sent', 'Booking Request Accepted', 'Coming Today', 'Booking Completed'];
  const currentIdx = booking ? statusSteps.indexOf(booking.status) : -1;

  // Check if scheduled date is today for the "Coming Today" step
  const isToday = booking && booking.scheduled_date
    ? new Date(booking.scheduled_date + 'T00:00:00').toDateString() === new Date().toDateString()
    : false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-700 text-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Track Your Booking</h1>
          <p className="mt-2 text-gray-300">Enter your reference number and email to check the status.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={track} className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Reference Number</label>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="ZNG-20260328-001"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" disabled={loading || !ref || !email} className="btn-primary mt-4 w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            {loading ? 'Searching...' : 'Track Booking'}
          </button>
        </form>

        {/* Results */}
        {booking && (
          <div className="mt-8 space-y-6">
            {/* Status timeline */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-navy-700">{booking.reference_number}</h2>
                <StatusBadge status={booking.status} />
              </div>

              {booking.status !== 'cancelled' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {statusSteps.map((s, i) => {
                      // For step 2 (Coming Today), only mark active if it's actually today or past that step
                      const isStepActive = i <= currentIdx && (i !== 2 || isToday || currentIdx > 2);
                      const isStepDone = i < currentIdx || (i === currentIdx && i === 3);
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isStepActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {isStepActive ? '✓' : i + 1}
                          </div>
                          {i < statusSteps.length - 1 && (
                            <div className={`flex-1 h-1 mx-1 rounded ${isStepActive && (i !== 1 || isToday || currentIdx > 2) ? 'bg-green-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2">
                    {stepLabels.map((label, i) => (
                      <span key={i} className={`text-xs text-center flex-1 ${
                        i <= currentIdx ? 'text-green-600 font-medium' : 'text-gray-400'
                      }`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{new Date(booking.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Time</p>
                    <p className="font-medium">
                      {(() => {
                        const [h, m] = booking.scheduled_time.split(':');
                        const hour = parseInt(h);
                        return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                      })()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Vehicle</p>
                    <p className="font-medium">{booking.vehicle}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">{booking.location_address}{booking.location_city ? `, ${booking.location_city}` : ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="card">
              <h3 className="font-semibold text-navy-700 mb-3">Services</h3>
              <div className="space-y-2">
                {booking.services.map((s, i) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
                    <span>{s.name} <span className="text-gray-400">({s.category})</span></span>
                    <span className="font-medium">${s.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Estimated Total</span>
                  <span className="text-brand-600">${booking.estimated_cost?.toFixed(2) || 'TBD'}</span>
                </div>
              </div>
            </div>

            {/* Invoice */}
            {booking.invoice && (
              <div className="card">
                <h3 className="font-semibold text-navy-700 mb-3">Invoice</h3>
                <div className="flex justify-between text-sm">
                  <span>Invoice #</span>
                  <span className="font-medium">{booking.invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Total</span>
                  <span className="font-bold text-lg">${booking.invoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Status</span>
                  <StatusBadge status={booking.invoice.status} />
                </div>
              </div>
            )}
          </div>
        )}

        {searched && !booking && !loading && (
          <div className="mt-8 card text-center py-10">
            <p className="text-gray-500 text-lg">No booking found</p>
            <p className="text-gray-400 text-sm mt-1">Please check your reference number and email address.</p>
          </div>
        )}
      </div>
    </div>
  );
}
