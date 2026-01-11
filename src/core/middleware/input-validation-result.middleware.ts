import { Handler } from 'express';
import { FieldValidationError, validationResult } from 'express-validator';
import { ValidationError } from '../types/validation-error';

export const createErrorsMessages = (errors: ValidationError[]) => ({
  errorsMessages: errors,
});

export const inputValidationResultMiddleware: Handler = (req, res, next) => {
  const errors = validationResult(req)
    .formatWith((error) => {
      const expressError = error as FieldValidationError;
      return {
        field: expressError.path,
        message: expressError.msg,
      };
    })
    .array({ onlyFirstError: true });

  if (errors.length > 0) {
    res.status(400).json(createErrorsMessages(errors));
  } else {
    next();
  }
};
