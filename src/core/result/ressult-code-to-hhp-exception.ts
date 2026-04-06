import { ResultStatus } from './result-status';

export const resultCodeToHttpException = (resultCode: ResultStatus): number => {
  switch (resultCode) {
    case ResultStatus.BadRequest:
      return 400;
    case ResultStatus.Forbidden:
      return 403;
    default:
      return 500;
  }
};
