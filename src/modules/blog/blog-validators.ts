import { body, param } from 'express-validator';

export const idValidation = param('id')
  .exists()
  .withMessage('ID is required')
  .isString()
  .trim()
  .withMessage('ID must be a string')
  .isLength({ min: 1 })
  .withMessage('ID must not be empty')
  .isMongoId()
  .withMessage('ID must be a valid Mongo ID');

export const nameValidation = body('name')
  .exists()
  .withMessage('Name is required')
  .isString()
  .trim()
  .withMessage('Name must be a string')
  .isLength({ min: 1, max: 15 })
  .withMessage('Name must be between 1 and 15 characters');

export const descriptionValidation = body('description')
  .exists()
  .withMessage('Description is required')
  .isString()
  .trim()
  .withMessage('Description must be a string')
  .isLength({ min: 1, max: 500 })
  .withMessage('Description must be between 1 and 500 characters');

export const websiteUrlValidation = body('websiteUrl')
  .exists()
  .withMessage('Website URL is required')
  .isString()
  .trim()
  .withMessage('Website URL must be a string')
  .isLength({ min: 1, max: 100 })
  .withMessage('Website URL must be between 1 and 100 characters')
  .isURL({ protocols: ['https'], require_protocol: true })
  .withMessage('Website URL must be a valid URL');

export const blogDTOValidation = [
  nameValidation,
  descriptionValidation,
  websiteUrlValidation,
];
