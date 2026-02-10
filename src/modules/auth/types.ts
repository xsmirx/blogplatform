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
