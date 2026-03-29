import { Wrench, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy-700 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-6 w-6 text-brand-400" />
              <span className="text-brand-400 font-bold text-xl">MOBIMECH</span>
            </div>
            <p className="text-sm text-gray-400">
              Professional mobile mechanic services delivered to your doorstep. 
              Quality repairs, honest pricing, and exceptional service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Home</Link></li>
              <li><Link to="/book" className="hover:text-brand-400 transition-colors">Book a Service</Link></li>
              <li><Link to="/track" className="hover:text-brand-400 transition-colors">Track Booking</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-400" />
                (555) 987-6543
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400" />
                info@mobimech.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-400" />
                Based out of Calgary, Alberta
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-600 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} MobiMech Mobile Mechanics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
