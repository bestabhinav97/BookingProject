/**
 * ========== EMAIL UTILITY ==========
 * Sends email notifications (confirmations, receipts, etc.)
 * Uses Mailtrap (email testing service) for development
 */

const nodemailer = require("nodemailer");

/**
 * sendEmail - Send an email notification
 *
 * CALLED BY: Stripe webhook after successful payment confirmation
 *
 * @param {object} options - Email configuration
 *   - email: Recipient email address
 *   - subject: Email subject line
 *   - message: Plain text message / body content
 *
 * FLOW:
 * 1. Create transporter (SMTP configuration for email provider)
 * 2. Define mail options (from, to, subject, body)
 * 3. Send email asynchronously
 *
 * NOTE: Using Mailtrap for development (sandbox, not real delivery)
 *       Replace with production email service (SendGrid, AWS SES, etc.) for production
 */
module.exports.sendEmail = async (options) => {
  // ===== CREATE TRANSPORTER (Email Provider Configuration) =====
  // Mailtrap is an email testing tool (Dev/Staging environment)
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "9f5e26722f639d", // Mailtrap credentials (should be in .env!)
      pass: "5277ef600d4ff3",
    },
  });

  // ===== DEFINE EMAIL OPTIONS =====
  const mailOptions = {
    // Sender (appears as "From" in recipient's email)
    from: '"Hotel Booking System" <reservations@yourhotel.com>',
    // Recipient
    to: options.email,
    // Subject line
    subject: options.subject,
    // Plain text version (fallback for older email clients)
    text: options.message,
    // HTML version (rendered in modern email clients)
    html: `<div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
            <h2>Booking Confirmed!</h2>
            <p>${options.message}</p>
            <footer style="margin-top: 20px; font-size: 0.8em; color: #777;">
              Thank you for choosing our hotel.
            </footer>
          </div>`,
  };

  // ===== SEND EMAIL =====
  // Await ensures email is sent before function returns
  await transporter.sendMail(mailOptions);
};
