import { body, param } from 'express-validator';

export const commentIdValidation = param('id')
  .isString()
  .withMessage('Comment id must be a string')
  .notEmpty()
  .withMessage('Comment id is required')
  .isMongoId()
  .withMessage('Comment id must be a valid MongoDB ObjectId');

export const commentContentValidation = body('content')
  .exists()
  .withMessage('Content is required')
  .isString()
  .withMessage('Content must be a string')
  .trim()
  .isLength({ min: 20, max: 300 })
  .withMessage('Content must be between 20 and 300 characters');
