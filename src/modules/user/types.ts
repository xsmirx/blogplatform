export type User = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export type UserInputDTO = {
  login: string;
  email: string;
  password: string;
};

export type UserOutputDTO = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};

export type UserDB = {
  login: string;
  email: string;
  saltedHash: string;
  createdAt: Date;
};
