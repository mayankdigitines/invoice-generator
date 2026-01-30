const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendSubscriptionExpiryEmail = async (email, businessName, expiryDate) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const supportEmail = process.env.SUPPORT_EMAIL || 'admin@invoicegenerator.com';
  const supportPhone = process.env.SUPPORT_PHONE || '+1 (555) 123-4567';

  const mailOptions = {
    from: `"Invoice Generator Support" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: `Action Required: Your Subscription Expires Soon`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
              .header { background-color: #2c3e50; color: #ffffff; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
              .warning-box { background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .warning-text { color: #856404; font-weight: bold; }
              .details { margin: 20px 0; background-color: #f8f9fa; padding: 20px; border-radius: 6px; }
              .details p { margin: 10px 0; border-bottom: 1px solid #e9ecef; padding-bottom: 10px; }
              .details p:last-child { border-bottom: none; }
              .button-container { text-align: center; margin-top: 30px; }
              .cta-button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; transition: background-color 0.3s; }
              .cta-button:hover { background-color: #2980b9; }
              .footer { background-color: #e9ecef; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
              .contact-info { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Subscription Expiry Notice</h1>
              </div>
              <div class="content">
                  <p>Hello <strong>${businessName}</strong>,</p>
                  
                  <p>We hope you are enjoying using our Invoice Generator services. This is a reminder that your subscription is approaching its expiration date.</p>
                  
                  <div class="warning-box">
                      <p class="warning-text">Your subscription will expire on: <br/> <span style="font-size: 1.2em; color: #d35400;">${formattedDate}</span></p>
                  </div>

                  <p>To avoid any interruption in your service and continue generating professional invoices seamlessly, we recommend renewing your subscription before the expiry date.</p>

                  <div class="details">
                      <h3 style="margin-top:0;">Account Status</h3>
                      <p><strong>Business Name:</strong> ${businessName}</p>
                      <p><strong>Expiration Date:</strong> ${formattedDate}</p>
                  </div>

                  <div class="contact-info">
                      <h3>How to Renew?</h3>
                      <p>To renew your subscription, please contact our Super Admin team directly. We are here to assist you with the process.</p>
                      <p><strong>Email:</strong> <a href="mailto:${supportEmail}">${supportEmail}</a></p>
                      <p><strong>Phone:</strong> ${supportPhone}</p>
                  </div>
                  
                  <div class="button-container">
                      <a href="mailto:${supportEmail}?subject=Subscription Renewal for ${businessName}" class="cta-button">Contact Admin to Renew</a>
                  </div>
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Invoice Generator. All rights reserved.</p>
                  <p>This is an automated message. Please do not reply directly to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Expiry email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    return false;
  }
};

module.exports = {
  sendSubscriptionExpiryEmail,
};
