const nodemailer = require("nodemailer");

module.exports.sendEmail = async (options) => {
  // 1) Create the transporter (The "Engine")
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "9f5e26722f639d", // Use process.env in production!
      pass: "5277ef600d4ff3",
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: '"Hotel Booking System" <reservations@yourhotel.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `<div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px;">
            <h2>Booking Confirmed!</h2>
            <p>${options.message}</p>
            <footer style="margin-top: 20px; font-size: 0.8em; color: #777;">
              Thank you for choosing our hotel.
            </footer>
          </div>`,
  };

  // 3) Send the email
  await transporter.sendMail(mailOptions);
};
