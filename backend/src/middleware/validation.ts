import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

// Validation middleware wrapper
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
    return;
  }
  next();
};

// Validate analysis request
export const validateAnalysisRequest = [
  (req: Request, res: Response, next: NextFunction): void => {
    // Check if files are present
    if (!req.files || typeof req.files !== 'object') {
      res.status(400).json({
        error: 'Missing files',
        message: 'Both resume and job description files are required',
      });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files.resume || files.resume.length === 0) {
      res.status(400).json({
        error: 'Missing resume',
        message: 'Resume file is required',
      });
      return;
    }

    if (!files.jobDescription || files.jobDescription.length === 0) {
      res.status(400).json({
        error: 'Missing job description',
        message: 'Job description file is required',
      });
      return;
    }

    next();
  },
];

// Validate analysis ID
export const validateAnalysisId = [
  param('analysisId')
    .isString()
    .notEmpty()
    .withMessage('Analysis ID is required')
    .isAlphanumeric()
    .withMessage('Invalid analysis ID format'),
  validate,
]; 