import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return <Navigate to="/book" replace />;
  }

  const { booking: b, customer: c, vehicle: v } = booking;

  const copyRef = () => {
    navigator.clipboard.writeText(b.reference_number);
    toast.success('Reference number copied!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="card text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-navy-700 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you, {c.name}. Your booking has been submitted successfully.
          </p>

          {/* Reference */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-1">Your Reference Number</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-brand-600 tracking-wider">{b.reference_number}</span>
              <button onClick={copyRef} className="text-gray-400 hover:text-brand-500" title="Copy">
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Save this number to track your booking status
            </p>
          </div>

          {/* Details */}
          <div className="text-left space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{new Date(b.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium">
                  {(() => {
                    const [h, m] = b.scheduled_time.split(':');
                    const hour = parseInt(h);
                    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Vehicle</p>
                <p className="font-medium">{v.year} {v.make} {v.model}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span className="badge bg-yellow-100 text-yellow-800">Pending</span>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Location</p>
                <p className="font-medium">{b.location_address}{b.location_city ? `, ${b.location_city}` : ''}</p>
              </div>
              {b.estimated_cost && (
                <div className="col-span-2">
                  <p className="text-gray-500">Estimated Cost</p>
                  <p className="font-bold text-lg text-brand-600">${b.estimated_cost.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            A confirmation email has been sent to <strong>{c.email}</strong>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/track" className="btn-primary">Track Your Booking</Link>
            <Link to="/" className="btn-outline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
