import nodemailer from 'nodemailer';
import config from '../config';
import { errorLogger, logger } from '../shared/logger';
import { ISendEmail } from '../types/email';
import { TContact } from '../app/modules/contact/contact.interface';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: Number(config.email.port),
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const sendEmail = async (values: ISendEmail) => {
  try {
    const info = await transporter.sendMail({
      from: `"Duty Hour Application" ${config.email.from}`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    });

    logger.info('Mail send successfully', info.accepted);
  } catch (error) {
    errorLogger.error('Email', error);
  }
};

const sendContactMessage = async (data: TContact) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="background-color: #336c79; padding: 20px; color: #ffffff;">
        <h2 style="margin: 0;">📨 New Contact Form Submission</h2>
        <p style="margin: 4px 0 0; font-size: 14px;">from ${data.firstName} ${data.lastName}</p>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        <table style="width: 100%; font-size: 15px; color: #333; line-height: 1.5;">
          <tr>
            <td style="font-weight: bold; width: 120px;">Full Name:</td>
            <td>${data.firstName} ${data.lastName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Email:</td>
            <td><a href="mailto:${data.email}" style="color: #336c79;">${data.email}</a></td>
          </tr>
          ${data.phone
      ? `
          <tr>
            <td style="font-weight: bold;">Phone:</td>
            <td>${data.phone}</td>
          </tr>`
      : ''
    }
          <tr>
            <td style="font-weight: bold;">Subject:</td>
            <td>${data.subject}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; vertical-align: top;">Message:</td>
            <td style="white-space: pre-line;">${data.message}</td>
          </tr>
        </table>
      </div>
      <div style="background-color: #eee; text-align: center; padding: 12px 20px; font-size: 13px; color: #666;">
        This message was submitted through your Duty Hour Tracking App
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${data.firstName} ${data.lastName}" <${data.email}>`,
      to: config.email.from,
      subject: `Contact Form: ${data.subject}`,
      html: htmlContent,
    });

    logger.info('Contact form email sent', info.accepted);
  } catch (error) {
    errorLogger.error('Contact form email failed', error);
    throw new Error('Failed to send contact form message');
  }
};

export const emailHelper = {
  sendEmail,
  sendContactMessage,
};
