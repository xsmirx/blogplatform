export type LoginInputDTO = {
  loginOrEmail: string;
  password: string;
};

export type LoginOutputDTO = {
  accessToken: string;
};

export type MeOutputDTO = {
  userId: string;
  login: string;
  email: string;
};

export type RegistrationConfirmationInputDTO = {
  code: string;
};

export type RegistrationInputDTO = {
  login: string;
  password: string;
  email: string;
};

export type RegistrationEmailResendingInputDTO = {
  email: string;
};
