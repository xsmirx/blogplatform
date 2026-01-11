import { body, param } from 'express-validator';

export const idValidation = param('id')
  .exists()
  .withMessage('ID is required')
  .isString()
  .trim()
  .withMessage('ID must be a string')
  .isLength({ min: 1 })
  .withMessage('ID must not be empty')
  .isNumeric()
  .withMessage('ID must be a numeric string');

export const titleValidation = body('title')
  .exists()
  .withMessage('Title is required')
  .isString()
  .trim()
  .withMessage('Title must be a string')
  .isLength({ min: 1, max: 30 })
  .withMessage('Title must be between 1 and 30 characters');

export const shortDescriptionValidation = body('shortDescription')
  .exists()
  .withMessage('Short description is required')
  .isString()
  .trim()
  .withMessage('Short description must be a string')
  .isLength({ min: 1, max: 100 })
  .withMessage('Short description must be between 1 and 100 characters');

export const contentValidation = body('content')
  .exists()
  .withMessage('Content is required')
  .isString()
  .trim()
  .withMessage('Content must be a string')
  .isLength({ min: 1, max: 1000 })
  .withMessage('Content must be between 1 and 1000 characters');

export const blogIdValidation = body('blogId')
  .exists()
  .withMessage('Blog ID is required')
  .isString()
  .trim()
  .withMessage('Blog ID must be a string')
  .isLength({ min: 1 })
  .withMessage('Blog ID must not be empty');

export const postDTOValidation = [
  titleValidation,
  shortDescriptionValidation,
  contentValidation,
  blogIdValidation,
];
