import nodemailer from 'nodemailer';
import { settings } from '../settings/settings';

export class MailService {
  async sendEmail(
    email: string,
    code: string,
    template: (code: string) => string,
  ): Promise<boolean> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: settings.EMAIL_ADDRESS,
        pass: settings.EMAIL_PASSWORD,
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
