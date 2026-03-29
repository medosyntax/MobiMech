import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Search, Users, Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '', city: '', province: '', postal_code: '', notes: '' });

  const fetchCustomers = () => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (search) params.search = search;
    api.getCustomers(params)
      .then((data) => { setCustomers(data.customers); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      toast.error('Name, email, and phone are required');
      return;
    }
    setAdding(true);
    try {
      await api.createCustomer(newCustomer);
      toast.success('Customer created');
      setShowAdd(false);
      setNewCustomer({ name: '', email: '', phone: '', address: '', city: '', province: '', postal_code: '', notes: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Customers</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{total} total</span>
          <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy-700">Add Customer</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Name *</label>
                <input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Full name" className="input-field" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="email@example.com" className="input-field" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input type="tel" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} placeholder="(416) 123-4567" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} placeholder="123 Queen St W" className="input-field" />
              </div>
              <div>
                <label className="label">City</label>
                <input value={newCustomer.city} onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })} placeholder="Toronto" className="input-field" />
              </div>
              <div>
                <label className="label">Province</label>
                <input value={newCustomer.province} onChange={(e) => setNewCustomer({ ...newCustomer, province: e.target.value })} placeholder="ON" className="input-field" />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input value={newCustomer.postal_code} onChange={(e) => setNewCustomer({ ...newCustomer, postal_code: e.target.value })} placeholder="M5H 2N2" className="input-field" />
              </div>
              <div>
                <label className="label">Notes</label>
                <input value={newCustomer.notes} onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })} placeholder="Optional notes" className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="btn-outline btn-sm">Cancel</button>
              <button onClick={handleAddCustomer} disabled={adding} className="btn-primary btn-sm flex items-center gap-2">
                {adding && <Loader2 className="h-4 w-4 animate-spin" />} Create Customer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary btn-sm">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div></div>
      ) : customers.length === 0 ? (
        <div className="card text-center py-12 text-gray-500"><Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />No customers found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="px-4 py-3 font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/admin/customers/${c.id}`} className="font-medium text-brand-600 hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{c.city}{c.province ? `, ${c.province}` : ''}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 25 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-outline btn-sm">Previous</button>
          <span className="px-4 py-1.5 text-sm text-gray-600">Page {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={customers.length < 25} className="btn-outline btn-sm">Next</button>
        </div>
      )}
    </div>
  );
}
