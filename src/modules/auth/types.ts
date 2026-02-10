export type LoginInputDTO = {
  loginOrEmail: string;
  password: string;
};

export type LoginOutputDTO = {
  accessToken: string;
};
