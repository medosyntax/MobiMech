import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import BookService from './pages/BookService';
import BookingConfirmation from './pages/BookingConfirmation';
import TrackBooking from './pages/TrackBooking';

// Admin pages
import AdminLogin from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Bookings from './pages/admin/Bookings';
import BookingDetail from './pages/admin/BookingDetail';
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Services from './pages/admin/Services';
import Invoices from './pages/admin/Invoices';
import InvoiceDetail from './pages/admin/InvoiceDetail';

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/book" element={<PublicLayout><BookService /></PublicLayout>} />
          <Route path="/booking-confirmation" element={<PublicLayout><BookingConfirmation /></PublicLayout>} />
          <Route path="/track" element={<PublicLayout><TrackBooking /></PublicLayout>} />

          {/* Admin login */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin protected routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="services" element={<Services />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
