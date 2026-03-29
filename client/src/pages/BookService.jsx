import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import toast from 'react-hot-toast';
import { CheckCircle, Loader2, Search, Stethoscope, Wrench } from 'lucide-react';

export default function BookService() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [step, setStep] = useState(0); // 0 = choose type, 1 = services, 2 = vehicle, 3 = contact, 4 = schedule
  const [bookingType, setBookingType] = useState(''); // 'service' or 'diagnostic'
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    vehicle_make: '', vehicle_model: '', vehicle_year: '', vehicle_color: '', vehicle_license_plate: '', vehicle_mileage: '',
    scheduled_date: '', scheduled_time: '',
    location_address: '', location_city: '', location_province: '', location_postal_code: '',
    notes: '', diagnostic_notes: '',
  });

  useEffect(() => {
    api.getServiceCategories().then(setCategories).catch(() => {});
    api.getServices().then(setServices).catch(() => {});
  }, []);

  const filteredServices = services.filter((s) => {
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedTotal = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.base_price, 0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isDiagnostic = bookingType === 'diagnostic';

  const canProceed = () => {
    if (step === 0) return !!bookingType;
    if (step === 1) {
      if (isDiagnostic) return form.diagnostic_notes.trim().length > 0;
      return selectedServices.length > 0;
    }
    if (step === 2) return form.vehicle_make && form.vehicle_model && form.vehicle_year;
    if (step === 3) return form.customer_name && form.customer_email && form.customer_phone;
    if (step === 4) return form.scheduled_date && form.scheduled_time && form.location_address;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        booking_type: bookingType,
      };
      if (!isDiagnostic) {
        payload.service_ids = selectedServices;
      }
      const result = await api.createBooking(payload);
      navigate('/booking-confirmation', { state: { booking: result } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const chooseType = (type) => {
    setBookingType(type);
    setStep(1);
  };

  // min date is today
  const today = new Date().toISOString().split('T')[0];

  const timeSlots = [];
  for (let h = 8; h <= 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
  }

  const stepLabels = isDiagnostic
    ? ['Booking Type', 'Describe Issue', 'Vehicle Info', 'Your Details', 'Schedule & Location']
    : ['Booking Type', 'Select Services', 'Vehicle Info', 'Your Details', 'Schedule & Location'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy-700 text-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Book a Service</h1>
          <p className="mt-2 text-gray-300">Schedule your mobile mechanic service in a few simple steps.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i ? 'bg-green-500 text-white' :
                step === i ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i ? <CheckCircle className="h-5 w-5" /> : i + 1}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${step === i ? 'font-semibold text-navy-700' : 'text-gray-500'}`}>
                {label}
              </span>
              {i < 4 && <div className={`hidden sm:block w-8 lg:w-14 h-0.5 mx-2 ${step > i ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Choose Booking Type */}
        {step === 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-navy-700 mb-6 text-center">What type of booking do you need?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => chooseType('service')}
                className={`card text-left transition-all hover:shadow-md p-6 ${bookingType === 'service' ? 'ring-2 ring-brand-500 bg-brand-50' : ''}`}
              >
                <Wrench className="h-10 w-10 text-brand-500 mb-3" />
                <h3 className="text-lg font-bold text-navy-700">Service Booking</h3>
                <p className="text-sm text-gray-500 mt-2">I know what service(s) I need. Choose from our list of available services.</p>
              </button>
              <button
                onClick={() => chooseType('diagnostic')}
                className={`card text-left transition-all hover:shadow-md p-6 ${bookingType === 'diagnostic' ? 'ring-2 ring-brand-500 bg-brand-50' : ''}`}
              >
                <Stethoscope className="h-10 w-10 text-purple-500 mb-3" />
                <h3 className="text-lg font-bold text-navy-700">Diagnostic Booking</h3>
                <p className="text-sm text-gray-500 mt-2">I'm not sure what's wrong with my car. Book a diagnostic and our mechanic will find out.</p>
                <p className="text-xs text-brand-600 font-medium mt-2">Diagnostic fee: $95</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Services or Diagnostic Notes */}
        {step === 1 && !isDiagnostic && (
          <div>
            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a service..."
                className="input-field pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredServices.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`card text-left transition-all ${
                    selectedServices.includes(s.id)
                      ? 'ring-2 ring-brand-500 bg-brand-50'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-navy-700">{s.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{s.description}</p>
                      <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded mt-2 inline-block">{s.category}</span>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <div className="text-lg font-bold text-brand-600">${s.base_price}</div>
                      <div className="text-xs text-gray-400">{s.duration_minutes} min</div>
                    </div>
                  </div>
                </button>
              ))}
              {filteredServices.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">No services match your search.</div>
              )}
            </div>

            {selectedServices.length > 0 && (
              <div className="mt-6 p-4 bg-brand-50 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-semibold text-navy-700">{selectedServices.length} service(s) selected</span>
                  <span className="text-brand-600 font-bold text-lg ml-3">${selectedTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && isDiagnostic && (
          <div className="card max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Stethoscope className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold text-navy-700">Describe the Issue</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Tell us what's happening with your vehicle. Our mechanic will diagnose the problem on-site.</p>
            <textarea
              name="diagnostic_notes"
              value={form.diagnostic_notes}
              onChange={handleChange}
              rows={5}
              placeholder="e.g. Car makes a grinding noise when braking, engine light is on, car won't start..."
              className="input-field"
            />
            <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
              <strong>Diagnostic Fee: $95</strong> — Our mechanic will inspect your vehicle and provide a detailed report of the issue and recommended repairs.
            </div>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-navy-700 mb-6">Vehicle Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Make *</label>
                <input name="vehicle_make" value={form.vehicle_make} onChange={handleChange} placeholder="e.g. Toyota" className="input-field" />
              </div>
              <div>
                <label className="label">Model *</label>
                <input name="vehicle_model" value={form.vehicle_model} onChange={handleChange} placeholder="e.g. Camry" className="input-field" />
              </div>
              <div>
                <label className="label">Year *</label>
                <input name="vehicle_year" type="number" min="1900" max="2030" value={form.vehicle_year} onChange={handleChange} placeholder="e.g. 2022" className="input-field" />
              </div>
              <div>
                <label className="label">Color</label>
                <input name="vehicle_color" value={form.vehicle_color} onChange={handleChange} placeholder="e.g. Silver" className="input-field" />
              </div>
              <div>
                <label className="label">License Plate</label>
                <input name="vehicle_license_plate" value={form.vehicle_license_plate} onChange={handleChange} placeholder="e.g. ABCD 123" className="input-field" />
              </div>
              <div>
                <label className="label">Mileage</label>
                <input name="vehicle_mileage" type="number" value={form.vehicle_mileage} onChange={handleChange} placeholder="e.g. 45000" className="input-field" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-navy-700 mb-6">Your Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full Name *</label>
                <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="John Smith" className="input-field" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange} placeholder="john@example.com" className="input-field" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input name="customer_phone" type="tel" value={form.customer_phone} onChange={handleChange} placeholder="(416) 123-4567" className="input-field" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Schedule & Location */}
        {step === 4 && (
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-navy-700 mb-6">Schedule & Service Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Preferred Date *</label>
                <input name="scheduled_date" type="date" min={today} value={form.scheduled_date} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">Preferred Time *</label>
                <select name="scheduled_time" value={form.scheduled_time} onChange={handleChange} className="input-field">
                  <option value="">Select a time</option>
                  {timeSlots.map((t) => {
                    const [h, m] = t.split(':');
                    const hour = parseInt(h);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const h12 = hour % 12 || 12;
                    return <option key={t} value={t}>{h12}:{m} {ampm}</option>;
                  })}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Service Address *</label>
                <input name="location_address" value={form.location_address} onChange={handleChange} placeholder="123 Queen Street West" className="input-field" />
              </div>
              <div>
                <label className="label">City</label>
                <input name="location_city" value={form.location_city} onChange={handleChange} placeholder="Toronto" className="input-field" />
              </div>
              <div>
                <label className="label">Province</label>
                <input name="location_province" value={form.location_province} onChange={handleChange} placeholder="ON" className="input-field" />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input name="location_postal_code" value={form.location_postal_code} onChange={handleChange} placeholder="M5H 2N2" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Additional Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                  placeholder="Any special instructions, gate codes, or details about the issue..."
                  className="input-field" />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-navy-700 mb-3">Booking Summary</h3>
              <div className="space-y-1 text-sm">
                {isDiagnostic ? (
                  <div className="flex justify-between">
                    <span>Vehicle Diagnostic</span>
                    <span className="font-medium">$95.00</span>
                  </div>
                ) : (
                  services.filter((s) => selectedServices.includes(s.id)).map((s) => (
                    <div key={s.id} className="flex justify-between">
                      <span>{s.name}</span>
                      <span className="font-medium">${s.base_price.toFixed(2)}</span>
                    </div>
                  ))
                )}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Estimated Total</span>
                  <span className="text-brand-600">${isDiagnostic ? '95.00' : selectedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-outline">Back</button>
          ) : <div />}
          {step === 0 ? <div /> : step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="btn-primary">
              Continue
            </button>
          ) : (
            <button onClick={submit} disabled={!canProceed() || submitting} className="btn-primary flex items-center gap-2">
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
