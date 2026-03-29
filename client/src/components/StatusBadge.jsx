export default function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    unpaid: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    'in-progress': 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    unpaid: 'Unpaid',
    paid: 'Paid',
    overdue: 'Overdue',
  };

  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}
