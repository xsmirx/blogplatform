import { body, param } from 'express-validator';

export const idValidation = param('id')
  .exists()
  .withMessage('ID is required')
  .isString()
  .withMessage('ID must be a string')
  .isLength({ min: 1 })
  .withMessage('ID must not be empty')
  .isNumeric()
  .withMessage('ID must be a numeric string');

export const nameValidation = body('name')
  .exists()
  .withMessage('Name is required')
  .isString()
  .withMessage('Name must be a string')
  .isLength({ min: 1, max: 15 })
  .withMessage('Name must be between 1 and 15 characters');

export const descriptionValidation = body('description')
  .exists()
  .withMessage('Description is required')
  .isString()
  .withMessage('Description must be a string')
  .isLength({ min: 1, max: 500 })
  .withMessage('Description must be between 1 and 500 characters');

export const websiteUrlValidation = body('websiteUrl')
  .exists()
  .withMessage('Website URL is required')
  .isString()
  .withMessage('Website URL must be a string')
  .isLength({ min: 1, max: 100 })
  .withMessage('Website URL must be between 1 and 100 characters')
  .isURL()
  .withMessage('Website URL must be a valid URL');

export const blogDTOValidation = [
  nameValidation,
  descriptionValidation,
  websiteUrlValidation,
];
