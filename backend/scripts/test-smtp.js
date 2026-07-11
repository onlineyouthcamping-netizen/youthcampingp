require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Testing SMTP Connection...");
console.log("Host:", process.env.SMTP_HOST);
console.log("User:", process.env.SMTP_USER);
console.log("Pass starts with:", process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 5) + '...' : "MISSING");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT == '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP ERROR:");
    console.error(error);
  } else {
    console.log("✅ SMTP READY");
  }
});
