import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendExpiryNotification(domains: Array<{
  domain: string;
  sslDaysRemaining: number;
  domainExpiryDate?: string;
  registrar?: string;
}>) {
  const settings = await prisma.settings.findFirst();
  const recipients = settings?.recipients || [process.env.RECIPIENT_EMAIL];
  
  // Separate domains based on warning type
  const sslWarningDomains = domains.filter(d => d.sslDaysRemaining <= (settings?.sslWarningThreshold || 20));
  const domainWarningDomains = domains.filter(d => {
    if (!d.domainExpiryDate) return false;
    const daysRemaining = Math.ceil((new Date(d.domainExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= (settings?.domainWarningThreshold || 30);
  });

  const htmlContent = `
    <h2>SSL Certificate Expiry Warnings</h2>
    <p>SSL Warning Threshold: ${settings?.sslWarningThreshold} days</p>
    <table style="border-collapse: collapse; width: 100%; margin-bottom: 30px;">
      <tr style="background-color: #f2f2f2;">
        <th style="border: 1px solid #ddd; padding: 8px;">Domain</th>
        <th style="border: 1px solid #ddd; padding: 8px;">SSL Days Remaining</th>
        <th style="border: 1px solid #ddd; padding: 8px;">SSL Issuer</th>
      </tr>
      ${sslWarningDomains.map(d => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${d.domain}</td>
          <td style="border: 1px solid #ddd; padding: 8px; ${d.sslDaysRemaining <= 7 ? 'color: red;' : ''}">${d.sslDaysRemaining} days</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${d.registrar || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>

    <h2>Domain Expiry Warnings</h2>
    <p>Domain Warning Threshold: ${settings?.domainWarningThreshold} days</p>
    <table style="border-collapse: collapse; width: 100%;">
      <tr style="background-color: #f2f2f2;">
        <th style="border: 1px solid #ddd; padding: 8px;">Domain</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Domain Expiry Date</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Days Remaining</th>
        <th style="border: 1px solid #ddd; padding: 8px;">Registrar</th>
      </tr>
      ${domainWarningDomains.map(d => {
        const daysRemaining = Math.ceil((new Date(d.domainExpiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.domain}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${new Date(d.domainExpiryDate!).toLocaleDateString()}</td>
            <td style="border: 1px solid #ddd; padding: 8px; ${daysRemaining <= 7 ? 'color: red;' : ''}">${daysRemaining} days</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.registrar || 'N/A'}</td>
          </tr>
        `;
      }).join('')}
    </table>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipients.join(', '),
    subject: 'Domain ve SSL Sertifikası Durumu',
    html: htmlContent,
  });
}
