import { body, validationResult } from 'express-validator';

export const validateFarmerProfile = [
  body('name').notEmpty().trim(),
  body('phone').isMobilePhone().optional(),
  body('email').isEmail().optional(),
  body('location.state').notEmpty().trim().optional(),
  body('farmDetails.totalArea').isNumeric().optional(),
  body('farmDetails.farmerType').isIn(['marginal', 'small', 'medium', 'large']).optional()
];

export const validateImageUpload = [
  body('cropName').notEmpty().trim(),
  body('description').optional().trim()
];

export const validateSchemeQuery = [
  body('farmerType').isIn(['marginal', 'small', 'medium', 'large']).optional(),
  body('landSize').isNumeric().optional(),
  body('state').trim().optional(),
  body('cropTypes').isArray().optional()
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
