const nodemailer = require('nodemailer');

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

let transporter = null;

if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const fromAddress = `"${process.env.EMAIL_FROM_NAME || 'MobiMech Mobile Mechanics'}" <${process.env.EMAIL_FROM || 'noreply@mobimech.com'}>`;

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

async function sendEmail(to, subject, html) {
  if (!EMAIL_ENABLED) {
    console.log(`📧 [Email Preview] To: ${to} | Subject: ${subject}`);
    console.log(`   Body preview: ${html.replace(/<[^>]*>/g, '').substring(0, 120)}...`);
    return { preview: true };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`📧 Email failed to ${to}:`, err.message);
    throw err;
  }
}

async function sendBookingConfirmation(booking, customer, vehicle, services) {
  const serviceList = services
    .map((s) => `<li>${s.name} – $${s.price.toFixed(2)}</li>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a2744; padding: 24px; text-align: center;">
        <h1 style="color: #f97316; margin: 0; font-size: 28px;">MOBIMECH</h1>
        <p style="color: #94a3b8; margin: 4px 0 0;">Mobile Mechanic Services</p>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1a2744;">Booking Confirmed! ✅</h2>
        <p>Hi ${customer.name},</p>
        <p>Your booking has been received. Here are the details:</p>

        <div style="background: #f8fafc; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reference:</strong> ${booking.reference_number}</p>
          <p style="margin: 8px 0 0;"><strong>Date:</strong> ${formatDate(booking.scheduled_date)}</p>
          <p style="margin: 8px 0 0;"><strong>Time:</strong> ${formatTime(booking.scheduled_time)}</p>
          <p style="margin: 8px 0 0;"><strong>Location:</strong> ${booking.location_address}${booking.location_city ? ', ' + booking.location_city : ''}</p>
        </div>

        <h3 style="color: #1a2744;">Vehicle</h3>
        <p>${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.color ? ' (' + vehicle.color + ')' : ''}</p>

        <h3 style="color: #1a2744;">Services</h3>
        <ul>${serviceList}</ul>

        ${booking.estimated_cost ? `<p style="font-size: 18px;"><strong>Estimated Total: $${booking.estimated_cost.toFixed(2)}</strong></p>` : ''}

        <p style="color: #64748b; font-size: 14px;">We'll confirm your appointment shortly. You can track your booking status using your reference number at our website.</p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px;">
        <p>MobiMech Mobile Mechanics | Professional Service at Your Doorstep</p>
      </div>
    </div>
  `;

  return sendEmail(customer.email, `Booking Confirmed – ${booking.reference_number}`, html);
}

async function sendStatusUpdate(booking, customer, newStatus) {
  const statusMessages = {
    confirmed: 'Your booking has been confirmed by our team. We\'ll be there on time!',
    'in-progress': 'Our mechanic has started working on your vehicle.',
    completed: 'Great news! The work on your vehicle has been completed.',
    cancelled: 'Your booking has been cancelled. Please contact us if you have questions.',
  };

  const message = statusMessages[newStatus] || `Your booking status has been updated to: ${newStatus}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a2744; padding: 24px; text-align: center;">
        <h1 style="color: #f97316; margin: 0; font-size: 28px;">MOBIMECH</h1>
        <p style="color: #94a3b8; margin: 4px 0 0;">Mobile Mechanic Services</p>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1a2744;">Booking Update</h2>
        <p>Hi ${customer.name},</p>
        <p>${message}</p>

        <div style="background: #f8fafc; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Reference:</strong> ${booking.reference_number}</p>
          <p style="margin: 8px 0 0;"><strong>Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          <p style="margin: 8px 0 0;"><strong>Date:</strong> ${formatDate(booking.scheduled_date)}</p>
          <p style="margin: 8px 0 0;"><strong>Time:</strong> ${formatTime(booking.scheduled_time)}</p>
        </div>

        <p style="color: #64748b; font-size: 14px;">Track your booking at any time using your reference number on our website.</p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px;">
        <p>MobiMech Mobile Mechanics | Professional Service at Your Doorstep</p>
      </div>
    </div>
  `;

  return sendEmail(customer.email, `Booking Update – ${booking.reference_number}`, html);
}

async function sendInvoiceEmail(invoice, booking, customer, services) {
  const serviceRows = services
    .map((s) => `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${s.name}</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${s.price.toFixed(2)}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a2744; padding: 24px; text-align: center;">
        <h1 style="color: #f97316; margin: 0; font-size: 28px;">MOBIMECH</h1>
        <p style="color: #94a3b8; margin: 4px 0 0;">Mobile Mechanic Services</p>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1a2744;">Invoice ${invoice.invoice_number}</h2>
        <p>Hi ${customer.name},</p>
        <p>Here is your invoice for the recently completed service:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 8px; text-align: left;">Service</th>
              <th style="padding: 8px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${serviceRows}
          </tbody>
          <tfoot>
            <tr><td style="padding: 8px; text-align: right;"><strong>Subtotal</strong></td><td style="padding: 8px; text-align: right;">$${invoice.subtotal.toFixed(2)}</td></tr>
            <tr><td style="padding: 8px; text-align: right;"><strong>Tax (${(invoice.tax_rate * 100).toFixed(0)}%)</strong></td><td style="padding: 8px; text-align: right;">$${invoice.tax_amount.toFixed(2)}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; text-align: right; font-size: 18px;"><strong>Total</strong></td><td style="padding: 8px; text-align: right; font-size: 18px;"><strong>$${invoice.total.toFixed(2)}</strong></td></tr>
          </tfoot>
        </table>

        ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>` : ''}

        <p style="color: #64748b; font-size: 14px;">Thank you for choosing MobiMech. We appreciate your business!</p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px;">
        <p>MobiMech Mobile Mechanics | Professional Service at Your Doorstep</p>
      </div>
    </div>
  `;

  return sendEmail(customer.email, `Invoice ${invoice.invoice_number} – MobiMech`, html);
}

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendStatusUpdate,
  sendInvoiceEmail,
};
