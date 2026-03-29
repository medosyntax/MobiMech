import { Link } from 'react-router-dom';
import { Wrench, CalendarCheck, Search, Shield, Clock, MapPin, Star, ChevronRight } from 'lucide-react';

const features = [
  { icon: MapPin, title: 'We Come to You', desc: 'No need to visit a shop. Our mechanics arrive at your home, office, or roadside.' },
  { icon: Shield, title: 'Trusted Professionals', desc: 'All our mechanics are certified, background-checked, and fully insured.' },
  { icon: Clock, title: 'Flexible Scheduling', desc: 'Book online 24/7. Choose a time that works for your busy schedule.' },
  { icon: Star, title: 'Quality Guaranteed', desc: 'We stand behind every repair with our satisfaction guarantee.' },
];

const steps = [
  { num: '1', title: 'Book Online', desc: 'Choose your service, pick a date and time, and enter your vehicle details.' },
  { num: '2', title: 'We Confirm', desc: 'Our team reviews your booking and confirms the appointment.' },
  { num: '3', title: 'We Arrive', desc: 'Our certified mechanic arrives at your location, fully equipped.' },
  { num: '4', title: 'Get Rolling', desc: 'We complete the repair, you approve the work, and you\'re back on the road.' },
];

const serviceHighlights = [
  { name: 'Engine Repair', icon: '🔧' },
  { name: 'Brake Service', icon: '🛑' },
  { name: 'Oil Change', icon: '🛢️' },
  { name: 'Tire Service', icon: '🔄' },
  { name: 'Battery Replace', icon: '🔋' },
  { name: 'Diagnostics', icon: '📊' },
  { name: 'Emergency', icon: '🚨' },
  { name: 'Maintenance', icon: '✅' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Expert Auto Repair,{' '}
              <span className="text-brand-400">Delivered to You</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-300 leading-relaxed">
              MobiMech brings professional mobile mechanic services directly to your doorstep. 
              No towing, no waiting rooms — just quality repairs wherever you are.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/book" className="btn-primary text-center text-lg px-8 py-3">
                Book a Service
              </Link>
              <Link to="/track" className="btn-outline border-white text-white hover:bg-white/10 text-center text-lg px-8 py-3">
                Track Your Booking
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service highlights */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {serviceHighlights.map((s) => (
              <Link
                key={s.name}
                to="/book"
                className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors text-center group"
              >
                <span className="text-3xl mb-2">{s.icon}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-700">How It Works</h2>
            <p className="mt-4 text-gray-600 text-lg">Simple, transparent, and hassle-free</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-brand-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold text-lg text-navy-700 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block h-6 w-6 text-gray-300 mx-auto mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-700">Why Choose MobiMech?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="card text-center hover:shadow-md transition-shadow">
                <f.icon className="h-10 w-10 text-brand-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg text-navy-700 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white/90 text-lg mb-8">
            Schedule your service today and let our expert mechanics come to you.
          </p>
          <Link to="/book" className="btn-secondary text-lg px-10 py-3.5 inline-block">
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
