import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { Search, FileText } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = () => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search) params.search = search;
    api.getInvoices(params)
      .then((data) => { setInvoices(data.invoices); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoices(); }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const markPaid = async (id) => {
    try {
      await api.updateInvoice(id, { status: 'paid' });
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-700">Invoices</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="input-field pl-10" />
            </div>
            <button type="submit" className="btn-primary btn-sm">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto">
            <option value="all">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div></div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-12 text-gray-500"><FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />No invoices found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">Invoice #</th>
                <th className="px-4 py-3 font-medium text-gray-600">Booking</th>
                <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-600">Work Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Subtotal</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Tax</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
                <th className="px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Payment</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/admin/invoices/${inv.id}`} className="text-brand-600 hover:underline">{inv.invoice_number}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/admin/bookings/${inv.booking_id}`} className="text-brand-600 hover:underline">{inv.reference_number}</a>
                  </td>
                  <td className="px-4 py-3">{inv.customer_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.booking_status} /></td>
                  <td className="px-4 py-3 text-right">${inv.subtotal.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">${inv.tax_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.due_date}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link to={`/admin/invoices/${inv.id}`} className="text-brand-600 hover:text-brand-800 text-xs font-medium">
                      View
                    </Link>
                    {inv.status === 'unpaid' && (
                      <button onClick={() => markPaid(inv.id)} className="text-green-600 hover:text-green-800 text-xs font-medium">
                        Mark Paid
                      </button>
                    )}
                  </td>
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
          <button onClick={() => setPage(page + 1)} disabled={invoices.length < 25} className="btn-outline btn-sm">Next</button>
        </div>
      )}
    </div>
  );
}
