import nodemailer from 'nodemailer';
import { settings } from '../../../core/settings/settings';

export class MailService {
  async sendEmail(
    email: string,
    code: string,
    template: (code: string) => string,
  ): Promise<boolean> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: settings.EMAIL_ADDRESS,
        clientId: settings.GOOGLE_CLIENT_ID,
        clientSecret: settings.GOOGLE_CLIENT_SECRET,
        refreshToken: settings.GOOGLE_REFRESH_TOKEN,
      },
    });

    const info = await transporter.sendMail({
      from: `"Kek 👻" <${settings.EMAIL_ADDRESS}>`,
      to: email,
      subject: 'Your code is here',
      html: template(code), // html body
    });

    return !!info;
  }
}

export const mailService = new MailService();
