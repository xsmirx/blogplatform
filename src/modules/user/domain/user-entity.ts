import { randomUUID } from 'crypto';

export class User {
  login: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  emailConfirmation: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };

  constructor(login: string, email: string, hash: string) {
    this.login = login;
    this.email = email;
    this.passwordHash = hash;
    this.createdAt = new Date();
    this.emailConfirmation = {
      expirationDate: new Date(),
      confirmationCode: randomUUID(),
      isConfirmed: false,
    };
  }
}
