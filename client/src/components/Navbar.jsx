import { Link, useLocation } from 'react-router-dom';
import { Wrench, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/book', label: 'Book Service' },
    { to: '/track', label: 'Track Booking' },
  ];

  return (
    <nav className="bg-navy-700 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Wrench className="h-6 w-6 text-brand-400" />
            <span className="text-brand-400">ZONGEDO</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to) ? 'bg-brand-500 text-white' : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin/login"
              className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-navy-800 border-t border-navy-600">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.to) ? 'bg-brand-500 text-white' : 'text-gray-300 hover:bg-navy-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin/login"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
