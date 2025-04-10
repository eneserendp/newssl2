import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';

export async function sendExpiryNotification(domains: Array<{
  domain: string;
  sslDaysRemaining: number;
  domainExpiryDate?: string;
  registrar?: string;
}>) {
  // Email ayarlarını kontrol et
  const settings = await prisma.settings.findFirst();
  if (!settings?.recipients || settings.recipients.length === 0) {
    throw new Error('No recipients configured in settings');
  }

  // Email ayarlarını logla
  console.log('Email configuration:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.EMAIL_USER,
    recipients: settings.recipients
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true // Debug modunu aç
  });

  // Transporter'ı verify et
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
  } catch (error) {
    console.error('SMTP verification failed:', error);
    throw error;
  }

  // SSL ve Domain uyarılarını ayır
  const sslWarnings = domains.filter(d => d.sslDaysRemaining <= 30);
  const domainWarnings = domains.filter(d => d.domainExpiryDate);

  // Email içeriğini oluştur
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      ${sslWarnings.length > 0 ? `
        <h2 style="color: #e11d48; padding-bottom: 10px; border-bottom: 2px solid #e11d48;">
          SSL Certificate Expiry Warnings
        </h2>
        <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 30px;">
          <tr style="background-color: #f8fafc;">
            <th style="padding: 12px; text-align: left;">Domain</th>
            <th style="padding: 12px; text-align: left;">SSL Expiry</th>
            <th style="padding: 12px; text-align: left;">Status</th>
          </tr>
          ${sslWarnings.map(domain => `
            <tr>
              <td style="padding: 12px;">${domain.domain}</td>
              <td style="padding: 12px;">${domain.sslDaysRemaining} days remaining</td>
              <td style="padding: 12px;">
                <span style="color: ${domain.sslDaysRemaining <= 7 ? '#ef4444' : '#eab308'};">
                  ${domain.sslDaysRemaining <= 7 ? 'Critical' : 'Warning'}
                </span>
              </td>
            </tr>
          `).join('')}
        </table>
      ` : ''}

      ${domainWarnings.length > 0 ? `
        <h2 style="color: #6366f1; padding-bottom: 10px; border-bottom: 2px solid #6366f1; margin-top: 30px;">
          Domain Expiry Warnings
        </h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f8fafc;">
            <th style="padding: 12px; text-align: left;">Domain</th>
            <th style="padding: 12px; text-align: left;">Expiry Date</th>
            <th style="padding: 12px; text-align: left;">Registrar</th>
          </tr>
          ${domainWarnings.map(domain => `
            <tr>
              <td style="padding: 12px;">${domain.domain}</td>
              <td style="padding: 12px;">${domain.domainExpiryDate ? new Date(domain.domainExpiryDate).toLocaleDateString('tr-TR') : 'N/A'}</td>
              <td style="padding: 12px;">${domain.registrar || 'N/A'}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}

      <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <p style="margin: 0; color: #64748b;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: settings.recipients.join(', '),
      subject: `Domain Uyarıları - SSL: ${sslWarnings.length}, Domain: ${domainWarnings.length}`,
      html: emailContent,
      priority: 'high'
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      sslWarnings: sslWarnings.length,
      domainWarnings: domainWarnings.length,
      recipients: settings.recipients
    });

    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
