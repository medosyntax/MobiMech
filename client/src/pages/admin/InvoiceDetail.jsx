import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, Pencil, Loader2, X, Plus, Trash2 } from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editExtras, setEditExtras] = useState([]);

  const fetchInvoice = () => {
    setLoading(true);
    api.getInvoice(id)
      .then((data) => {
        setInvoice(data);
        setEditNotes(data.notes || '');
        setEditDueDate(data.due_date || '');
        setEditExtras(data.extra_charges || []);
      })
      .catch((err) => {
        toast.error(err.message);
        navigate('/admin/invoices');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handlePrint = () => {
    const printContent = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #fff; }
          .invoice-page { max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1a1a2e; }
          .brand h1 { font-size: 28px; color: #1a1a2e; letter-spacing: 2px; }
          .brand p { color: #666; font-size: 13px; margin-top: 4px; }
          .invoice-meta { text-align: right; }
          .invoice-meta h2 { font-size: 22px; color: #1a1a2e; margin-bottom: 8px; }
          .invoice-meta p { font-size: 13px; color: #666; margin: 2px 0; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .parties .col { flex: 1; }
          .parties .col h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
          .parties .col p { font-size: 13px; margin: 2px 0; }
          .parties .col .name { font-weight: 600; font-size: 15px; }
          .vehicle-info { background: #f8f9fa; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
          .vehicle-info h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
          .vehicle-info .row { display: flex; gap: 24px; font-size: 13px; }
          .vehicle-info .row span { color: #666; }
          .vehicle-info .row strong { color: #1a1a2e; }
          .job-info { display: flex; gap: 24px; margin-bottom: 24px; padding: 12px 16px; background: #eef2ff; border-radius: 6px; font-size: 13px; }
          .job-info div span { color: #666; }
          .job-info div strong { color: #1a1a2e; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          thead th { background: #1a1a2e; color: #fff; padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          thead th:last-child { text-align: right; }
          tbody td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 13px; }
          tbody td:last-child { text-align: right; font-weight: 500; }
          tbody tr.extra td { color: #6366f1; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals table { width: 280px; }
          .totals td { padding: 6px 16px; font-size: 13px; border: none; }
          .totals tr.total td { font-size: 18px; font-weight: 700; border-top: 2px solid #1a1a2e; padding-top: 10px; }
          .totals .label { text-align: left; color: #666; }
          .totals .value { text-align: right; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-unpaid { background: #fef3c7; color: #92400e; }
          .notes { background: #f8f9fa; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
          .notes h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
          .notes p { font-size: 13px; color: #444; }
          .footer { text-align: center; padding-top: 30px; border-top: 1px solid #eee; }
          .footer p { font-size: 12px; color: #999; margin: 2px 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .invoice-page { padding: 20px; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const addExtraCharge = () => {
    setEditExtras([...editExtras, { description: '', amount: '' }]);
  };

  const updateExtra = (index, field, value) => {
    const updated = [...editExtras];
    updated[index] = { ...updated[index], [field]: value };
    setEditExtras(updated);
  };

  const removeExtra = (index) => {
    setEditExtras(editExtras.filter((_, i) => i !== index));
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      const cleanExtras = editExtras
        .filter((e) => e.description.trim())
        .map((e) => ({ description: e.description.trim(), amount: parseFloat(e.amount) || 0 }));
      await api.updateInvoice(id, {
        notes: editNotes,
        due_date: editDueDate,
        extra_charges: cleanExtras,
      });
      toast.success('Invoice updated');
      setEditing(false);
      fetchInvoice();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    try {
      await api.updateInvoice(id, { status: 'paid' });
      toast.success('Invoice marked as paid');
      fetchInvoice();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!invoice) return null;

  const extraCharges = invoice.extra_charges || [];
  const serviceSubtotal = invoice.services.reduce((sum, s) => sum + s.price, 0)
    || (invoice.booking_type === 'diagnostic' ? (invoice.subtotal - extraCharges.reduce((s, e) => s + e.amount, 0)) : 0);

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/invoices')} className="text-gray-500 hover:text-navy-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-700">{invoice.invoice_number}</h1>
          <p className="text-sm text-gray-500">Booking {invoice.reference_number}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge status={invoice.status} />
          {invoice.status === 'unpaid' && (
            <button onClick={markPaid} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              Mark Paid
            </button>
          )}
          <button onClick={() => { setEditNotes(invoice.notes || ''); setEditDueDate(invoice.due_date || ''); setEditExtras(invoice.extra_charges || []); setEditing(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 text-sm font-medium">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Printable invoice */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div ref={printRef}>
          <div className="invoice-page" style={{ maxWidth: 800, margin: '0 auto', padding: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, paddingBottom: 20, borderBottom: '3px solid #1a1a2e' }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2 }}>ZONGEDO</h1>
                <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>Mobile Mechanic Services</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: 22, color: '#1a1a2e', marginBottom: 8, fontWeight: 700 }}>INVOICE</h2>
                <p style={{ fontSize: 13, color: '#666', margin: '2px 0' }}><strong>{invoice.invoice_number}</strong></p>
                <p style={{ fontSize: 13, color: '#666', margin: '2px 0' }}>Date: {new Date(invoice.created_at).toLocaleDateString('en-CA')}</p>
                <p style={{ fontSize: 13, color: '#666', margin: '2px 0' }}>Due: {invoice.due_date || 'N/A'}</p>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', background: invoice.status === 'paid' ? '#dcfce7' : '#fef3c7', color: invoice.status === 'paid' ? '#166534' : '#92400e', marginTop: 6 }}>
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Bill To + Service Location */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 8 }}>Bill To</h3>
                <p style={{ fontWeight: 600, fontSize: 15, margin: '2px 0' }}>{invoice.customer_name}</p>
                <p style={{ fontSize: 13, margin: '2px 0', color: '#444' }}>{invoice.customer_email}</p>
                <p style={{ fontSize: 13, margin: '2px 0', color: '#444' }}>{invoice.customer_phone}</p>
                {invoice.customer_address && <p style={{ fontSize: 13, margin: '2px 0', color: '#444' }}>{invoice.customer_address}</p>}
                {invoice.customer_city && <p style={{ fontSize: 13, margin: '2px 0', color: '#444' }}>{invoice.customer_city}, {invoice.customer_province} {invoice.customer_postal_code}</p>}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 8 }}>Service Location</h3>
                <p style={{ fontSize: 13, margin: '2px 0', color: '#444' }}>{invoice.location_address}</p>
                {invoice.location_city && <p style={{ fontSize: 13, margin: '2px 0', color: '#444' }}>{invoice.location_city}, {invoice.location_province} {invoice.location_postal_code}</p>}
              </div>
            </div>

            {/* Vehicle */}
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 6, marginBottom: 24 }}>
              <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 8 }}>Vehicle</h3>
              <div style={{ display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
                <div><span style={{ color: '#666' }}>Year/Make/Model: </span><strong>{invoice.vehicle_year} {invoice.vehicle_make} {invoice.vehicle_model}</strong></div>
                {invoice.vehicle_color && <div><span style={{ color: '#666' }}>Color: </span><strong>{invoice.vehicle_color}</strong></div>}
                {invoice.vehicle_license_plate && <div><span style={{ color: '#666' }}>Plate: </span><strong>{invoice.vehicle_license_plate}</strong></div>}
                {invoice.vehicle_mileage && <div><span style={{ color: '#666' }}>Mileage: </span><strong>{invoice.vehicle_mileage.toLocaleString()} km</strong></div>}
              </div>
            </div>

            {/* Job details */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, padding: '12px 16px', background: '#eef2ff', borderRadius: 6, fontSize: 13, flexWrap: 'wrap' }}>
              <div><span style={{ color: '#666' }}>Booking: </span><strong>{invoice.reference_number}</strong></div>
              <div><span style={{ color: '#666' }}>Type: </span><strong style={{ textTransform: 'capitalize' }}>{invoice.booking_type || 'Service'}</strong></div>
              {invoice.assigned_mechanic && <div><span style={{ color: '#666' }}>Mechanic: </span><strong>{invoice.assigned_mechanic}</strong></div>}
              {invoice.scheduled_date && <div><span style={{ color: '#666' }}>Service Date: </span><strong>{new Date(invoice.scheduled_date + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>}
              {invoice.time_taken && <div><span style={{ color: '#666' }}>Time Taken: </span><strong>{invoice.time_taken}</strong></div>}
            </div>

            {/* Line items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr>
                  <th style={{ background: '#1a1a2e', color: '#fff', padding: '10px 16px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>#</th>
                  <th style={{ background: '#1a1a2e', color: '#fff', padding: '10px 16px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</th>
                  <th style={{ background: '#1a1a2e', color: '#fff', padding: '10px 16px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</th>
                  <th style={{ background: '#1a1a2e', color: '#fff', padding: '10px 16px', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.services.length > 0 ? (
                  invoice.services.map((s, i) => (
                    <tr key={i}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13 }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13 }}>{s.name}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, color: '#666' }}>{s.category}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, textAlign: 'right', fontWeight: 500 }}>${s.price.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13 }}>1</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13 }}>Vehicle Diagnostic</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, color: '#666' }}>Diagnostic</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, textAlign: 'right', fontWeight: 500 }}>${(invoice.booking_type === 'diagnostic' ? serviceSubtotal : 0).toFixed(2)}</td>
                  </tr>
                )}
                {extraCharges.map((e, i) => (
                  <tr key={`extra-${i}`}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, color: '#6366f1' }}>{(invoice.services.length || 1) + i + 1}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, color: '#6366f1' }}>{e.description}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, color: '#6366f1' }}>Additional</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', fontSize: 13, textAlign: 'right', fontWeight: 500, color: '#6366f1' }}>${(parseFloat(e.amount) || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 30 }}>
              <table style={{ width: 280, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'left', color: '#666' }}>Subtotal</td>
                    <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'right' }}>${invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'left', color: '#666' }}>HST ({(invoice.tax_rate * 100).toFixed(0)}%)</td>
                    <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'right' }}>${invoice.tax_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 16px', fontSize: 18, fontWeight: 700, textAlign: 'left', borderTop: '2px solid #1a1a2e' }}>Total</td>
                    <td style={{ padding: '10px 16px', fontSize: 18, fontWeight: 700, textAlign: 'right', borderTop: '2px solid #1a1a2e' }}>${invoice.total.toFixed(2)}</td>
                  </tr>
                  {invoice.paid_date && (
                    <tr>
                      <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'left', color: '#166534' }}>Paid</td>
                      <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'right', color: '#166534' }}>{invoice.paid_date}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 6, marginBottom: 24 }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 8 }}>Notes</h3>
                <p style={{ fontSize: 13, color: '#444', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
              </div>
            )}

            {/* Diagnostic notes */}
            {invoice.diagnostic_notes && (
              <div style={{ background: '#faf5ff', padding: 16, borderRadius: 6, marginBottom: 24 }}>
                <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 8 }}>Diagnostic Notes</h3>
                <p style={{ fontSize: 13, color: '#444', whiteSpace: 'pre-wrap' }}>{invoice.diagnostic_notes}</p>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: 30, borderTop: '1px solid #eee' }}>
              <p style={{ fontSize: 12, color: '#999', margin: '2px 0' }}>Zongedo – Mobile Mechanic Services</p>
              <p style={{ fontSize: 12, color: '#999', margin: '2px 0' }}>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-navy-700">Edit Invoice</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Due Date</label>
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="input-field" placeholder="Invoice notes..." />
              </div>

              {/* Extra charges */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Extra Charges</label>
                  <button onClick={addExtraCharge} className="text-brand-600 hover:text-brand-700 text-xs font-medium inline-flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Charge
                  </button>
                </div>
                {editExtras.length === 0 && (
                  <p className="text-sm text-gray-400">No extra charges. Click "Add Charge" to add one.</p>
                )}
                <div className="space-y-2">
                  {editExtras.map((extra, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input
                        value={extra.description}
                        onChange={(e) => updateExtra(i, 'description', e.target.value)}
                        placeholder="Description (e.g. Brake fluid)"
                        className="input-field flex-1"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={extra.amount}
                          onChange={(e) => updateExtra(i, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="input-field pl-7"
                        />
                      </div>
                      <button onClick={() => removeExtra(i)} className="text-red-400 hover:text-red-600 mt-2.5">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setEditing(false)} className="btn-outline btn-sm">Cancel</button>
              <button onClick={saveEdits} disabled={saving} className="btn-primary btn-sm inline-flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
